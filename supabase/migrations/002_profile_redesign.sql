-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).
-- Safe to re-run. Existing rows are kept; the old timezone/language/age_range
-- columns stay in place but are no longer required by the website.

alter table public.registrations
  add column if not exists display_name       text,
  add column if not exists play_time          text,
  add column if not exists vibe               text,
  add column if not exists looking_for        text[]  not null default '{}',
  add column if not exists banner_color       text    not null default 'green',
  add column if not exists avatar_source      text    not null default 'discord',
  add column if not exists show_in_matching   boolean not null default true,
  add column if not exists show_discord_name  boolean not null default true,
  add column if not exists recommend_servers  boolean not null default false;

-- The redesigned forms no longer collect these.
alter table public.registrations alter column timezone  drop not null;
alter table public.registrations alter column language  drop not null;
alter table public.registrations alter column age_range drop not null;

-- Replace the old age check so it allows null.
alter table public.registrations drop constraint if exists registrations_age_range_check;
alter table public.registrations
  add constraint registrations_age_range_check
  check (age_range is null or age_range in ('13-15', '16-17', '18-24', '25+'));

alter table public.registrations drop constraint if exists registrations_play_time_check;
alter table public.registrations
  add constraint registrations_play_time_check
  check (play_time is null or play_time in ('weekdays', 'evenings', 'weekends'));

alter table public.registrations drop constraint if exists registrations_vibe_check;
alter table public.registrations
  add constraint registrations_vibe_check
  check (vibe is null or vibe in ('chill', 'competitive', 'social'));

alter table public.registrations drop constraint if exists registrations_banner_color_check;
alter table public.registrations
  add constraint registrations_banner_color_check
  check (banner_color in ('green', 'blue', 'orange', 'pink', 'cyan', 'purple'));

alter table public.registrations drop constraint if exists registrations_avatar_source_check;
alter table public.registrations
  add constraint registrations_avatar_source_check
  check (avatar_source in ('discord', 'minecraft'));

alter table public.registrations drop constraint if exists registrations_bio_length_check;
alter table public.registrations
  add constraint registrations_bio_length_check
  check (bio is null or char_length(bio) <= 200);
