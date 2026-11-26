"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { applicationSchema } from "@/lib/owners";
import type { FormState } from "@/app/register/actions";

export async function submitApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in with Discord again." };

  // Only these fields are read from the form: never user, Discord ID/name or status (the DB fills those).
  const parsed = applicationSchema.safeParse({
    server_name: formData.get("server_name") ?? "",
    server_address: formData.get("server_address") ?? "",
    edition: formData.get("edition"),
    server_about: formData.get("server_about") ?? "",
    play_styles: formData.getAll("play_styles").map(String),
    play_styles_other: formData.get("play_styles_other") ?? "",
    player_base_size: formData.get("player_base_size"),
    community_size: formData.get("community_size"),
    running_since: formData.get("running_since") ?? "",
    discord_link: formData.get("discord_link") ?? "",
    why_join: formData.get("why_join") ?? "",
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { error } = await supabase.from("owner_applications").insert(parsed.data);

  if (error) {
    if (error.code === "23505") return { error: "You already have an application waiting for review." };
    if (error.code === "42501") return { error: "You're already a server owner." };
    if (error.message.includes("no_discord_identity"))
      return { error: "Couldn't read your Discord account. Please log in again." };
    return { error: "Something went wrong sending your application. Please try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
