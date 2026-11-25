-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).
-- Safe to re-run. Adds the table for owner-submitted Minecraft servers.
-- New rows are 'pending'; approve one by setting status = 'approved' in the Table Editor.

create table if not exists public.servers (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null unique references auth.users(id) on delete cascade,
  owner_discord_id text not null,
  name             text not null check (char_length(name) <= 48),
  address          text not null unique check (address = lower(address)),
  edition          text not null check (edition in ('java', 'bedrock', 'both')),
  description      text check (description is null or char_length(description) <= 200),
  play_styles      text[] not null default '{}',
  discord_invite   text,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  consent_at       timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- The website validates these too; the database enforces them for direct API calls.
alter table public.servers drop constraint if exists servers_address_format;
alter table public.servers add constraint servers_address_format
  check (char_length(address) <= 260 and address ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?$');
alter table public.servers drop constraint if exists servers_invite_format;
alter table public.servers add constraint servers_invite_format
  check (discord_invite is null or discord_invite ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9_-]+$');
alter table public.servers drop constraint if exists servers_play_styles_valid;
alter table public.servers add constraint servers_play_styles_valid
  check (cardinality(play_styles) between 1 and 8
    and play_styles <@ array['survival','creative','redstone','pvp','minigames','roleplay','building','adventure']);

alter table public.servers enable row level security;

-- Only public columns are readable through the API. owner_discord_id and consent_at
-- stay private (read them in the dashboard / with the service role key).
revoke select on public.servers from anon, authenticated;
grant select (id, owner_id, name, address, edition, description, play_styles, discord_invite, status, created_at)
  on public.servers to anon, authenticated;

-- Anyone can see approved servers; owners can also see their own (any status).
drop policy if exists "read approved servers" on public.servers;
create policy "read approved servers" on public.servers
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "read own server" on public.servers;
create policy "read own server" on public.servers
  for select to authenticated using (auth.uid() = owner_id);

-- Owners can only submit a pending row for themselves. No update/delete in v1.
drop policy if exists "insert own pending server" on public.servers;
create policy "insert own pending server" on public.servers
  for insert to authenticated with check (auth.uid() = owner_id and status = 'pending');
