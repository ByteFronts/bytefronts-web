"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { serverSchema } from "@/lib/servers";
import type { FormState } from "@/app/register/actions";

export async function registerServer(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in with Discord again." };

  // Only these fields are read from the form: never owner, Discord ID or status.
  const parsed = serverSchema.safeParse({
    name: formData.get("name") ?? "",
    address: formData.get("address") ?? "",
    edition: formData.get("edition"),
    description: formData.get("description") ?? "",
    play_styles: formData.getAll("play_styles").map(String),
    discord_invite: formData.get("discord_invite") ?? "",
  });
  const consentErrors: Record<string, string[]> =
    formData.get("consent") === "on" ? {} : { consent: ["You need to agree to continue"] };

  if (!parsed.success || Object.keys(consentErrors).length) {
    return {
      fieldErrors: { ...(parsed.success ? {} : z.flattenError(parsed.error).fieldErrors), ...consentErrors },
    };
  }

  // Take the Discord ID from the verified login, as saveProfile does.
  const discord = user.identities?.find((i) => i.provider === "discord");
  const meta = user.user_metadata ?? {};
  const discordId: string | undefined =
    discord?.identity_data?.provider_id ?? meta.provider_id ?? discord?.identity_data?.sub ?? meta.sub;
  if (!discordId) return { error: "Couldn't read your Discord ID. Please log in again." };

  const { error } = await supabase
    .from("servers")
    .insert({ owner_id: user.id, owner_discord_id: discordId, ...parsed.data });

  if (error) {
    if (error.code === "23505") {
      return error.message.includes("owner_id")
        ? { error: "You've already submitted a server." }
        : { fieldErrors: { address: ["That server is already registered"] } };
    }
    if (error.code === "42P01") return { error: "Run supabase/migrations/003_servers.sql in Supabase." };
    return { error: "Something went wrong submitting your server. Please try again." };
  }

  revalidatePath("/servers/register");
  return { ok: true };
}
