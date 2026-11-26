-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).
-- Server Owner Program: roles, owner applications, servers, audit log, announcements.
--
-- WARNING: this DESTROYS all existing rows in public.servers (the table is dropped and
-- recreated without the old status / consent columns).
--
-- After running it, make yourself admin:
--   insert into public.user_roles (user_id, role) values ('<your auth uid>', 'admin');
--
-- Everything below the drop is re-runnable (create ... if not exists, drop policy if exists,
-- create or replace function).

drop table if exists public.servers cascade;

-- ---------------------------------------------------------------- tables

-- No row = player. Written only by the admin RPCs (no write grants for anyone).
create table if not exists public.user_roles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  role             text not null check (role in ('owner', 'admin')),
  owner_status     text check (owner_status in ('active', 'suspended')),
  discord_id       text,
  discord_username text,
  updated_at       timestamptz not null default now()
);

create table if not exists public.owner_applications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  discord_id        text,
  discord_username  text,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason     text check (reject_reason is null or char_length(reject_reason) between 1 and 200),
  reviewed_by       uuid references auth.users(id) on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  server_name       text not null check (char_length(server_name) <= 48),
  server_address    text not null check (server_address = lower(server_address)
    and char_length(server_address) <= 260
    and server_address ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?$'),
  edition           text not null check (edition in ('java', 'bedrock', 'both')),
  server_about      text not null check (char_length(server_about) <= 500),
  play_styles       text[] not null check (cardinality(play_styles) between 1 and 8
    and play_styles <@ array['survival','creative','redstone','pvp','minigames','roleplay','building','adventure']),
  play_styles_other text check (play_styles_other is null or char_length(play_styles_other) <= 40),
  player_base_size  text not null check (player_base_size in ('<10', '10-50', '50-200', '200+')),
  community_size    text not null check (community_size in ('<10', '10-50', '50-200', '200+')),
  running_since     date not null check (running_since <= current_date),
  discord_link      text not null check (discord_link ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9_-]+$'),
  why_join          text not null check (char_length(why_join) <= 500)
);

create unique index if not exists owner_applications_one_pending
  on public.owner_applications (user_id) where status = 'pending';

-- Always freshly created (dropped above).
create table public.servers (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null check (char_length(name) <= 48),
  address        text not null unique check (address = lower(address)),
  edition        text not null check (edition in ('java', 'bedrock', 'both')),
  description    text check (description is null or char_length(description) <= 200),
  play_styles    text[] not null default '{}',
  discord_invite text,
  is_hidden      boolean not null default false,
  hidden_reason  text check (hidden_reason is null or char_length(hidden_reason) between 1 and 200),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- The website validates these too; the database enforces them for direct API calls.
  constraint servers_address_format
    check (char_length(address) <= 260 and address ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?$'),
  constraint servers_invite_format
    check (discord_invite is null or discord_invite ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9_-]+$'),
  constraint servers_play_styles_valid
    check (cardinality(play_styles) between 1 and 8
      and play_styles <@ array['survival','creative','redstone','pvp','minigames','roleplay','building','adventure'])
);

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  server_id   uuid,
  server_name text,
  actor_id    uuid,
  action      text not null check (action in (
    'server_create', 'server_update', 'server_delete', 'server_hide', 'server_unhide',
    'owner_suspend', 'owner_reinstate', 'application_approve', 'application_reject',
    'announce_failed')),
  field       text,
  old_value   text,
  new_value   text,
  is_flagged  boolean not null default false,
  reviewed    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_review_idx
  on public.audit_log (reviewed, is_flagged, created_at desc);

create table if not exists public.announced_addresses (
  address      text primary key,
  server_id    uuid,
  announced_at timestamptz not null default now(),
  last_error   text
);

-- Added here, not inline: dropping servers (cascade) on a re-run removes these FKs.
alter table public.audit_log drop constraint if exists audit_log_server_id_fkey;
alter table public.audit_log add constraint audit_log_server_id_fkey
  foreign key (server_id) references public.servers(id) on delete set null;
alter table public.announced_addresses drop constraint if exists announced_addresses_server_id_fkey;
alter table public.announced_addresses add constraint announced_addresses_server_id_fkey
  foreign key (server_id) references public.servers(id) on delete set null;

-- ---------------------------------------------------------------- helpers

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'
  );
$$;

create or replace function public.owner_is_active(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = uid and r.role = 'owner' and r.owner_status = 'active'
  );
$$;

create or replace function public.is_active_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.owner_is_active(auth.uid());
$$;

grant execute on function public.is_admin(), public.is_active_owner(), public.owner_is_active(uuid)
  to anon, authenticated;

-- ---------------------------------------------------------------- grants
-- Supabase grants ALL on new public tables to anon/authenticated by default; start from nothing.

revoke all on public.user_roles, public.owner_applications, public.servers,
  public.audit_log, public.announced_addresses from anon, authenticated;

grant select (id, owner_id, name, address, edition, description, play_styles, discord_invite,
  is_hidden, hidden_reason, created_at, updated_at) on public.servers to anon, authenticated;
-- Column protection: owner_id / is_hidden / hidden_reason are not user-writable.
grant insert (name, address, edition, description, play_styles, discord_invite),
  update (name, address, edition, description, play_styles, discord_invite),
  delete on public.servers to authenticated;

grant select on public.owner_applications to authenticated;
-- Form fields only: user_id comes from its default, review fields can't be set.
grant insert (server_name, server_address, edition, server_about, play_styles, play_styles_other,
  player_base_size, community_size, running_since, discord_link, why_join)
  on public.owner_applications to authenticated;

grant select on public.user_roles, public.audit_log to authenticated;
-- announced_addresses: no API access (RPCs only).

-- ---------------------------------------------------------------- RLS

alter table public.user_roles enable row level security;
alter table public.owner_applications enable row level security;
alter table public.servers enable row level security;
alter table public.audit_log enable row level security;
alter table public.announced_addresses enable row level security;

-- servers (policies were dropped with the table; drop-if-exists kept for symmetry)
drop policy if exists "read servers" on public.servers;
create policy "read servers" on public.servers
  for select to anon, authenticated
  using ((not is_hidden and public.owner_is_active(owner_id))
    or owner_id = auth.uid() or public.is_admin());

drop policy if exists "insert own server" on public.servers;
create policy "insert own server" on public.servers
  for insert to authenticated
  with check (owner_id = auth.uid() and public.is_active_owner());

drop policy if exists "update own server" on public.servers;
create policy "update own server" on public.servers
  for update to authenticated
  using (owner_id = auth.uid() and public.is_active_owner())
  with check (owner_id = auth.uid() and public.is_active_owner());

drop policy if exists "delete own server or admin" on public.servers;
create policy "delete own server or admin" on public.servers
  for delete to authenticated
  using ((owner_id = auth.uid() and public.is_active_owner()) or public.is_admin());

-- owner_applications
drop policy if exists "read own application or admin" on public.owner_applications;
create policy "read own application or admin" on public.owner_applications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "insert own pending application" on public.owner_applications;
create policy "insert own pending application" on public.owner_applications
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending'
    and not exists (select 1 from public.user_roles r where r.user_id = auth.uid()));

-- user_roles
drop policy if exists "read own role or admin" on public.user_roles;
create policy "read own role or admin" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- audit_log
drop policy if exists "admin reads audit log" on public.audit_log;
create policy "admin reads audit log" on public.audit_log
  for select to authenticated
  using (public.is_admin());
