import Link from "next/link";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import { getDiscordIdentity } from "@/lib/profile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const loginClass =
  "rounded-lg bg-discord px-4 py-2 text-sm font-semibold text-white transition hover:bg-discord-hover";

function LoginLink() {
  return (
    <Link href="/register" className={loginClass}>
      Login with Discord
    </Link>
  );
}

async function Account() {
  if (!isSupabaseConfigured()) return <LoginLink />;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <LoginLink />;

  const { name, avatarUrl } = getDiscordIdentity(user);
  return (
    <Link
      href="/profile"
      className="flex items-center gap-2.5 rounded-lg border border-line bg-surface py-1.5 pl-1.5 pr-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-brand/60"
    >
      <Avatar source="discord" discordUrl={avatarUrl} size={28} />
      <span className="max-w-[8rem] truncate">{name}</span>
    </Link>
  );
}

// Shows the signed-in user's profile link, or the login button for visitors.
export default function HeaderAuth() {
  return (
    <Suspense fallback={<LoginLink />}>
      <Account />
    </Suspense>
  );
}
