# Server Owner Program & Dashboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-server review with a Server Owner Program: players apply once, admins approve the person, owners then add/edit/delete up to 5 servers that go live immediately and are announced once per address on Discord, while admins can hide servers, suspend owners and review an audit log.

**Architecture:** One SQL migration (`004_owner_program.sql`) holds every integrity rule — tables, column grants, RLS, `security definer` helpers, admin RPCs and audit/cap triggers — so direct Supabase API calls can't bypass them; a rollback-only SQL check script proves those rules. Pure, unit-tested TS modules hold validation and the Discord payload. Server actions under `/dashboard` and `/admin` call Supabase with the user's own session (admin writes via RPC) and post to the Discord webhook inside `after()`.

**Tech Stack:** Next.js 16.4.6 (App Router, server actions, `cacheComponents: true`), React 19, Supabase (`@supabase/ssr`), Postgres (RLS, triggers, plpgsql), zod 4, Tailwind 4, `node --test`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-26-dashboards-design.md`

## Global Constraints

- Before writing Next.js code, read the relevant page in `node_modules/next/dist/docs/` (AGENTS.md). `cacheComponents` is on: any component that reads cookies/Supabase must render inside `<Suspense>`, as `src/app/servers/register/page.tsx` does. Use `PageProps<"/route">` and `await params` / `await searchParams`.
- No new dependencies. No service-role key anywhere in the app.
- `src/lib/*.ts` modules that are unit-tested import only relative paths with `.ts` extension and `zod` (no `@/` alias), like `src/lib/servers.ts`.
- Owner, Discord ID/name, `status`, `is_hidden`, `hidden_reason`, `owner_id` are never read from form data.
- `MAX_SERVERS_PER_OWNER = 5`.
- Limits: server `name` ≤ 48, server `description` ≤ 200, `server_about` ≤ 500, `why_join` ≤ 500, `play_styles_other` ≤ 40, `reject_reason` / `hidden_reason` 1–200, `play_styles` 1–8 from `PLAY_STYLES`, `edition` ∈ `EDITIONS`.
- Size buckets for `player_base_size` and `community_size`: `<10`, `10-50`, `50-200`, `200+`.
- Webhook env var: `DISCORD_SERVER_WEBHOOK_URL` (server-only, never `NEXT_PUBLIC_`). Every webhook payload has `allowed_mentions: { parse: [] }`. Timeout: `AbortSignal.timeout(5000)`.
- Every SQL helper/RPC/trigger function is `security definer` with `set search_path = ''` and fully-qualified names.
- Reuse `Field`, `Chips`, `Segmented`, `Toggle`, `ErrorBanner`, `inputClass` (`src/components/form/controls.tsx`), `RegisterShell`, `FormState` (`src/app/register/actions.ts`), `normalizeAddress`, `isDiscordInvite`, `serverSchema` (`src/lib/servers.ts`), block-grid classes (`panel`, `slot`, `chip`, `btn`, `notch`).

## Review Focus

- Owner calls the API directly to `update servers set is_hidden = false` or change `owner_id` → permission denied (check script, Task 2).
- Suspended owner → their servers disappear for anon and other users, still readable (not writable) by the owner (check script, Task 2).
- Owner double-clicks "Add server" or re-adds a deleted address → at most one Discord post per address (`claim_announcement` check, Task 2).
- Owner puts `@everyone` or `<@&123>` in name/description → message posts but pings nobody (`buildAnnouncement` test, Task 4).
- Admin double-clicks Approve, or approves an already-rejected application → second call errors, no duplicate/changed `user_roles` row (check script, Task 2).

## File Structure

- Create `supabase/migrations/004_owner_program.sql` — drop old `servers`; tables, grants, RLS, helpers, RPCs, triggers.
- Create `supabase/tests/004_owner_program_check.sql` — rollback-only assertions run in the SQL editor.
- Modify `supabase/schema.sql` — pointer comment to 004.
- Modify `src/lib/config.ts` — `MAX_SERVERS_PER_OWNER`, `SIZE_BUCKETS`.
- Create `src/lib/owners.ts` + `src/lib/owners.test.ts` — `applicationSchema`, `reasonSchema`.
- Create `src/lib/discord.ts` + `src/lib/discord.test.ts` — `buildAnnouncement`, `postAnnouncement`.
- Create `src/lib/roles.ts` — `getViewer`, `requireAdmin` (server-only, uses Supabase).
- Create `src/app/dashboard/` — `page.tsx`, `actions.ts`, `ApplyForm.tsx`, `apply/page.tsx`, `servers/ServerForm.tsx` (moved from `servers/register/ServerRegisterForm.tsx`), `servers/new/page.tsx`, `servers/[id]/edit/page.tsx`, `announce.ts`.
- Create `src/app/admin/` — `actions.ts`, `AdminNav.tsx`, `page.tsx`, `applications/page.tsx`, `applications/[id]/page.tsx`, `servers/page.tsx`, `owners/page.tsx`, `audit/page.tsx`.
- Delete `src/app/servers/register/`. Modify `src/app/servers/page.tsx`, `src/app/register/actions.ts`, `src/proxy.ts`, `src/app/profile/page.tsx`, `next.config.ts`.

---

### Task 1: Migration — tables, grants, RLS, helpers

**Files:**
- Create: `supabase/migrations/004_owner_program.sql`
- Modify: `supabase/schema.sql` (comment line under the servers pointer)

**Interfaces:**
- Produces tables exactly as spec §8.1: `user_roles`, `owner_applications`, `servers` (recreated), `audit_log`, `announced_addresses`.
- Produces functions: `public.is_admin() returns boolean`, `public.is_active_owner() returns boolean`, `public.owner_is_active(uid uuid) returns boolean` — all `stable security definer set search_path = ''`, `grant execute … to anon, authenticated`.

- [ ] **Step 1: Header + drop.** Header comment: run once in SQL editor; **destroys existing `servers` rows**; make yourself admin with `insert into public.user_roles (user_id, role) values ('<your auth uid>', 'admin');`. Then `drop table if exists public.servers cascade;`. Rest of file is re-runnable (`create … if not exists`, `drop policy if exists`, `create or replace function`).
- [ ] **Step 2: Tables.** Columns, checks and FKs per spec §8.1 and Global Constraints. Specifics:
  - `servers.owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade`; keep the three check constraints from `003_servers.sql` (`servers_address_format`, `servers_invite_format`, `servers_play_styles_valid`) and `address = lower(address)`, `address unique`.
  - `owner_applications`: `player_base_size` / `community_size` check in the four buckets; `running_since date not null check (running_since <= current_date)`; `discord_link` check uses the same regex as `servers_invite_format`; `play_styles` uses the same check as servers; partial unique index `owner_applications_one_pending on (user_id) where status = 'pending'`.
  - `audit_log.action` check lists the ten actions in spec §8.1; index on `(reviewed, is_flagged, created_at desc)`.
- [ ] **Step 3: Helpers** `is_admin()`, `is_active_owner()`, `owner_is_active(uid)` reading `public.user_roles`.
- [ ] **Step 4: Grants.** `revoke all` on all five tables from `anon, authenticated`, then:
  - `servers`: `grant select (id, owner_id, name, address, edition, description, play_styles, discord_invite, is_hidden, hidden_reason, created_at, updated_at) to anon, authenticated`; `grant insert (name, address, edition, description, play_styles, discord_invite), update (name, address, edition, description, play_styles, discord_invite), delete to authenticated`.
  - `owner_applications`: `grant select to authenticated`; `grant insert (server_name, server_address, edition, server_about, play_styles, play_styles_other, player_base_size, community_size, running_since, discord_link, why_join) to authenticated`.
  - `user_roles`, `audit_log`: `grant select to authenticated`. `announced_addresses`: nothing.
- [ ] **Step 5: RLS** (enable on all five) — policies:
  - `servers` select: `(not is_hidden and public.owner_is_active(owner_id)) or owner_id = auth.uid() or public.is_admin()`.
  - `servers` insert: with check `owner_id = auth.uid() and public.is_active_owner()`. Update: using + with check same. Delete: using `(owner_id = auth.uid() and public.is_active_owner()) or public.is_admin()`.
  - `owner_applications` select: `user_id = auth.uid() or public.is_admin()`. Insert: with check `user_id = auth.uid() and status = 'pending' and not exists (select 1 from public.user_roles r where r.user_id = auth.uid())`. (`user_id` default `auth.uid()`.)
  - `user_roles` select: `user_id = auth.uid() or public.is_admin()`. `audit_log` select: `public.is_admin()`.
- [ ] **Step 6: Verify.** Run the file in the Supabase SQL editor twice. Expected: no errors either time; `select count(*) from public.servers` → 0.
- [ ] **Step 7: Commit** — `git add supabase && git commit -m "feat: owner program tables, grants and RLS"`

### Task 2: Migration — triggers, RPCs, check script

**Files:**
- Modify: `supabase/migrations/004_owner_program.sql` (append)
- Create: `supabase/tests/004_owner_program_check.sql`

**Interfaces:**
- Consumes: Task 1 tables and helpers.
- Produces RPCs (all `security definer`, `grant execute to authenticated`, raise `'forbidden'` when the check fails):
  - `approve_application(app_id uuid) returns void` — admin; raises `'not_pending'` unless status is `pending`.
  - `reject_application(app_id uuid, reason text) returns void` — admin; reason 1–200; raises `'not_pending'`.
  - `set_server_hidden(server_id uuid, hidden boolean, reason text) returns void` — admin; reason required when `hidden`; clears `hidden_reason` on unhide.
  - `set_owner_status(target uuid, status text) returns void` — admin; target must have `role = 'owner'`.
  - `mark_audit_reviewed(ids uuid[]) returns void` — admin.
  - `claim_announcement(p_server_id uuid) returns boolean` — caller must own the server.
  - `record_announcement_error(p_server_id uuid, error text) returns void` — caller must own the server; writes `announce_failed` audit row.
- Produces error messages the app maps: `'server_limit'` (cap trigger), `'not_pending'`, `'forbidden'`.

- [ ] **Step 1: Write the check script first.** `begin; … rollback;` as `postgres`. Seed: four `auth.users` rows (admin, owner A, owner B, player P) plus a Discord `auth.identities` row each (`provider = 'discord'`, `provider_id`, `identity_data` with `full_name`); `user_roles` admin row. Impersonate with a helper `as_user(uid)` = `set local role authenticated; perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);` and `reset role` between cases. Each case is a `do $$ … $$` block using `assert`, or `begin … exception when insufficient_privilege / others then … end` to assert an error. Cases:
  1. P inserts an application → row has P's `discord_id` from identities even if the insert tried to set it (expect permission denied when supplying `discord_id`).
  2. P inserts a second pending application → unique violation.
  3. Admin `approve_application` → P has `user_roles (owner, active)` with Discord ID/name; second call → `not_pending`.
  4. Owner A inserts 5 servers OK; 6th → `server_limit`.
  5. Owner A `update servers set is_hidden = false` → permission denied; update `owner_id` → permission denied; update owner B's server name → 0 rows affected.
  6. A changes `address` → one `audit_log` row `server_update`, `field = 'address'`, `is_flagged = true`; changes `name` → `is_flagged = false`.
  7. Admin `set_owner_status(A, 'suspended')` → as anon, A's servers are not selectable; as A, they are selectable; A's insert/update → denied/0 rows; `owner_suspend` audit row exists.
  8. `claim_announcement(s)` → true, again → false; delete s, re-insert same address, claim → false. Owner B calling it on A's server → `forbidden`.
  9. Non-admin calling each admin RPC → `forbidden`. P reading `audit_log` → 0 rows.
  End with `raise notice 'ALL OWNER PROGRAM CHECKS PASSED';`.
- [ ] **Step 2: Run it.** Paste into SQL editor. Expected: FAIL at case 1 (`function … does not exist` / missing trigger).
- [ ] **Step 3: Append triggers.**
  - `owner_applications` before insert: set `user_id = auth.uid()`, `discord_id = identities.provider_id`, `discord_username` = first non-empty of `identity_data->'custom_claims'->>'global_name'`, `full_name`, `name`, `user_name`, `preferred_username` (same order as `getDiscordIdentity`).
  - `servers` before insert: `pg_advisory_xact_lock(hashtext(owner_id::text))`, then raise `'server_limit'` if count ≥ 5. Before update: `updated_at = now()`.
  - `servers` after insert/update/delete → `audit_log`: insert → `server_create`; delete → `server_delete` (`server_id` null-safe, `server_name` snapshot); update → `server_hide`/`server_unhide` when `is_hidden` changed, plus one `server_update` row per changed column among `name, address, edition, description, play_styles, discord_invite` with `old_value`/`new_value` as text and `is_flagged = (field = 'address')`.
  - `owner_applications` after update of `status` → `application_approve` / `application_reject` (`new_value` = reason). `user_roles` after update of `owner_status` → `owner_suspend` / `owner_reinstate`.
  - `actor_id = auth.uid()` in every audit row.
- [ ] **Step 4: Append the seven RPCs** per Interfaces.
- [ ] **Step 5: Re-run migration, then check script.** Expected: migration no errors; script ends with notice `ALL OWNER PROGRAM CHECKS PASSED` and leaves no rows (rollback).
- [ ] **Step 6: Commit** — `git add supabase && git commit -m "feat: owner program triggers, admin RPCs and SQL checks"`

### Task 3: Application validation

**Files:**
- Modify: `src/lib/config.ts`
- Create: `src/lib/owners.ts`, `src/lib/owners.test.ts`

**Interfaces:**
- Produces in `config.ts`: `export const MAX_SERVERS_PER_OWNER = 5;` and `export const SIZE_BUCKETS = [{ value: "<10", label: "Under 10" }, { value: "10-50", label: "10–50" }, { value: "50-200", label: "50–200" }, { value: "200+", label: "200+" }] as const;`
- Produces in `owners.ts`: `applicationSchema` (zod object; keys = the 11 insertable columns from Task 1 Step 4; output `server_address` normalized, `play_styles_other` `string | null`, `running_since` `YYYY-MM-DD` string), `type ApplicationInput`, `reasonSchema` (`z.string().trim().min(1).max(200)`).

- [ ] **Step 1: Write failing tests** in `owners.test.ts`:
  - `applicationSchema accepts a valid application and normalizes the address` — input `server_address: "Play.Example.com:25565"` → `"play.example.com:25565"`; empty `play_styles_other` → `null`.
  - `applicationSchema rejects a non-Discord link` — `discord_link: "https://evil.com/x"` → failure on `discord_link`.
  - `applicationSchema rejects a future running_since` — tomorrow's date → failure on `running_since`.
  - `applicationSchema rejects unknown size bucket and over-long why_join` — `community_size: "1000"`, `why_join: "x".repeat(501)` → failures on both keys.
  - `reasonSchema trims and rejects empty` — `"  "` fails, `" spam "` → `"spam"`.
- [ ] **Step 2: Run** `npm test` — Expected: FAIL, cannot find module `./owners.ts`.
- [ ] **Step 3: Implement** using `normalizeAddress`, `isDiscordInvite` from `./servers.ts` and `EDITIONS`, `PLAY_STYLES`, `SIZE_BUCKETS` from `./config.ts`; reuse the `values()` helper pattern from `servers.ts`.
- [ ] **Step 4: Run** `npm test` — Expected: all PASS (existing servers tests too).
- [ ] **Step 5: Commit** — `git commit -m "feat: owner application validation"`

### Task 4: Discord announcement

**Files:**
- Create: `src/lib/discord.ts`, `src/lib/discord.test.ts`

**Interfaces:**
- Produces:
  - `type AnnounceServer = { id: string; name: string; address: string; edition: string; description: string | null }`
  - `buildAnnouncement(s: AnnounceServer, ownerName: string, siteUrl: string): { allowed_mentions: { parse: [] }; embeds: [{ title: string; description?: string; url: string; fields: { name: string; value: string; inline?: boolean }[] }] }` — `url` = `${siteUrl}/servers#${s.id}`; fields: Address, Edition (label from `EDITIONS`), Owner.
  - `postAnnouncement(webhookUrl: string, payload: ReturnType<typeof buildAnnouncement>): Promise<string | null>` — returns `null` on 2xx, otherwise a short error string (`"HTTP 429"`, `"timeout"`, `"network"`). Never throws.

- [ ] **Step 1: Write failing tests:**
  - `buildAnnouncement never allows mentions` — name `"@everyone join"`, description `"<@&123> hi"` → `payload.allowed_mentions` deep-equals `{ parse: [] }`.
  - `buildAnnouncement links to the server anchor` — `siteUrl "https://x.test"`, id `"abc"` → `embeds[0].url === "https://x.test/servers#abc"`.
  - `buildAnnouncement shows the edition label and omits empty description` — edition `"both"` → a field value `"Both"`; `description: null` → no `description` key.
  - `postAnnouncement returns an error string on non-2xx` — stub `globalThis.fetch` to resolve `new Response("", { status: 429 })` → `"HTTP 429"`; stub resolving 204 → `null`; stub rejecting → `"network"`.
- [ ] **Step 2: Run** `npm test` — Expected: FAIL, missing module.
- [ ] **Step 3: Implement.** `postAnnouncement` uses `fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body, signal: AbortSignal.timeout(5000) })`; a `TimeoutError` maps to `"timeout"`.
- [ ] **Step 4: Run** `npm test` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: discord server announcement payload"`

### Task 5: Viewer roles + routing groundwork

**Files:**
- Create: `src/lib/roles.ts`
- Modify: `src/proxy.ts` (matcher), `src/app/register/actions.ts:25` (`LOGIN_RETURN_PATHS`)

**Interfaces:**
- Produces in `roles.ts`:
  - `type Viewer = { user: User; role: "player" | "owner" | "admin"; ownerStatus: "active" | "suspended" | null; discordName: string | null }` (`User` from `@supabase/supabase-js`)
  - `getViewer(): Promise<Viewer | null>` — `null` when logged out; reads own `user_roles` row (none → `player`).
  - `requireAdmin(): Promise<Viewer>` — calls `notFound()` unless `role === "admin"`.

- [ ] **Step 1: Implement `roles.ts`** with `createClient()` from `@/lib/supabase/server`.
- [ ] **Step 2: Proxy matcher** → `["/register/:path*", "/profile/:path*", "/auth/:path*", "/dashboard/:path*", "/admin/:path*"]`.
- [ ] **Step 3: `LOGIN_RETURN_PATHS`** → `["/register", "/dashboard"]`.
- [ ] **Step 4: Verify** `npm run lint` and `npx tsc --noEmit` — Expected: no errors. (`/servers/register` still compiles; its `next` value now falls back to `/register` — removed in Task 7.)
- [ ] **Step 5: Commit** — `git commit -m "feat: viewer role helper and dashboard routing"`

### Task 6: Dashboard — apply + status

**Files:**
- Create: `src/app/dashboard/page.tsx`, `src/app/dashboard/apply/page.tsx`, `src/app/dashboard/ApplyForm.tsx`, `src/app/dashboard/actions.ts`

**Interfaces:**
- Consumes: `getViewer`, `applicationSchema`, `SIZE_BUCKETS`, `FormState`, `signInWithDiscord`.
- Produces in `actions.ts`: `submitApplication(prev: FormState, fd: FormData): Promise<FormState>` (more actions added in Task 7).

- [ ] **Step 1: `submitApplication`** — `getUser()` or "session expired" error (same copy as `registerServer`); parse with `applicationSchema` (`play_styles` via `fd.getAll`); insert only parsed fields. Map errors: `23505` → `"You already have an application waiting for review."`; `42501` / RLS failure → `"You're already a server owner."`; else generic. `revalidatePath("/dashboard")`, return `{ ok: true }`.
- [ ] **Step 2: `ApplyForm.tsx`** (client, `useActionState`) — fields in spec §8.1 order, using `Field`/`Chips`/`Segmented`/`inputClass`; `running_since` as `<input type="date" max={today}>`; sizes as `Segmented` over `SIZE_BUCKETS`. On `ok` show "Application sent — we'll review it soon." with link to `/dashboard`.
- [ ] **Step 3: `/dashboard/page.tsx`** — `RegisterShell` + `<Suspense>` content. Logged out → Discord login card posting `next=/dashboard` (copy the `/servers/register` logged-out card). Player: latest application → none: "Become a server owner" CTA to `/dashboard/apply`; `pending`: "Your application is waiting for review"; `rejected`: reason + "Apply again" link. Owner/admin: placeholder list replaced in Task 7. Admin: "Admin" link to `/admin`.
- [ ] **Step 4: `/dashboard/apply/page.tsx`** — logged out → redirect `/dashboard`; has role or pending application → redirect `/dashboard`; else `ApplyForm`.
- [ ] **Step 5: Verify in the preview** (`npm run dev`): log in as a fresh user → `/dashboard` shows CTA → submit invalid form (bad Discord link) → field error → submit valid → pending status shown → `/dashboard/apply` redirects back. Check `owner_applications` row has your Discord ID.
- [ ] **Step 6: Commit** — `git commit -m "feat: owner program application in dashboard"`

### Task 7: Dashboard — owner servers + announcement; retire old flow

**Files:**
- Move: `src/app/servers/register/ServerRegisterForm.tsx` → `src/app/dashboard/servers/ServerForm.tsx` (`git mv`)
- Create: `src/app/dashboard/servers/new/page.tsx`, `src/app/dashboard/servers/[id]/edit/page.tsx`, `src/app/dashboard/announce.ts`
- Modify: `src/app/dashboard/actions.ts`, `src/app/dashboard/page.tsx`, `src/app/servers/page.tsx`, `src/app/profile/page.tsx`, `next.config.ts`, `supabase/schema.sql`
- Delete: `src/app/servers/register/page.tsx`, `src/app/servers/register/actions.ts`

**Interfaces:**
- Consumes: `serverSchema`, `getViewer`, `MAX_SERVERS_PER_OWNER`, `buildAnnouncement`, `postAnnouncement`, RPCs `claim_announcement`, `record_announcement_error`.
- Produces:
  - `announceServer(serverId: string): Promise<void>` in `announce.ts` — no-op if `DISCORD_SERVER_WEBHOOK_URL` unset; else select server + own `user_roles.discord_username`, `claim_announcement`; if true, `postAnnouncement`; on error string, `record_announcement_error`. Never throws.
  - In `actions.ts`: `createServer(prev: FormState, fd: FormData)`, `updateServer(prev: FormState, fd: FormData)` (reads hidden `id`), `deleteServer(fd: FormData): Promise<void>`.
  - `ServerForm` props: `{ action: (prev: FormState, fd: FormData) => Promise<FormState>; initial?: Partial<ServerInput> & { id?: string }; submitLabel: string }`.

- [ ] **Step 1: Server actions.** Same parse as old `registerServer` but no consent field and no `owner_id`/Discord ID in the insert. `createServer`: pre-check count < `MAX_SERVERS_PER_OWNER` (friendly error `"You can list up to 5 servers."`); insert `.select("id").single()`; then `after(() => announceServer(id))`; `redirect("/dashboard")`. Map: `23505` → address field error `"That server is already registered"`; message `server_limit` → cap error; 0 rows on update / RLS → `"Your owner account is suspended."` when `ownerStatus === "suspended"`, else generic. `updateServer`/`deleteServer` filter `.eq("id", id)` (RLS restricts to own). All `revalidatePath("/dashboard")` and `revalidatePath("/servers")`.
- [ ] **Step 2: `ServerForm`.** Generalize the moved form to the props above: prefill from `initial`, hidden `id` input when editing, drop consent checkbox and Discord-name slot, keep fields/limits.
- [ ] **Step 3: Pages.** `/dashboard/servers/new` — owner+active only (else redirect `/dashboard`); prefill from the user's latest `approved` application **only when they have zero servers** (`server_name`→`name`, `server_address`→`address`, `edition`, `play_styles`, `discord_link`→`discord_invite`, first 200 chars of `server_about`→`description`). `/dashboard/servers/[id]/edit` — load own server or `notFound()`; suspended → read-only notice, no form. Dashboard owner view: list own servers with "Hidden by admin: {reason}" badge, Edit link, Delete button (`<form action={deleteServer}>` with confirm via a client `onSubmit` `confirm()`), "Add server" disabled at cap, suspended banner.
- [ ] **Step 4: Retire old flow.** Delete the two `servers/register` files. `next.config.ts`: `async redirects() { return [{ source: "/servers/register", destination: "/dashboard", permanent: false }]; }`. `/servers/page.tsx`: remove `.eq("status", "approved")`, add `id={s.id}` (and `scroll-mt-24`) on the `<li>` in `ServerItem`, button → `href="/dashboard"` label "List your server", subtitle → "Community Minecraft servers from approved owners. Click an address to copy it.", empty-state line → "Server owners can list theirs from the dashboard." `/profile`: add a "Server dashboard" `Link` to `/dashboard` near the existing actions. `schema.sql`: pointer comment now names migrations 003 **and** 004 (004 replaces the servers table).
- [ ] **Step 5: Verify** `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` — Expected: all pass. Then in the preview, as an approved owner with a test webhook set in `.env.local`: add server (prefilled) → lands on `/dashboard`, shows on `/servers`, one Discord message, no pings; edit address → `audit_log` flagged row; delete + re-add → no second message; `/servers/register` → `/dashboard`.
- [ ] **Step 6: Commit** — `git add -A src next.config.ts supabase && git commit -m "feat: owner server management, discord announcements, retire server requests"`

### Task 8: Admin — overview + applications

**Files:**
- Create: `src/app/admin/actions.ts`, `src/app/admin/AdminNav.tsx`, `src/app/admin/page.tsx`, `src/app/admin/applications/page.tsx`, `src/app/admin/applications/[id]/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin`, `reasonSchema`, RPCs.
- Produces in `actions.ts` (each starts with `await requireAdmin()`, calls one RPC, revalidates `/admin` paths, returns `FormState`):
  - `approveApplication(prev: FormState, fd: FormData)` (`id`)
  - `rejectApplication(prev: FormState, fd: FormData)` (`id`, `reason`)
  - `setServerHidden(prev: FormState, fd: FormData)` (`id`, `hidden` `"true"|"false"`, `reason`)
  - `setOwnerStatus(prev: FormState, fd: FormData)` (`user_id`, `status`)
  - `markAuditReviewed(prev: FormState, fd: FormData)` (`ids` via `getAll`)
  - Map RPC message `not_pending` → `"This application was already reviewed."`.
- Produces `AdminNav({ current }: { current: string })` — links: Overview, Applications, Servers, Owners, Audit.

- [ ] **Step 1: Actions** per Interfaces.
- [ ] **Step 2: `/admin`** — `SiteHeader` + `AdminNav` + Suspense content calling `requireAdmin()`; three counts (pending applications, unreviewed flagged audit rows, unreviewed `announce_failed` rows) with `count: "exact", head: true`.
- [ ] **Step 3: `/admin/applications`** — pending oldest first (limit 50): server name, Discord name, submitted date, link to detail. `/admin/applications/[id]` — every field, `discord_link` rendered only if `isDiscordInvite`; Approve form; Reject form with required reason (`maxLength 200`); reviewed applications show status/reason and no buttons.
- [ ] **Step 4: Verify** in the preview: non-admin visiting `/admin` and `/admin/applications/<id>` → 404; admin approves → applicant's `/dashboard` shows owner view; double-submit approve → "already reviewed" error; reject without reason → field error.
- [ ] **Step 5: Commit** — `git commit -m "feat: admin overview and application review"`

### Task 9: Admin — servers, owners, audit

**Files:**
- Create: `src/app/admin/servers/page.tsx`, `src/app/admin/owners/page.tsx`, `src/app/admin/audit/page.tsx`

**Interfaces:**
- Consumes: Task 8 actions, `requireAdmin`.

- [ ] **Step 1: `/admin/servers`** — all servers newest first (limit 100) with owner Discord name (from `user_roles`), hidden badge + reason; Hide form (reason required) / Unhide button. Small `?q=` filter on name/address with `ilike`.
- [ ] **Step 2: `/admin/owners`** — `user_roles where role = 'owner'`: Discord name/ID, status, server count; Suspend / Reinstate button.
- [ ] **Step 3: `/admin/audit`** — unreviewed first, then flagged, then newest (limit 100): time, action, server name snapshot, field, old → new, actor. Flagged rows highlighted. Checkbox per unreviewed row + "Mark reviewed" submit (`markAuditReviewed`).
- [ ] **Step 4: Verify** in the preview: hide a server → gone from `/servers`, owner sees reason, owner edit keeps it hidden; suspend owner → all their servers gone from `/servers`, owner dashboard read-only; reinstate → back (except the admin-hidden one); audit shows each step with the right actor; mark reviewed → overview counts drop.
- [ ] **Step 5: Commit** — `git commit -m "feat: admin server, owner and audit pages"`

### Task 10: Final check

- [ ] **Step 1:** Re-run `supabase/tests/004_owner_program_check.sql` — Expected: `ALL OWNER PROGRAM CHECKS PASSED`.
- [ ] **Step 2:** `npm test && npm run lint && npx tsc --noEmit && npm run build` — Expected: all pass.
- [ ] **Step 3:** In a browser devtools console while logged in as a plain owner, call the Supabase REST API with the page's session to `PATCH /rest/v1/servers?id=eq.<own id>` with `{"is_hidden":false}` and `GET /rest/v1/audit_log` — Expected: 401/403 (permission denied) and `[]`.
- [ ] **Step 4:** With the webhook set in `.env.local` and after `npm run build`: `grep -rln "discord.com/api/webhooks" .next/static` — Expected: no matches (webhook URL never in the client bundle).
- [ ] **Step 5:** Add `DISCORD_SERVER_WEBHOOK_URL` to Vercel env (Production + Preview) before merging.
