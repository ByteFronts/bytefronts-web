# Server Register Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a server owner log in with Discord and submit a Minecraft server for approval, with approved servers listed publicly at `/servers`.

**Architecture:** A new Supabase `servers` table with RLS (public reads approved rows, owners read/insert their own pending row). A pure zod validation module is unit-tested with Node's built-in runner. A server action and a client form mirror the existing `/register` flow. A server-rendered `/servers` page reuses `getServerStatus`.

**Tech Stack:** Next.js 16.4.6 (App Router, server actions), React 19, Supabase (`@supabase/ssr`), zod 4, Tailwind 4, `node --test` (Node 24 strips TS types natively; no new dependencies).

**Spec:** `docs/superpowers/specs/2026-11-24-server-register-design.md`

## Global Constraints

- Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (AGENTS.md: this Next version has breaking changes). Use `PageProps<"/route">` and `await searchParams`, as `src/app/register/page.tsx` does.
- No new dependencies.
- Owner and Discord ID come from the verified session, never from form data. `status` is never read from the form.
- Limits: name ≤ 48 chars; description ≤ 200 chars; `edition` ∈ `EDITIONS`; `play_styles` ⊆ `PLAY_STYLES`, 1–8 items; `status` ∈ pending | approved | rejected, default `pending`.
- Reuse `Field`, `Chips`, `Segmented`, `inputClass`, `ErrorBanner` from `src/components/form/controls.tsx`, and the card styles from `src/app/register`.
- `src/lib/servers.ts` imports only relative paths and `zod` so `node --test` can load it (no `@/` alias).
- Out of scope: ownership verification, admin UI, editing a submitted server, matching players to servers.

## Review Focus

- Address typed with scheme, path, spaces or uppercase (`https://Play.Example.com/`) → rejected or normalized, never stored raw.
- Same address in different case or with a trailing dot → treated as a duplicate.
- Malicious form post with `status=approved` or another `owner_id` → ignored; row is saved `pending` for the session user.
- Logged-out POST to the action → returns the "session expired" error, no insert.
- Owner who already submitted opens `/servers/register` → sees their status, not a second form (and the DB enforces one per owner).

## File Structure

- Create `supabase/migrations/003_servers.sql` — table, constraints, RLS.
- Create `src/lib/servers.ts` — `serverSchema`, `normalizeAddress`, types. Pure, no I/O.
- Create `src/lib/servers.test.ts` — unit tests for the above.
- Create `src/app/servers/register/actions.ts` — `registerServer` server action.
- Create `src/app/servers/register/ServerRegisterForm.tsx` — client form.
- Create `src/app/servers/register/page.tsx` — login gate, status view, form.
- Create `src/app/servers/page.tsx` — public list.
- Modify `package.json` (test script), `supabase/schema.sql` (note pointing at migration), `src/components/AppHeader.tsx` (Servers link), `src/app/sitemap.ts` (`/servers`).

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/003_servers.sql`

**Interfaces:**
- Produces: table `public.servers` with columns `id uuid pk default gen_random_uuid()`, `owner_id uuid not null unique references auth.users(id) on delete cascade`, `owner_discord_id text not null`, `name text not null`, `address text not null unique`, `edition text not null`, `description text`, `play_styles text[] not null default '{}'`, `discord_invite text`, `status text not null default 'pending'`, `consent_at timestamptz not null default now()`, `created_at`, `updated_at`.

- [ ] **Step 1: Write the migration** (idempotent, same style as `002_profile_redesign.sql`: `create table if not exists`, header comment saying to run it once in the Supabase SQL editor). Constraints: check `edition in ('java','bedrock','both')`, check `status in ('pending','approved','rejected')`, check `char_length(name) <= 48`, check `description is null or char_length(description) <= 200`, check `address = lower(address)`.
- [ ] **Step 2: Add RLS.** Enable RLS. Policies: select where `status = 'approved'` (for `anon, authenticated`); select where `auth.uid() = owner_id`; insert with check `auth.uid() = owner_id and status = 'pending'`. No update/delete policies in v1. Wrap `create policy` in `drop policy if exists` first so a re-run is safe.
- [ ] **Step 3: Add a one-line comment in `supabase/schema.sql`** pointing to migration 003 for the `servers` table.
- [ ] **Step 4: Verify.** Run the SQL in the Supabase SQL editor, twice. Expected: no errors on either run; `select * from servers` returns zero rows.
- [ ] **Step 5: Commit** — `git add supabase && git commit -m "feat: add servers table migration"`

### Task 2: Validation module (TDD)

**Files:**
- Create: `src/lib/servers.ts`, `src/lib/servers.test.ts`
- Modify: `package.json` (add script `"test": "node --test src/lib/"`)

**Interfaces:**
- Consumes: `EDITIONS`, `PLAY_STYLES` from `./config`.
- Produces:
  - `normalizeAddress(input: string): string | null` — trims, lowercases, strips one trailing dot; returns `null` if it has a scheme (`://`), path, spaces, or isn't `hostname` / IPv4 with optional `:port` (1–65535).
  - `serverSchema` — zod object for `{ name, address, edition, description, play_styles, discord_invite }`; `address` is transformed with `normalizeAddress` (invalid → issue "Enter a valid address like play.example.com"); `discord_invite` optional, must match `^https://(discord\.gg|discord\.com/invite)/[\w-]+$`, empty string allowed and becomes `null`.

- [ ] **Step 1: Write failing tests** in `servers.test.ts` using `node:test` and `node:assert/strict`. Assertions:
  - `normalizeAddress("Play.Example.com")` → `"play.example.com"`; `"play.example.com."` → `"play.example.com"`; `"play.example.com:25565"` → same; `"1.2.3.4:19132"` ok.
  - `normalizeAddress` returns `null` for `"https://play.example.com"`, `"play.example.com/path"`, `"play example.com"`, `"play.example.com:99999"`, `""`.
  - `serverSchema.safeParse` succeeds for a valid object; fails when `name` is empty or 49 chars, `description` is 201 chars, `play_styles` is empty or contains `"nope"`, `edition` is `"xbox"`, or `discord_invite` is `"https://evil.com/x"`.
  - A parsed valid object ignores unknown keys such as `status` (result has no `status` property).
- [ ] **Step 2: Run** `npm test`. Expected: FAIL, `servers.ts` not found.
- [ ] **Step 3: Implement `servers.ts`** per the Interfaces above. Reuse the `values()` helper idea from `src/app/register/actions.ts` (inline it; don't import across the app dir).
- [ ] **Step 4: Run** `npm test`. Expected: all pass.
- [ ] **Step 5: Commit** — `git add src/lib package.json && git commit -m "feat: server validation schema with tests"`

### Task 3: Register action, form and page

**Files:**
- Create: `src/app/servers/register/actions.ts`, `ServerRegisterForm.tsx`, `page.tsx`

**Interfaces:**
- Consumes: `serverSchema` (Task 2); `createClient`, `isSupabaseConfigured` from `@/lib/supabase/server`; `getDiscordIdentity` from `@/lib/profile`; `signInWithDiscord`, `signOut`, `FormState` from `@/app/register/actions` (the sign-in action redirects back to `/register` — see Step 3).
- Produces: `registerServer(prev: FormState, formData: FormData): Promise<FormState>`.

- [ ] **Step 1: Read** `node_modules/next/dist/docs/` guides on server actions/forms before writing.
- [ ] **Step 2: Implement `registerServer`** (`"use server"`): get session user (none → `{ error: "Your session expired. Please log in with Discord again." }`); parse form with `serverSchema` plus a required `consent` checkbox (field error "You need to agree to continue"); read Discord ID from the user's identities exactly as `saveProfile` does; insert `{ owner_id: user.id, owner_discord_id, ...parsed.data }` — never include `status`. Map error code `23505` to a field error: if the message mentions `address` → "That server is already registered", otherwise (`owner_id`) → `{ error: "You've already submitted a server." }`; map `42P01` to "Run supabase/migrations/003_servers.sql in Supabase."; anything else to the generic retry message. On success `revalidatePath("/servers/register")` and return `{ ok: true }`.
- [ ] **Step 3: Add a `next` parameter to `signInWithDiscord`** in `src/app/register/actions.ts` (read a hidden `next` form field, allow only `/register` or `/servers/register`, default `/register`) so the login returns to the right page. Check that `src/app/auth/callback/route.ts` already honors `?next=` safely; if not, restrict it to the same allowlist.
- [ ] **Step 4: Build `ServerRegisterForm.tsx`** (client, `useActionState`) following `RegisterForm.tsx`: fields name, address, edition (`Segmented`, default `java`), description (200 counter), play styles (`Chips`), Discord invite (optional), consent checkbox, `ErrorBanner`, and a success card saying "Submitted — we'll review it and list it once approved."
- [ ] **Step 5: Build `page.tsx`**: Supabase not configured → same notice as `/register`; no user → Discord login card (form posting `signInWithDiscord` with `next=/servers/register`); user with an existing row (`select status,name where owner_id = user.id`) → status card (pending / approved with link to `/servers` / rejected); else the form. Wrap in `Suspense` like `/register`.
- [ ] **Step 6: Verify** with `preview_start` on the dev server: logged-out page shows the login card; with a session, submit a valid server → success card and a `pending` row in Supabase; reload → status card; submit the same address from a second account → "already registered" error; `npm run lint` and `npm run build` pass.
- [ ] **Step 7: Commit** — `git add src && git commit -m "feat: server registration page and action"`

### Task 4: Public server list and navigation

**Files:**
- Create: `src/app/servers/page.tsx`
- Modify: `src/components/AppHeader.tsx`, `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `getServerStatus(address: string)` from `@/lib/server-status`; `CopyAddress` from `@/components/CopyAddress`; the `servers` table (Task 1).

- [ ] **Step 1: Implement `/servers`** as a server component: select `name,address,edition,description,play_styles,discord_invite` where `status = 'approved'`, order by `created_at desc`, `limit 50`; render a card per server (name, `CopyAddress`, edition, play-style pills, live status/players from `getServerStatus`, Discord invite link if present) in the existing dark card style; empty state with a link to `/servers/register`; a "Register your server" button at the top. Metadata title `Servers · ${siteConfig.name}`.
- [ ] **Step 2: Add a "Servers" link** to `AppHeader.tsx` next to the MineFriend link, using the same `link(...)` helper; add `/servers` to `sitemap.ts`.
- [ ] **Step 3: Verify** in the preview: set one row to `approved` in Supabase → it appears on `/servers`; pending/rejected rows do not (also check logged-out); header link works; `npm run lint` and `npm run build` pass.
- [ ] **Step 4: Commit** — `git add src && git commit -m "feat: public servers list and nav link"`

---

## Self-review notes

- Spec coverage: data/RLS (T1), validation + duplicate handling (T2–3), register route with login gate and status view (T3), public list with live status (T4). Review Focus lines map to tests in T2 (address forms, `status` ignored), T3 Step 6 (duplicate, logged-out, existing submission).
- Calls I made beyond the spec: one server per owner (`unique(owner_id)`), `/servers` limited to 50, addresses with a scheme or path are rejected rather than cleaned, `signInWithDiscord` gains an allowlisted `next` field.
- Not covered by automated tests: the server action and pages (the repo has no browser/E2E harness); they are verified manually in Steps marked "Verify".
