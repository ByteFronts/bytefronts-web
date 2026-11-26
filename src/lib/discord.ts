import { EDITIONS } from "./config.ts";

export type AnnounceServer = { id: string; name: string; address: string; edition: string; description: string | null };

// Discord embed limits; DB bounds make these a cheap guard only.
const cap = (s: string, n: number) => s.slice(0, n);

export function buildAnnouncement(s: AnnounceServer, ownerName: string, siteUrl: string) {
  const edition = EDITIONS.find((e) => e.value === s.edition)?.label ?? s.edition;
  return {
    allowed_mentions: { parse: [] as [] },
    embeds: [
      {
        title: cap(s.name, 256),
        ...(s.description ? { description: cap(s.description, 4096) } : {}),
        url: `${siteUrl}/servers#${s.id}`,
        fields: [
          { name: "Address", value: s.address, inline: true },
          { name: "Edition", value: edition, inline: true },
          { name: "Owner", value: ownerName, inline: true },
        ],
      },
    ] as [{ title: string; description?: string; url: string; fields: { name: string; value: string; inline?: boolean }[] }],
  };
}

// Returns null on success (any 2xx), else a short error string. Never throws.
export async function postAnnouncement(webhookUrl: string, payload: ReturnType<typeof buildAnnouncement>): Promise<string | null> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (e) {
    return e instanceof Error && e.name === "TimeoutError" ? "timeout" : "network";
  }
}
