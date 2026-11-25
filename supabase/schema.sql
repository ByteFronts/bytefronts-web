-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).

create table if not exists public.registrations (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  discord_id       text not null unique,
  discord_username text,
  minecraft_username text not null,
  edition          text not null check (edition in ('java', 'bedrock', 'both')),
  play_styles      text[] not null default '{}',
  timezone         text not null,
  language         text not null,
  age_range        text not null check (age_range in ('13-15', '16-17', '18-24', '25+')),
  bio              text,
  consent_at       timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.registrations enable row level security;

-- Users can only see and change their own registration.
create policy "read own registration" on public.registrations
  for select using (auth.uid() = user_id);
create policy "insert own registration" on public.registrations
  for insert with check (auth.uid() = user_id);
create policy "update own registration" on public.registrations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own registration" on public.registrations
  for delete using (auth.uid() = user_id);

-- Owner-submitted servers live in the `servers` table: see migrations/003_servers.sql.

-- The Discord bot should use the SERVICE ROLE key (server-side only, never in the website),
-- which bypasses these policies and can read every row for matching.
