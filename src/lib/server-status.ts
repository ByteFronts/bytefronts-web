import { cacheLife } from "next/cache";

export type ServerStatus = {
  online: boolean;
  playersOnline: number;
  playersMax: number;
  version?: string;
  motd?: string;
} | null;

// Cached for a few minutes so we don't hit the status API on every page view.
export async function getServerStatus(address: string): Promise<ServerStatus> {
  "use cache";
  cacheLife("minutes");

  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(address)}`, {
      headers: { "User-Agent": "ByteFronts-website (Minecraft community site)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      online: Boolean(data.online),
      playersOnline: data.players?.online ?? 0,
      playersMax: data.players?.max ?? 0,
      version: data.version,
      motd: data.motd?.clean?.join(" ").trim() || undefined,
    };
  } catch {
    return null;
  }
}
