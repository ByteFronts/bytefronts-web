import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/config";
import { getDiscordIdentity } from "@/lib/profile";
import RegisterForm from "./RegisterForm";
import RegisterShell, { Steps } from "./RegisterShell";
import { signInWithDiscord } from "./actions";

export const metadata: Metadata = { title: `Join MineFriend · ${siteConfig.name}` };

const card = "panel p-6 pb-7";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="notch mb-4 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
      {children}
    </p>
  );
}

async function RegisterContent({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const { error, deleted } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <Notice>
        Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to <code>.env.local</code> and fill in
        your Supabase URL and key.
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
        {deleted && <Notice>Your profile and login were deleted. You can join again any time.</Notice>}
        <div className={card}>
          <Steps step={1} />
          <h2 className="font-display text-2xl font-bold">Join MineFriend</h2>
          <p className="mt-3 text-sm text-muted">
            Log in with Discord to create your player profile. Matching happens in our Discord server.
          </p>
          <form action={signInWithDiscord} className="mt-6">
            <button
              type="submit"
              className="btn btn-discord w-full"
            >
              Continue with Discord
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted">
            We only read your Discord username and avatar. We never post for you.
          </p>
          <p className="mt-5 border-t border-line pt-4 text-center text-xs text-muted">
            Already registered? Just log in to update your profile.
          </p>
        </div>
      </>
    );
  }

  const { data: existing } = await supabase
    .from("registrations")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/profile");

  const discord = getDiscordIdentity(user);
  return <RegisterForm discordName={discord.name} discordAvatar={discord.avatarUrl} />;
}

export default function RegisterPage(props: PageProps<"/register">) {
  return (
    <RegisterShell backToMineFriend>
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <RegisterContent searchParams={props.searchParams} />
      </Suspense>
    </RegisterShell>
  );
}
