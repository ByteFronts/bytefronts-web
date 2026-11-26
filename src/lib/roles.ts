import { cache } from "react";
import { notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDiscordIdentity } from "@/lib/profile";

export type Viewer = {
  user: User;
  role: "player" | "owner" | "admin";
  ownerStatus: "active" | "suspended" | null;
  discordName: string | null;
};

// cache(): one DB round-trip per request however many components call it.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // On error (e.g. 42P01, migration not applied) data is null, so the viewer is a player.
  const { data: row } = await supabase
    .from("user_roles")
    .select("role, owner_status, discord_username")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = row?.role === "admin" || row?.role === "owner" ? row.role : "player";
  return {
    user,
    role,
    ownerStatus: row?.owner_status === "active" || row?.owner_status === "suspended" ? row.owner_status : null,
    discordName: row?.discord_username || getDiscordIdentity(user).name,
  };
});

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer?.role !== "admin") notFound();
  return viewer;
}
