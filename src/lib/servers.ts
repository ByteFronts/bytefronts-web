import { z } from "zod";
// Relative import with extension so `node --test` can load this file (no `@/` alias there).
import { EDITIONS, PLAY_STYLES } from "./config.ts";

const values = <T extends readonly { value: string }[]>(list: T) => list.map((x) => x.value) as [string, ...string[]];

const HOST = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;

// Returns a lowercase `host` or `host:port`, or null if it isn't a plain server address.
export function normalizeAddress(input: string): string | null {
  const [rawHost, port, ...rest] = input.trim().toLowerCase().split(":");
  const host = rawHost.replace(/\.$/, "");
  if (rest.length || host.length > 253 || !HOST.test(host)) return null;
  if (port === undefined) return host;
  if (!(/^\d{1,5}$/.test(port) && +port >= 1 && +port <= 65535)) return null;
  return `${host}:${+port}`;
}

const INVITE = /^https:\/\/(discord\.gg|discord\.com\/invite)\/[\w-]+$/;
export const isDiscordInvite = (v: string) => INVITE.test(v);

export const serverSchema = z.object({
  name: z.string().trim().min(1, "Enter a server name").max(48, "Max 48 characters"),
  address: z.string().transform((v, ctx) => {
    const n = normalizeAddress(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Enter a valid address like play.example.com" });
      return z.NEVER;
    }
    return n;
  }),
  edition: z.enum(values(EDITIONS), { error: "Choose an edition" }),
  description: z.string().trim().max(200, "Max 200 characters").transform((v) => v || null),
  play_styles: z.array(z.enum(values(PLAY_STYLES))).min(1, "Pick at least one play style").max(8),
  discord_invite: z
    .string()
    .trim()
    .regex(/^(https:\/\/(discord\.gg|discord\.com\/invite)\/[\w-]+)?$/, "Use a discord.gg invite link")
    .transform((v) => v || null),
});

export type ServerInput = z.infer<typeof serverSchema>;
