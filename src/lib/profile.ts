import { BANNER_COLORS } from "@/lib/config";

export type Profile = {
  display_name: string;
  minecraft_username: string;
  edition: string;
  bio: string;
  play_styles: string[];
  play_time: string;
  vibe: string;
  looking_for: string[];
  banner_color: string;
  avatar_source: string;
  show_in_matching: boolean;
  show_discord_name: boolean;
  recommend_servers: boolean;
};

export const DEFAULT_PROFILE: Profile = {
  display_name: "",
  minecraft_username: "",
  edition: "java",
  bio: "",
  play_styles: [],
  play_time: "evenings",
  vibe: "chill",
  looking_for: ["friends"],
  banner_color: "green",
  avatar_source: "discord",
  show_in_matching: true,
  show_discord_name: true,
  recommend_servers: false,
};

// "*" so reading still works on a database that hasn't had the latest migration yet;
// normalizeProfile() fills in anything missing.
export const PROFILE_COLUMNS = "*";

// Rows saved before the redesign have nulls in the new columns.
export function normalizeProfile(row: Partial<Record<keyof Profile, unknown>> | null | undefined): Profile {
  const d = DEFAULT_PROFILE;
  const r = row ?? {};
  const str = (v: unknown, fallback: string) => (typeof v === "string" && v ? v : fallback);
  const arr = (v: unknown, fallback: string[]) => (Array.isArray(v) ? (v as string[]) : fallback);
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  return {
    display_name: str(r.display_name, d.display_name),
    minecraft_username: str(r.minecraft_username, d.minecraft_username),
    edition: str(r.edition, d.edition),
    bio: str(r.bio, d.bio),
    play_styles: arr(r.play_styles, d.play_styles),
    play_time: str(r.play_time, d.play_time),
    vibe: str(r.vibe, d.vibe),
    looking_for: arr(r.looking_for, d.looking_for),
    banner_color: str(r.banner_color, d.banner_color),
    avatar_source: str(r.avatar_source, d.avatar_source),
    show_in_matching: bool(r.show_in_matching, d.show_in_matching),
    show_discord_name: bool(r.show_discord_name, d.show_discord_name),
    recommend_servers: bool(r.recommend_servers, d.recommend_servers),
  };
}

export function bannerGradient(key: string) {
  const hex = BANNER_COLORS.find((c) => c.value === key)?.hex ?? BANNER_COLORS[0].hex;
  return `linear-gradient(100deg, color-mix(in srgb, ${hex} 55%, #0b0f14), ${hex})`;
}

// Minecraft head image for a username (public skin data, rendered by mc-heads.net).
export function minecraftHead(username: string) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(username || "Steve")}/128`;
}

export type DiscordIdentity = { name: string; avatarUrl: string | null };

export function getDiscordIdentity(user: {
  user_metadata?: Record<string, unknown> | null;
}): DiscordIdentity {
  const meta = (user.user_metadata ?? {}) as {
    custom_claims?: { global_name?: string };
    full_name?: string;
    name?: string;
    user_name?: string;
    preferred_username?: string;
    avatar_url?: string;
  };
  return {
    // `||` so empty strings fall through to the next option.
    name:
      meta.custom_claims?.global_name ||
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      meta.preferred_username ||
      "player",
    avatarUrl: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
  };
}
