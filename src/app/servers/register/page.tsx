import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/config";
import { getDiscordIdentity } from "@/lib/profile";
import RegisterShell from "@/app/register/RegisterShell";
import { signInWithDiscord } from "@/app/register/actions";
import ServerRegisterForm from "./ServerRegisterForm";

export const metadata: Metadata = { title: `Register your server · ${siteConfig.name}` };

const card = "panel p-6 pb-7";

const serverCopy = {
  eyebrow: "Servers",
  title: ["Get your server", "found."],
  blurb: "Submit your Minecraft server. Once approved, it's listed for players to find and join.",
  bullets: ["Log in with Discord, no passwords", "We review every server before listing", "Free to list"],
};

const STATUS_COPY: Record<string, string> = {
  pending: "is waiting for review. We'll list it once it's approved.",
  approved: "is approved and listed.",
  rejected: "wasn't approved. Reach out on Discord if you think that's a mistake.",
};

async function ServerRegisterContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <p className="notch bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
        Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your
        Supabase URL and key.
      </p>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        {error && (
          <p className="notch mb-4 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            Discord login didn&apos;t complete. Please try again.
          </p>
        )}
        <div className={card}>
          <h2 className="font-display text-2xl font-bold">Register your server</h2>
          <p className="mt-3 text-sm text-muted">Log in with Discord to submit your Minecraft server for listing.</p>
          <form action={signInWithDiscord} className="mt-6">
            <input type="hidden" name="next" value="/servers/register" />
            <button type="submit" className="btn btn-discord w-full">
              Continue with Discord
            </button>
          </form>
        </div>
      </>
    );
  }

  const { data: existing } = await supabase
    .from("servers")
    .select("name, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    return (
      <div className={card}>
        <h2 className="font-display text-2xl font-bold">Your server</h2>
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-fg">{existing.name}</span> {STATUS_COPY[existing.status] ?? ""}
        </p>
        <Link
          href="/servers"
          className="btn mt-6 w-full"
        >
          Browse servers
        </Link>
      </div>
    );
  }

  return <ServerRegisterForm discordName={getDiscordIdentity(user).name} />;
}

export default function ServerRegisterPage(props: PageProps<"/servers/register">) {
  return (
    <RegisterShell copy={serverCopy}>
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <ServerRegisterContent searchParams={props.searchParams} />
      </Suspense>
    </RegisterShell>
  );
}
