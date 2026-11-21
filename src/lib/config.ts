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
  { value: "creative", label: "Creative" },
  { value: "redstone", label: "Redstone" },
  { value: "pvp", label: "PvP" },
  { value: "minigames", label: "Minigames" },
  { value: "roleplay", label: "Roleplay" },
  { value: "building", label: "Building" },
  { value: "adventure", label: "Adventure" },
] as const;

export const PLAY_TIMES = [
  { value: "weekdays", label: "Weekdays" },
  { value: "evenings", label: "Evenings" },
  { value: "weekends", label: "Weekends" },
] as const;

export const VIBES = [
  { value: "chill", label: "Chill" },
  { value: "competitive", label: "Competitive" },
  { value: "social", label: "Social" },
] as const;

export const LOOKING_FOR = [
  { value: "friends", label: "Friends" },
  { value: "servers", label: "Servers" },
] as const;

export const AVATAR_SOURCES = [
  { value: "discord", label: "Discord avatar" },
  { value: "minecraft", label: "Minecraft head" },
] as const;

export const BANNER_COLORS = [
  { value: "green", label: "Green", hex: "#5bd66a" },
  { value: "blue", label: "Blue", hex: "#5865f2" },
  { value: "orange", label: "Orange", hex: "#f29a4a" },
  { value: "pink", label: "Pink", hex: "#ec6a9a" },
  { value: "cyan", label: "Cyan", hex: "#4cc9e0" },
  { value: "purple", label: "Purple", hex: "#a66cf0" },
] as const;
