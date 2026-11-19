"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AGE_RANGES, EDITIONS, LANGUAGES, PLAY_STYLES, TIMEZONES } from "@/lib/config";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function signInWithDiscord() {
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: `${origin}/auth/callback?next=/register`, scopes: "identify" },
  });

  if (error || !data.url) redirect("/register?error=auth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/register");
}

const schema = z.object({
  minecraft_username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_. ]{3,32}$/, "3–32 characters: letters, numbers, spaces, _ or ."),
  edition: z.enum(EDITIONS.map((e) => e.value) as [string, ...string[]], {
    error: "Choose an edition",
  }),
  play_styles: z
    .array(z.enum(PLAY_STYLES.map((p) => p.value) as [string, ...string[]]))
    .min(1, "Pick at least one play style")
    .max(8),
  timezone: z.enum(TIMEZONES.map((t) => t.value) as [string, ...string[]], {
    error: "Choose a timezone",
  }),
  language: z.enum(LANGUAGES, { error: "Choose a language" }),
  age_range: z.enum(AGE_RANGES.map((a) => a.value) as [string, ...string[]], {
    error: "Choose an age range",
  }),
  bio: z.string().trim().max(280, "Max 280 characters").optional(),
  consent: z.literal("on", { error: "You need to agree to continue" }),
});

export async function saveRegistration(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    minecraft_username: formData.get("minecraft_username"),
    edition: formData.get("edition"),
    play_styles: formData.getAll("play_styles"),
    timezone: formData.get("timezone"),
    language: formData.get("language"),
    age_range: formData.get("age_range"),
    bio: formData.get("bio") || undefined,
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in with Discord again." };

  // Take the Discord ID from the verified login, never from the form.
  const discord = user.identities?.find((i) => i.provider === "discord");
  const meta = user.user_metadata ?? {};
  const discordId: string | undefined =
    discord?.identity_data?.provider_id ?? meta.provider_id ?? discord?.identity_data?.sub ?? meta.sub;
  if (!discordId) return { error: "Couldn't read your Discord ID. Please log in again." };
  const discordUsername: string | null =
    meta.custom_claims?.global_name ?? meta.full_name ?? meta.name ?? null;

  const values = {
    minecraft_username: parsed.data.minecraft_username,
    edition: parsed.data.edition,
    play_styles: parsed.data.play_styles,
    timezone: parsed.data.timezone,
    language: parsed.data.language,
    age_range: parsed.data.age_range,
    bio: parsed.data.bio,
  };
  const { error } = await supabase.from("registrations").upsert(
    {
      user_id: user.id,
      discord_id: discordId,
      discord_username: discordUsername,
      ...values,
      bio: values.bio ?? null,
      consent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: "Something went wrong saving your registration. Please try again." };
  return { ok: true };
}

export async function deleteRegistration() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await supabase.from("registrations").delete().eq("user_id", user.id);
  await supabase.auth.signOut();
  redirect("/register?deleted=1");
}
