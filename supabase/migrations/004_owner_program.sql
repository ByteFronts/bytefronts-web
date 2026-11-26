-- DO NOT RE-RUN AFTER LAUNCH: this drops and recreates public.servers and deletes every listed server.
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).
-- Server Owner Program: roles, owner applications, servers, audit log, announcements.
--
-- WARNING: this DESTROYS all existing rows in public.servers (the table is dropped and
-- recreated without the old status / consent columns).
--
-- After running it, make yourself admin:
--   insert into public.user_roles (user_id, role, discord_username) values ('<your auth uid>', 'admin', '<your discord name>');
--
-- Safe to re-run only on a database with no real servers (e.g. while testing).

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
  server_name       text not null check (char_length(btrim(server_name)) >= 1 and char_length(server_name) <= 48),
  server_address    text not null check (server_address = lower(server_address)
    and char_length(server_address) <= 260
    and server_address ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?$'),
  edition           text not null check (edition in ('java', 'bedrock', 'both')),
  server_about      text not null check (char_length(btrim(server_about)) >= 1 and char_length(server_about) <= 500),
  play_styles       text[] not null check (cardinality(play_styles) between 1 and 8
    and play_styles <@ array['survival','creative','redstone','pvp','minigames','roleplay','building','adventure']),
  play_styles_other text check (play_styles_other is null or char_length(play_styles_other) <= 40),
  player_base_size  text not null check (player_base_size in ('<10', '10-50', '50-200', '200+')),
  community_size    text not null check (community_size in ('<10', '10-50', '50-200', '200+')),
  running_since     date not null check (running_since <= current_date),
  discord_link      text not null check (discord_link ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9_-]+$'),
  why_join          text not null check (char_length(btrim(why_join)) >= 1 and char_length(why_join) <= 500)
);

create unique index if not exists owner_applications_one_pending
  on public.owner_applications (user_id) where status = 'pending';

-- Always freshly created (dropped above).
create table public.servers (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null check (char_length(btrim(name)) >= 1 and char_length(name) <= 48),
  address        text not null unique check (address = lower(address)),
  edition        text not null check (edition in ('java', 'bedrock', 'both')),
  description    text check (description is null or char_length(description) <= 200),
  play_styles    text[] not null,
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
-- On a re-run the old server ids no longer exist; clear them so the FKs can be re-added.
update public.audit_log a set server_id = null
  where a.server_id is not null and not exists (select 1 from public.servers s where s.id = a.server_id);
update public.announced_addresses a set server_id = null
  where a.server_id is not null and not exists (select 1 from public.servers s where s.id = a.server_id);
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
  -- not is_hidden: deleting and re-adding the address would undo an admin hide.
  using ((owner_id = auth.uid() and public.is_active_owner() and not is_hidden) or public.is_admin());

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

-- ---------------------------------------------------------------- triggers
-- All security definer: they write audit_log / read auth.identities, which callers can't.
-- auth.uid() still reads the caller's JWT, so actor_id is the real user (or admin via an RPC).

-- Discord ID/name come from the login identity, never from the form (same name order as
-- getDiscordIdentity in the app).
create or replace function public.owner_applications_set_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.user_id := auth.uid();
  select i.provider_id,
         coalesce(nullif(i.identity_data->'custom_claims'->>'global_name', ''),
                  nullif(i.identity_data->>'full_name', ''),
                  nullif(i.identity_data->>'name', ''),
                  nullif(i.identity_data->>'user_name', ''),
                  nullif(i.identity_data->>'preferred_username', ''),
                  i.provider_id)
    into new.discord_id, new.discord_username
    from auth.identities i
    where i.user_id = new.user_id and i.provider = 'discord'
    limit 1;
  if new.discord_id is null then
    raise exception 'no_discord_identity';
  end if;
  return new;
end $$;

create or replace trigger owner_applications_set_identity
  before insert on public.owner_applications
  for each row execute function public.owner_applications_set_identity();

alter table public.owner_applications alter column discord_id set not null;
alter table public.owner_applications alter column discord_username set not null;

create or replace function public.owner_applications_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('approved', 'rejected') then
    insert into public.audit_log (server_name, actor_id, action, new_value)
    values (new.server_name, auth.uid(),
      case new.status when 'approved' then 'application_approve' else 'application_reject' end,
      new.reject_reason);
  end if;
  return null;
end $$;

create or replace trigger owner_applications_audit
  after update of status on public.owner_applications
  for each row when (old.status is distinct from new.status)
  execute function public.owner_applications_audit();

create or replace function public.user_roles_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor_id, action, field, new_value)
  values (auth.uid(),
    case new.owner_status when 'suspended' then 'owner_suspend' else 'owner_reinstate' end,
    'user_id', new.user_id::text);
  return null;
end $$;

create or replace trigger user_roles_audit
  after update of owner_status on public.user_roles
  for each row when (old.owner_status is distinct from new.owner_status and new.owner_status is not null)
  execute function public.user_roles_audit();

-- Server cap. The advisory lock serialises concurrent inserts by the same owner.
create or replace function public.servers_enforce_cap() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.owner_id::text));
  if (select count(*) from public.servers s where s.owner_id = new.owner_id) >= 5 then  -- MAX_SERVERS_PER_OWNER
    raise exception 'server_limit';
  end if;
  return new;
end $$;

create trigger servers_enforce_cap
  before insert on public.servers
  for each row execute function public.servers_enforce_cap();

create or replace function public.servers_touch() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger servers_touch
  before update on public.servers
  for each row execute function public.servers_touch();

create or replace function public.servers_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (server_id, server_name, actor_id, action, new_value)
    values (new.id, new.name, auth.uid(), 'server_create', new.address);
  elsif tg_op = 'DELETE' then
    -- server_id stays null: the row is gone, so the FK can't point at it.
    insert into public.audit_log (server_name, actor_id, action, old_value)
    values (old.name, auth.uid(), 'server_delete', old.address);
  else
    if old.is_hidden is distinct from new.is_hidden then
      insert into public.audit_log (server_id, server_name, actor_id, action, new_value)
      values (new.id, new.name, auth.uid(),
        case when new.is_hidden then 'server_hide' else 'server_unhide' end, new.hidden_reason);
    end if;
    insert into public.audit_log (server_id, server_name, actor_id, action, field, old_value, new_value, is_flagged)
    select new.id, new.name, auth.uid(), 'server_update', c.field, c.old_value, c.new_value, c.field = 'address'
    from (values
      ('name', old.name, new.name),
      ('address', old.address, new.address),
      ('edition', old.edition, new.edition),
      ('description', old.description, new.description),
      ('play_styles', old.play_styles::text, new.play_styles::text),
      ('discord_invite', old.discord_invite, new.discord_invite)
    ) c(field, old_value, new_value)
    where c.old_value is distinct from c.new_value;
  end if;
  return null;
end $$;

create trigger servers_audit
  after insert or update or delete on public.servers
  for each row execute function public.servers_audit();

revoke execute on function public.owner_applications_set_identity(), public.owner_applications_audit(),
  public.user_roles_audit(), public.servers_enforce_cap(), public.servers_touch(), public.servers_audit()
  from public, anon, authenticated;

-- ---------------------------------------------------------------- RPCs
-- Admin writes go through these (column grants block admins too). Errors the app maps:
-- 'forbidden', 'not_pending', 'server_limit' (cap trigger).

create or replace function public.approve_application(app_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare app public.owner_applications;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into app from public.owner_applications a where a.id = app_id for update;
  if not found then raise exception 'not_found'; end if;
  if app.status <> 'pending' then raise exception 'not_pending'; end if;
  update public.owner_applications a
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where a.id = app_id;
  insert into public.user_roles (user_id, role, owner_status, discord_id, discord_username)
    values (app.user_id, 'owner', 'active', app.discord_id, app.discord_username);
end $$;

create or replace function public.reject_application(app_id uuid, reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare app_status text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if coalesce(char_length(btrim(reason)), 0) = 0 then raise exception 'reason_required'; end if;
  select a.status into app_status from public.owner_applications a where a.id = app_id for update;
  if not found then raise exception 'not_found'; end if;
  if app_status <> 'pending' then raise exception 'not_pending'; end if;
  update public.owner_applications a  -- check constraint enforces reason <= 200
    set status = 'rejected', reject_reason = btrim(reason), reviewed_by = auth.uid(), reviewed_at = now()
    where a.id = app_id;
end $$;

create or replace function public.set_server_hidden(server_id uuid, hidden boolean, reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if hidden and coalesce(char_length(btrim(reason)), 0) = 0 then raise exception 'reason_required'; end if;
  update public.servers s  -- check constraint enforces reason <= 200
    set is_hidden = hidden, hidden_reason = case when hidden then btrim(reason) end
    where s.id = set_server_hidden.server_id;
  if not found then raise exception 'not_found'; end if;
end $$;

create or replace function public.set_owner_status(target uuid, status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if status not in ('active', 'suspended') then raise exception 'invalid_status'; end if;
  update public.user_roles r
    set owner_status = set_owner_status.status, updated_at = now()
    where r.user_id = target and r.role = 'owner';
  if not found then raise exception 'not_owner'; end if;
end $$;

create or replace function public.mark_audit_reviewed(ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.audit_log a set reviewed = true where a.id = any(ids);
end $$;

-- True only the first time an address is announced (claimed before posting, so a
-- double submit can't post twice; deleting and re-adding the address doesn't re-post).
create or replace function public.claim_announcement(p_server_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare addr text;
begin
  select s.address into addr from public.servers s where s.id = p_server_id and s.owner_id = auth.uid();
  if not found then raise exception 'forbidden'; end if;
  insert into public.announced_addresses (address, server_id) values (addr, p_server_id)
    on conflict (address) do nothing;
  return found;
end $$;

create or replace function public.record_announcement_error(p_server_id uuid, error text) returns void
language plpgsql security definer set search_path = '' as $$
declare srv public.servers;
begin
  select * into srv from public.servers s where s.id = p_server_id and s.owner_id = auth.uid();
  if not found then raise exception 'forbidden'; end if;
  update public.announced_addresses a set last_error = left(error, 500) where a.address = srv.address;
  insert into public.audit_log (server_id, server_name, actor_id, action, new_value)
    values (srv.id, srv.name, auth.uid(), 'announce_failed', left(error, 500));
end $$;

revoke execute on function public.approve_application(uuid), public.reject_application(uuid, text),
  public.set_server_hidden(uuid, boolean, text), public.set_owner_status(uuid, text),
  public.mark_audit_reviewed(uuid[]), public.claim_announcement(uuid),
  public.record_announcement_error(uuid, text)
  from public, anon;
grant execute on function public.approve_application(uuid), public.reject_application(uuid, text),
  public.set_server_hidden(uuid, boolean, text), public.set_owner_status(uuid, text),
  public.mark_audit_reviewed(uuid[]), public.claim_announcement(uuid),
  public.record_announcement_error(uuid, text)
  to authenticated;
