# Server register page — design

Date: 2026-11-24 · Status: draft, awaiting approval

## Intent
Let Minecraft server owners register their server with ByteFronts. Approved servers are listed publicly at `/servers`, and MineFriend players who opted in (`recommend_servers`) can be shown them later. Today the site only knows one hardcoded server (`siteConfig.serverAddress`).

## Goals
- Owner logs in with Discord, submits a server, sees its status (pending / approved / rejected).
- Admin (you) approves in the Supabase dashboard. No admin UI.
- Public `/servers` list shows approved servers with live status.

## Non-goals
- Ownership verification (MOTD code). Possible later; the form won't need to change.
- Admin UI, editing/deleting other people's servers, payments, votes, search/filters.
- Matching players to servers (the `/servers` list is the groundwork only).

## Anti-goals
- Listing anything before approval.
- Trusting the owner or Discord ID from the form.

## Approaches considered
- **A. Submit + manual approval (chosen).** Smallest; reuses Discord login, the zod/server-action pattern and `getServerStatus`. No proof of ownership; manual review is the only check.
- B. Auto-verify via MOTD code. Stronger, but needs an uncached status check and a verify step.
- C. Collect only, no public page. Smallest, but gives players nothing.

## Design
**Data** — new migration `supabase/migrations/003_servers.sql`, table `public.servers`:
`id uuid pk`, `owner_id uuid` (auth user, from session), `owner_discord_id text`, `name` (≤48), `address` (unique, lowercased), `edition` (java|bedrock|both), `description` (≤200), `play_styles text[]`, `discord_invite text null`, `status` (pending|approved|rejected, default pending), `consent_at`, `created_at`, `updated_at`.
RLS: anyone can select `status = 'approved'`; owners can select their own rows; owners can insert with `owner_id = auth.uid()` and `status = 'pending'`; no owner updates to `status`. Users cannot edit approved rows in v1 (edit = out of scope).

**Routes**
- `/servers/register` — Discord login gate (same as `/register`), then the form; if the owner already has a submission, show its status.
- `/servers` — public list of approved servers (name, address with copy button, edition, styles, live status/players).

**Server action** `registerServer` in `src/app/servers/register/actions.ts`: zod validation reusing `EDITIONS` / `PLAY_STYLES` from `lib/config.ts`; address normalized and checked with a hostname[:port] regex; consent required; owner and Discord ID taken from the verified session; duplicate address returns a field error (unique constraint, code 23505). Missing-table errors mirror the existing "run the migration" message.

**UI** — reuse `RegisterShell`-style layout, `Field`/`Segmented` form components and card styles. Status list uses `getServerStatus` (already cached for minutes); cap the list at a sensible number to limit API calls.

## Left to the builder
Exact copy and layout, whether `/servers` gets a header nav link, whether `RegisterShell` is generalized or a small sibling is made, and the list page size.

## Risks
- Anyone can submit someone else's server; approval is manual. Mention this in the review checklist.
- The status API (mcsrvstat) is third-party and rate limited; caching already mitigates it.
- Per AGENTS.md, check `node_modules/next/dist/docs/` before writing Next code (this Next version has breaking changes).
