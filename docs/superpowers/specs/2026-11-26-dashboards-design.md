# MineFriend — Admin & Server Owner Dashboards (Design)

Date: 2026-11-26
Status: Draft for approval (revised after codebase review)

## 1. Intent

MineFriend (by ByteFronts) helps Minecraft players find friends to play with and promotes Minecraft servers. The website (Next.js + Supabase, Discord login, deployed on Vercel, currently in testing) registers players; matching itself happens in the ByteFronts Discord server.

Server promotion currently has a "server request" flow (`/servers/register` → `servers` row with `status = 'pending'`), but nobody can review requests and owners can't see or manage what they submitted. The site owner is the only maintainer and expects many users later, so reviewing every server and every edit by hand won't scale.

**The change:** replace per-server review with a **Server Owner Program**. A player applies once to become a server owner; an admin reviews the *person*. Approved owners then add and edit servers themselves, and new servers go live immediately — on the public server list and as an announcement in a set Discord channel. Admins keep the power to step in (hide a server, suspend an owner) and can see what owners change.

## 2. Users & roles

| Role | Who | Can do |
|---|---|---|
| `player` | Any logged-in Discord user (default; no row needed) | Apply to the Server Owner Program; see application status |
| `owner` | Player whose application was approved | Everything a player can, plus create/edit/delete own servers |
| `admin` | Site staff (initially just the site owner) | Review applications, hide/unhide any server, suspend/reinstate owners, view audit log |

Role lives in a new `user_roles` table that **users cannot write to** (see §8.1). Admins are set manually in the Supabase SQL editor (no UI to grant admin). A player does not need a `registrations` row (player profile) to apply.

## 3. Goals

- Admin dashboard to review Server Owner Program applications (approve / reject with reason).
- Owner dashboard where approved owners add, edit and remove their servers.
- New server → appears in public list immediately and is posted to a configured Discord channel.
- Admin can hide any server and suspend any owner in one click; suspending hides all their servers.
- Every owner edit is recorded; address changes are flagged for admin attention (not blocked).
- Access enforced in the database (Supabase RLS, column grants, triggers), not just by hiding pages. Anything the rules depend on must hold even when a user calls the Supabase API directly with their own session.

## 4. Non-goals

- No Discord bot in this phase (posting uses a Discord webhook; a future bot can take over).
- No per-server or per-edit approval.
- No analytics/stats for owners (player counts, clicks) in this phase.
- No UI for managing admins.
- No payments / paid promotion tiers.

## 5. Anti-goals (would be a failure even if it "works")

- A non-admin can reach admin data or actions, or grant themselves a role, by calling the API/Supabase directly.
- An owner can edit or delete another owner's server, or un-hide a server an admin hid.
- An owner can change a server without it appearing in the audit log.
- A suspended owner's servers stay visible publicly.
- The Discord webhook URL leaks to the browser.
- An owner can make the announcement ping `@everyone`, `@here`, roles or users.
- The admin has to babysit routine owner activity (defeats the point of the program).

## 6. Constraints

- Stack: Next.js 16 (App Router; request interception lives in `src/proxy.ts`, not `middleware.ts`), Supabase (Postgres + Auth with Discord provider), Vercel hosting, Cloudflare-managed domain.
- Single maintainer: favour one codebase, few moving parts.
- The Discord bot mentioned in `supabase/schema.sql` isn't built yet; nothing outside the website reads these tables, so recreating `servers` breaks nothing.
- Schema changes ship as a new SQL migration in `supabase/migrations/` (run by hand in the Supabase SQL editor, like 002/003).
- Reuse existing code: `normalizeAddress`, `isDiscordInvite`, `serverSchema` (`src/lib/servers.ts`), `EDITIONS` / `PLAY_STYLES` (`src/lib/config.ts`), Discord-ID extraction pattern from `registerServer`, form controls in `src/components/form/`, `ServerCard`, block-grid styles.

## 7. Approaches considered

- **A. Custom pages in the Next.js app, app posts to Discord — CHOSEN.** `/admin` and `/dashboard` pages, Server Actions for mutations, roles + RLS in Supabase, Discord webhook called server-side when a server is created. One codebase, matches site look.
- **B. Same pages, Supabase triggers the Discord post.** Fires regardless of how a row is added, but adds a second runtime to debug.
- **C. Owner dashboard only; admin via Supabase table editor.** Fastest, but no flagged changes or one-click suspend, and clumsy at volume.

Chosen A because the site owner maintains everything alone. Note: integrity rules (audit log, server cap, column protection) still live in Postgres triggers/grants — only the Discord post lives in app code. An owner who inserts directly through the API skips the announcement; that only hurts them, so it's acceptable.

## 8. Design (decided)

### 8.1 Data model (Supabase / Postgres) — new migration `004_owner_program.sql`

**Retire the old flow.** Drop and recreate `public.servers` (test data is cleared, see §10). The old table has `status`, `owner_id unique` (one server per user) and `consent_at`, none of which fit the new model.

- **`user_roles`** (new): `user_id` PK → `auth.users(id) on delete cascade`, `role` text check in (`owner`,`admin`), `owner_status` text check in (`active`,`suspended`) nullable, `discord_id`, `discord_username` (copied from the approved application, so admins can contact owners and the Discord embed can name them), `updated_at`.
  - No row = `player`.
  - RLS: users may `select` their own row; admins may `select` all. **No insert/update/delete for anyone through the API** — all writes go through the admin RPCs in §8.2.
  - Kept separate from `registrations` on purpose: `registrations` has an unrestricted "update own" policy, so a role column there would let users promote themselves.

- **`owner_applications`**: `id`, `user_id` → `auth.users(id) on delete cascade`, `discord_id`, `discord_username` (both set by a `before insert` trigger from `auth.identities` for `auth.uid()`, so they can't be spoofed through the API), `status` check in (`pending`,`approved`,`rejected`) default `pending`, `reject_reason`, `reviewed_by`, `reviewed_at`, `created_at`, plus:
  - `server_name` — text, required, ≤ 48 (same as `servers.name`)
  - `server_address` — required, normalized with `normalizeAddress` (`host` or `host:port`)
  - `edition` — `java` / `bedrock` / `both` (existing `EDITIONS`), required
  - `server_about` — text, required, ≤ 500
  - `play_styles` — multi-select from existing `PLAY_STYLES`, 1–8, plus `play_styles_other` free text ≤ 40
  - `player_base_size` — range bucket, required (e.g. `<10`, `10-50`, `50-200`, `200+`)
  - `community_size` — range bucket, required (same buckets)
  - `running_since` — date (month precision is fine), required
  - `discord_link` — required, validated with `isDiscordInvite`
  - `why_join` — text, required, ≤ 500
  - **One pending per user:** `create unique index on owner_applications(user_id) where status = 'pending'`.
  - A user may re-apply after rejection. On approval, the application's details pre-fill the owner's first "add server" form (owner confirms before it goes live).
  - Users may `insert` their own row only with `status = 'pending'`, and only if they have no `user_roles` row (existing owners — including suspended ones — and admins can't apply). Column insert grant covers the form fields only, so review fields can't be set. Users `select` their own rows; no update/delete.

- **`servers`** (recreated): `id`, `owner_id` → `auth.users(id) on delete cascade`, **default `auth.uid()`, not unique**, `name` (≤ 48), `address` (single normalized `host[:port]` string, lowercase, **unique**, existing format check), `edition` (`java`/`bedrock`/`both`), `description` (≤ 200), `play_styles` text[] (existing check), `discord_invite` (optional, existing check), `is_hidden` bool default false, `hidden_reason`, `created_at`, `updated_at` (set by trigger).
  - Address and port stay one column so `normalizeAddress` and its tests are reused unchanged.
  - Dropped vs. old table: `status`, `consent_at`, `owner_discord_id` (lives on `user_roles` now). `banner_url` from the first draft is dropped: nothing displays it, and hotlinked owner images would let owners track visitors.

- **`audit_log`**: `id`, `server_id` → `servers(id) on delete set null` (nullable), `server_name` (snapshot), `actor_id`, `action` (`server_create`, `server_update`, `server_delete`, `server_hide`, `server_unhide`, `owner_suspend`, `owner_reinstate`, `application_approve`, `application_reject`, `announce_failed`), `field`, `old_value`, `new_value`, `is_flagged` (true when `address` changed), `reviewed` bool default false, `created_at`.
  - Written **only by `security definer` triggers** on `servers`, `user_roles` and `owner_applications` — users get no insert policy, so entries can't be forged or skipped.
  - `server_update` writes one row per changed column.

- **`announced_addresses`**: `address` PK (normalized), `server_id` → `servers(id) on delete set null`, `announced_at`, `last_error` text nullable.
  - No API access for users. Two `security definer` RPCs, both checking the caller owns `server_id`:
    - `claim_announcement(server_id) returns boolean` — `insert … on conflict do nothing`; true only the first time an address is seen. Claiming *before* posting means a double-submit can't post twice.
    - `record_announcement_error(server_id, error text)` — sets `last_error` and writes an `announce_failed` audit row.
  - No service-role key needed.

### 8.2 Access rules

Helpers (all `security definer`, `stable`, `set search_path = ''`):
- `is_admin()` → `user_roles.role = 'admin'` for `auth.uid()`.
- `is_active_owner()` → `role = 'owner' and owner_status = 'active'` for `auth.uid()`.
- `owner_is_active(uid)` → same check for any user; needed because anon can't read `user_roles`.

Rules:
- **Public (anon + authenticated)** reads `servers` where `is_hidden = false and owner_is_active(owner_id)`.
- **Owners** read all their own servers (including hidden), and insert/update/delete only where `owner_id = auth.uid() and is_active_owner()`.
- **Column protection via grants, not RLS** (RLS can't restrict columns): `authenticated` gets `insert/update (name, address, edition, description, play_styles, discord_invite)` only. `is_hidden`, `hidden_reason`, `owner_id` are not user-writable; `owner_id` comes from its `auth.uid()` default.
- **Server cap:** `before insert` trigger on `servers` takes `pg_advisory_xact_lock` on the owner id and raises if they already have `MAX_SERVERS_PER_OWNER` (5). The app checks the same constant first for a friendly error.
- **Applications:** see §8.1.
- **Admins read** everything in these tables via `is_admin()` select policies, and may **delete** any server (e.g. to free an address held by a suspended owner).
- **Admins write through RPCs, not direct updates.** Admins are the `authenticated` Postgres role too, so the column grants above would also block them from setting `is_hidden`. Every admin action is a `security definer` function that first checks `is_admin()`:
  - `approve_application(id)` — sets application `approved` + reviewer fields, inserts `user_roles` (`owner`, `active`, Discord ID/name from the application). One transaction.
  - `reject_application(id, reason)` — reason required.
  - `set_server_hidden(server_id, hidden, reason)` — reason required when hiding.
  - `set_owner_status(user_id, status)` — `active` / `suspended`.
  - `mark_audit_reviewed(ids uuid[])`.
  - `auth.uid()` still returns the calling admin inside these functions, so triggers record the right `actor_id`.

### 8.3 Flows

1. **Apply:** player opens `/dashboard` → "Become a server owner" → fills application → `pending`. Dashboard shows status (pending / rejected + reason + "apply again").
2. **Review:** admin opens `/admin/applications` → pending, oldest first → open one → **Approve** (`approve_application`) or **Reject** (`reject_application`, reason required).
3. **Add server:** owner on `/dashboard/servers/new` → submit → row inserted (trigger logs `server_create`) → inside `after()` from `next/server` (so the response isn't blocked): `claim_announcement(id)`; if true, post to the Discord webhook; on failure `record_announcement_error`. If the post fails the server stays live and the failure shows in the audit log.
4. **Edit server:** saved immediately → trigger writes `server_update` rows; address changes flagged. Editing does **not** un-hide an admin-hidden server and does not re-announce.
5. **Delete server:** owner deletes own server (trigger logs `server_delete` with name snapshot). Address stays in `announced_addresses`, so re-adding it doesn't re-post.
6. **Admin intervention:** `/admin/servers` hide/unhide (reason required to hide); `/admin/owners` suspend/reinstate; `/admin/audit` shows the log, flagged + unreviewed first, with "mark reviewed".
7. **Suspended owner:** dashboard shows a "suspended" notice and their servers read-only; no create/edit/delete (enforced by `is_active_owner()`). Reinstating makes their servers public again, except ones an admin hid separately.

### 8.4 Pages

- `/dashboard` — player/owner home: application status, or list of own servers (with hidden/suspended badges).
- `/dashboard/apply`, `/dashboard/servers/new`, `/dashboard/servers/[id]/edit`
- `/admin` — overview counts (pending applications, unreviewed flagged audit entries, failed announcements)
- `/admin/applications`, `/admin/applications/[id]`
- `/admin/servers`, `/admin/owners`, `/admin/audit`
- **Route protection:** add `/dashboard/:path*` and `/admin/:path*` to the `src/proxy.ts` matcher (session refresh only — the Next 16 docs say proxy isn't for authorization). Logged-out visitors to `/dashboard` see the existing "Login with Discord" form posting to `signInWithDiscord` with `next=/dashboard`. The `/admin` layout checks `is_admin()` and calls `notFound()` otherwise. RLS/grants are the real guard.
- **Login return paths:** in `src/app/register/actions.ts`, `LOGIN_RETURN_PATHS` becomes `["/register", "/dashboard"]` (drop `/servers/register`).
- **Entry points:** the "register server" button on `/servers` (`src/app/servers/page.tsx`) links to `/dashboard`; `/profile` gets a "Server dashboard" link; `/dashboard` shows an "Admin" link for admins. No new header nav item.
- **Retire old UI:** delete `src/app/servers/register/` (page, form, action) and add a redirect `/servers/register` → `/dashboard` in `next.config.ts`. Sitemap doesn't list it, so no change there.
- **`/servers` list:** drop the `.eq("status", "approved")` filter (RLS does the filtering now) and give each list item `id={server.id}` so the Discord link anchor works. The list is capped at 50 newest; an anchor for an older server just lands at the top of the page (acceptable until pagination).

### 8.5 Discord announcement

- Webhook URL in Vercel env var `DISCORD_SERVER_WEBHOOK_URL`, read only in server code (never `NEXT_PUBLIC_`).
- Payload always includes `allowed_mentions: { parse: [] }`, so owner text can't ping anyone.
- Embed: server name, address, edition, short description, owner's Discord name (from `user_roles`), link to `/servers#<server id>` on MineFriend.
- 5-second timeout (`AbortSignal.timeout(5000)`); non-2xx or timeout → `record_announcement_error`.
- If `DISCORD_SERVER_WEBHOOK_URL` is unset (local dev), skip posting and don't claim the address.

## 9. Left to the builder

- Exact UI components/styling (match existing block-grid site).
- Pagination, sorting, search on admin lists.
- Exact length limits and range buckets beyond those above.
- Error/empty states.
- Tests: extend `src/lib/*.test.ts` for any new pure validation (application schema); SQL rules verified manually with a non-admin session (try direct API calls listed in §5).

## 10. Decisions after review

**Decided by the site owner**
- Application fields: as listed in §8.1 (styles mapped onto the existing `PLAY_STYLES` list + "other" text; platforms = existing `edition`).
- Existing "server request" data: **clear it out** (site is in testing). Drop and recreate `servers`; delete the `/servers/register` UI; no migration of rows, no automatic owners, no Discord posts for old data.

**Builder-side calls (made by Claude, site owner may override)**
- Roles in a separate `user_roles` table, not on `registrations` (self-promotion risk).
- Address + port stay one normalized column (reuses existing code and tests).
- `edition` replaces the separate `platforms` field; `play_styles` uses the existing list.
- Audit log, server cap, and owner-field protection live in Postgres (triggers + column grants), so direct API calls can't bypass them.
- **One announcement per address**, tracked in `announced_addresses`; failures stored there and surfaced in the audit log (no service-role key needed).
- **Server cap:** 5 per owner (`MAX_SERVERS_PER_OWNER`).
- **Discord link target:** public server list anchored to the server; no per-server page in this phase.
- Admin-hidden servers stay hidden through owner edits; suspended owners see their servers read-only.
- Admin actions go through `security definer` RPCs (column grants would otherwise block admins too).
- Discord ID/name on applications are set by trigger from the login identity, not the form.
- No `banner_url` this phase.
- **Announcement spam** (delete + re-add with new addresses) is accepted for now: the cap, one-post-per-address, and one-click suspend cover it. Add a per-owner daily announcement limit if it becomes a problem.
