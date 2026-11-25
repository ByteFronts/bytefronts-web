import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { siteConfig } from "@/lib/config";
import { getDiscordIdentity, normalizeProfile, PROFILE_COLUMNS } from "@/lib/profile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteRegistration } from "@/app/register/actions";
import ProfileEditor from "./ProfileEditor";

export const metadata: Metadata = { title: `Profile · ${siteConfig.name}` };

async function ProfileContent() {
  if (!isSupabaseConfigured()) redirect("/register");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/register");

  const { data: row, error } = await supabase
    .from("registrations")
    .select(PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();
  // Only send people to /register when they truly have no profile. On a read error,
  // redirecting would bounce between /register and /profile forever.
  if (error) {
    return (
      <p className="notch mx-auto mt-16 max-w-md bg-red-400/10 px-4 py-3 text-sm text-red-300">
        Couldn&apos;t load your profile. Please refresh, and check the Supabase migration has been run.
      </p>
    );
  }
  if (!row) redirect("/register");

  const discord = getDiscordIdentity(user);
  const profile = normalizeProfile(row);
  if (!profile.display_name) profile.display_name = discord.name;

  return (
    <>
      <SiteHeader current="/profile" />
      <ProfileEditor initial={profile} discordAvatar={discord.avatarUrl} deleteAction={deleteRegistration} />
      <SiteFooter />
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-muted">Loading…</p>}>
      <ProfileContent />
    </Suspense>
  );
}
