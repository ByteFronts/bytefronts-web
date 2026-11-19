import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/config";
import RegisterForm from "./RegisterForm";
import { deleteRegistration, signInWithDiscord, signOut } from "./actions";

export const metadata: Metadata = { title: `Register · ${siteConfig.name}` };

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
      {children}
    </p>
  );
}

async function RegisterContent({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const { error, deleted } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <Notice>
        Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to <code>.env.local</code> and fill
        in your Supabase URL and key (see README).
      </Notice>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        {error && <Notice>Discord login didn&apos;t complete. Please try again.</Notice>}
        {deleted && (
          <Notice>Your registration and login were deleted. You can register again any time.</Notice>
        )}
        <p className="mb-6 text-white/70">
          Log in with Discord so we can link your registration to your Discord account. We only read your public
          profile (username and ID). We never post for you or read your messages.
        </p>
        <form action={signInWithDiscord}>
          <button
            type="submit"
            className="w-full rounded-lg bg-[#5865F2] px-4 py-2.5 font-semibold text-white transition hover:bg-[#4752c4]"
          >
            Continue with Discord
          </button>
        </form>
      </>
    );
  }

  const { data: existing } = await supabase
    .from("registrations")
    .select("minecraft_username, edition, play_styles, timezone, language, age_range, bio")
    .eq("user_id", user.id)
    .maybeSingle();

  const name = user.user_metadata?.custom_claims?.global_name ?? user.user_metadata?.full_name ?? "player";

  return (
    <>
      <div className="mb-6 flex items-center justify-between text-sm text-white/60">
        <span>
          Logged in as <span className="text-white">{name}</span>
        </span>
        <form action={signOut}>
          <button className="underline hover:text-white">Log out</button>
        </form>
      </div>

      <RegisterForm defaults={existing ?? {}} isUpdate={Boolean(existing)} />

      {existing && (
        <form action={deleteRegistration} className="mt-8 border-t border-white/10 pt-6">
          <p className="mb-2 text-sm text-white/50">
            Want out? This deletes your registration and logs you out.
          </p>
          <button className="text-sm text-red-400 underline hover:text-red-300">Delete my registration</button>
        </form>
      )}
    </>
  );
}

export default function RegisterPage(props: PageProps<"/register">) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-12">
      <Link href="/" className="text-sm text-white/50 hover:text-white">
        ← Back
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-white">Find your Minecraft crew</h1>
      <p className="mb-8 mt-2 text-white/60">Tell us how you play. Matching happens in our Discord server.</p>
      <Suspense fallback={<p className="text-white/50">Loading…</p>}>
        <RegisterContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
