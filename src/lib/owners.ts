import { z } from "zod";
// Relative imports with extension so `node --test` can load this file (no `@/` alias there).
import { EDITIONS, PLAY_STYLES, SIZE_BUCKETS } from "./config.ts";
import { isDiscordInvite, normalizeAddress } from "./servers.ts";

const values = <T extends readonly { value: string }[]>(list: T) => list.map((x) => x.value) as [string, ...string[]];

const required = (label: string, max: number) =>
  z.string().trim().min(1, `Enter ${label}`).max(max, `Max ${max} characters`);

const sizeBucket = z.enum(values(SIZE_BUCKETS), { error: "Choose a size" });

export const applicationSchema = z.object({
  server_name: required("a server name", 48),
  server_address: z.string().transform((v, ctx) => {
    const n = normalizeAddress(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Enter a valid address like play.example.com" });
      return z.NEVER;
    }
    return n;
  }),
  edition: z.enum(values(EDITIONS), { error: "Choose an edition" }),
  server_about: required("a description", 500),
  play_styles: z.array(z.enum(values(PLAY_STYLES))).min(1, "Pick at least one play style").max(8),
  play_styles_other: z.string().trim().max(40, "Max 40 characters").transform((v) => v || null),
  player_base_size: sizeBucket,
  community_size: sizeBucket,
  running_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date")
    .refine((v) => new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v, "Enter a real date")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "Date can't be in the future"),
  discord_link: z.string().trim().refine(isDiscordInvite, "Use a discord.gg invite link"),
  why_join: required("a reason", 500),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const reasonSchema = z.string().trim().min(1, "Enter a reason").max(200, "Max 200 characters");
