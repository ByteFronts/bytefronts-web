import Link from "next/link";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import { getDiscordIdentity } from "@/lib/profile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const loginClass = "btn btn-discord whitespace-nowrap px-4 pb-2.5 pt-2";

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
      className="btn gap-2.5 pb-2 pl-1.5 pr-4 pt-1.5"
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
