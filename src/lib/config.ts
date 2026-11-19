// Edit these (or set the env vars) to match your community.
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "ByteFronts",
  tagline: "Find friends to play Minecraft with.",
  serverName: process.env.NEXT_PUBLIC_SERVER_NAME ?? "Our Minecraft Server",
  serverAddress: process.env.NEXT_PUBLIC_SERVER_ADDRESS ?? "play.example.com",
  discordInvite: process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/your-invite",
};

export const isPlaceholderServer = siteConfig.serverAddress === "play.example.com";

export const EDITIONS = [
  { value: "java", label: "Java" },
  { value: "bedrock", label: "Bedrock" },
  { value: "both", label: "Both" },
] as const;

export const PLAY_STYLES = [
  { value: "survival", label: "Survival" },
  { value: "pvp", label: "PvP" },
  { value: "building", label: "Building" },
  { value: "redstone", label: "Redstone" },
  { value: "adventure", label: "Adventure" },
  { value: "minigames", label: "Minigames" },
  { value: "roleplay", label: "Roleplay" },
  { value: "speedrun", label: "Speedrun" },
] as const;

export const AGE_RANGES = [
  { value: "13-15", label: "13–15" },
  { value: "16-17", label: "16–17" },
  { value: "18-24", label: "18–24" },
  { value: "25+", label: "25+" },
] as const;

export const LANGUAGES = [
  "English",
  "ไทย (Thai)",
  "Bahasa Indonesia",
  "Español",
  "Português",
  "Français",
  "Deutsch",
  "日本語",
  "한국어",
  "中文",
  "Other",
] as const;

export const TIMEZONES = Array.from({ length: 27 }, (_, i) => {
  const offset = i - 12;
  const sign = offset < 0 ? "-" : "+";
  const abs = String(Math.abs(offset)).padStart(2, "0");
  const value = `UTC${sign}${abs}:00`;
  return { value, label: value };
});
