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

alter table public.servers enable row level security;

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
