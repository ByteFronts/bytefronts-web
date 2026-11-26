"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_SOURCES,
  BANNER_COLORS,
  EDITIONS,
  LOOKING_FOR,
  PLAY_STYLES,
  PLAY_TIMES,
  VIBES,
} from "@/lib/config";
import { getDiscordIdentity, normalizeProfile, PROFILE_COLUMNS, type Profile } from "@/lib/profile";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const LOGIN_RETURN_PATHS = ["/register", "/dashboard"];

export async function signInWithDiscord(formData?: FormData) {
  const requested = formData?.get("next");
  const next = LOGIN_RETURN_PATHS.find((p) => p === requested) ?? "/register";
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: `${origin}/auth/callback?next=${next}`, scopes: "identify" },
  });

  if (error || !data.url) redirect(`${next}?error=auth`);
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map((x) => x.value) as [string, ...string[]];

const schema = z.object({
  display_name: z.string().trim().min(1, "Enter a display name").max(32, "Max 32 characters"),
  minecraft_username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_. ]{3,32}$/, "3–32 characters: letters, numbers, spaces, _ or ."),
  edition: z.enum(values(EDITIONS), { error: "Choose an edition" }),
  bio: z.string().trim().max(200, "Max 200 characters"),
  play_styles: z.array(z.enum(values(PLAY_STYLES))).min(1, "Pick at least one play style").max(8),
  play_time: z.enum(values(PLAY_TIMES), { error: "Choose when you play" }),
  vibe: z.enum(values(VIBES), { error: "Choose a vibe" }),
  looking_for: z.array(z.enum(values(LOOKING_FOR))).min(1, "Pick at least one"),
  banner_color: z.enum(BANNER_COLORS.map((c) => c.value) as [string, ...string[]]),
  avatar_source: z.enum(values(AVATAR_SOURCES)),
  show_in_matching: z.boolean(),
  show_discord_name: z.boolean(),
  recommend_servers: z.boolean(),
});

// The register form only collects some fields; the rest keep their current/default values.
const REGISTER_FIELDS = new Set([
  "minecraft_username",
  "edition",
  "play_styles",
  "play_time",
  "looking_for",
  "bio",
]);

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const mode = formData.get("_form") === "settings" ? "settings" : "register";
  const fromForm = (key: string) => mode === "settings" || REGISTER_FIELDS.has(key);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in with Discord again." };

  const { data: existingRow } = await supabase
    .from("registrations")
    .select(PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();
  const discordIdentity = getDiscordIdentity(user);
  const base: Profile = normalizeProfile(existingRow);
  if (!base.display_name) base.display_name = discordIdentity.name;

  const text = (key: keyof Profile) => {
    const v = formData.get(key);
    return fromForm(key) && typeof v === "string" ? v : (base[key] as string);
  };
  const list = (key: keyof Profile) =>
    fromForm(key) ? formData.getAll(key).map(String) : (base[key] as string[]);
  const flag = (key: keyof Profile) => (fromForm(key) ? formData.get(key) === "on" : (base[key] as boolean));

  const parsed = schema.safeParse({
    display_name: text("display_name"),
    minecraft_username: text("minecraft_username"),
    edition: text("edition"),
    bio: text("bio"),
    play_styles: list("play_styles"),
    play_time: text("play_time"),
    vibe: text("vibe"),
    looking_for: list("looking_for"),
    banner_color: text("banner_color"),
    avatar_source: text("avatar_source"),
    show_in_matching: flag("show_in_matching"),
    show_discord_name: flag("show_discord_name"),
    recommend_servers: flag("recommend_servers"),
  });

  const isNew = !existingRow;
  const consentFieldErrors: Record<string, string[]> =
    isNew && formData.get("consent") !== "on" ? { consent: ["You need to agree to continue"] } : {};

  if (!parsed.success || Object.keys(consentFieldErrors).length) {
    return {
      fieldErrors: {
        ...(parsed.success ? {} : z.flattenError(parsed.error).fieldErrors),
        ...consentFieldErrors,
      },
    };
  }

  // Take the Discord ID from the verified login, never from the form.
  const discord = user.identities?.find((i) => i.provider === "discord");
  const meta = user.user_metadata ?? {};
  const discordId: string | undefined =
    discord?.identity_data?.provider_id ?? meta.provider_id ?? discord?.identity_data?.sub ?? meta.sub;
  if (!discordId) return { error: "Couldn't read your Discord ID. Please log in again." };

  const now = new Date().toISOString();
  const { error } = await supabase.from("registrations").upsert(
    {
      user_id: user.id,
      discord_id: discordId,
      discord_username: discordIdentity.name,
      ...parsed.data,
      bio: parsed.data.bio || null,
      ...(isNew ? { consent_at: now } : {}),
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    // 42703 / PGRST204 = a column doesn't exist, i.e. the SQL migration hasn't been run.
    if (error.code === "42703" || error.code === "PGRST204") {
      return { error: "The database is missing the latest update. Run supabase/migrations/002_profile_redesign.sql in Supabase." };
    }
    return { error: "Something went wrong saving your profile. Please try again." };
  }

  revalidatePath("/profile");
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
