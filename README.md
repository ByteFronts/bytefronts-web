# ByteFronts website

Landing page + registration form for the Minecraft friend-matching community.
Players log in with Discord, fill in a short form, and the data is saved to Supabase.
Matching and chat happen in your Discord server (a bot reads the same database).

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth) · Vercel

## 1. Run it locally

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev                  # http://localhost:3000
```

Edit `src/lib/config.ts` (or the `NEXT_PUBLIC_*` values in `.env.local`) for your site name,
Minecraft server address and Discord invite link.

## 2. Set up Supabase (free tier is fine)

1. Create a project at https://supabase.com.
2. **SQL Editor** → paste and run `supabase/schema.sql` (creates the `registrations` table with row-level security).
3. **Project Settings → API**: copy the Project URL and the anon/publishable key into `.env.local`.

## 3. Set up Discord login

1. https://discord.com/developers/applications → **New Application**.
2. **OAuth2**: copy the Client ID and Client Secret. Add this redirect URL:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. Supabase → **Authentication → Providers → Discord**: enable it and paste the Client ID and Secret.
4. Supabase → **Authentication → URL Configuration**: set Site URL to your site, and add
   `http://localhost:3000/**` and your production URL (`https://yourdomain.com/**`) to Redirect URLs.

## 4. Deploy

Push to GitHub, import the repo in Vercel, and add the same environment variables there.
Then update the Supabase Site URL / Redirect URLs to your production domain.

## Using your Cloudflare domain

Recommended: host on Vercel and keep Cloudflare as your DNS.

1. Vercel project → **Settings → Domains** → add `yourdomain.com` (and `www.yourdomain.com`).
   Vercel shows the exact DNS records to create.
2. Cloudflare → your domain → **DNS → Records**: add those records exactly as Vercel shows them.
   Set the proxy status to **DNS only** (grey cloud). It is the simplest setup; if you turn the
   orange-cloud proxy on, set **SSL/TLS** to **Full (strict)**.
3. Vercel → **Settings → Environment Variables**: set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`, then redeploy.
4. Supabase → **Authentication → URL Configuration**: set **Site URL** to `https://yourdomain.com` and add
   `https://yourdomain.com/**` (and the `www` version if you use it) to **Redirect URLs**.
5. The Discord developer portal needs no change: its redirect URL is still the Supabase callback
   (`https://YOUR-PROJECT.supabase.co/auth/v1/callback`).

## 5. The Discord bot (next step)

The bot should use Supabase's **service role key** (server-side only, never in this website or in git)
to read the `registrations` table. Match on `discord_id`, `edition`, `play_styles`, `timezone`,
`language` and `age_range` (keep `13-15` / `16-17` away from adult matches).

## Notes

- The Discord ID is taken from the verified login, not from the form, so nobody can register as someone else.
- Players can update or delete their registration on `/register`.
- Before launch, add a short privacy policy and terms page.
