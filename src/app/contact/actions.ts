"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { z } from "zod";
import type { FormState } from "@/app/register/actions";
import { buildContactEmail, CONTACT_EMAIL, contactSchema } from "@/lib/contact";

const FIELDS = ["name", "email", "topic", "subject", "message"] as const;
const LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;
// shortcut: per-instance memory, so the limit resets on cold starts and isn't shared across
// instances; move to a Supabase table or Vercel Firewall rate limit if spam gets through.
const recent = new Map<string, number[]>();

const SEND_FAILED = `We couldn't send your message right now. Please email us at ${CONTACT_EMAIL}.`;

export async function sendContact(_prev: FormState, fd: FormData): Promise<FormState> {
  // Honeypot: real visitors never see or fill the "website" field. Pretend success for bots.
  if (String(fd.get("website") ?? "")) return { ok: true };

  const parsed = contactSchema.safeParse(Object.fromEntries(FIELDS.map((k) => [k, String(fd.get(k) ?? "")])));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= LIMIT) {
    return { error: "You've sent a few messages already. Please wait an hour or reach us on Discord." };
  }

  const key = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!key || !domain) {
    console.error("[contact] RESEND_API_KEY or RESEND_EMAIL_DOMAIN is not set");
    return { error: SEND_FAILED };
  }

  const { subject, text } = buildContactEmail(parsed.data);
  const { error } = await new Resend(key).emails.send({
    from: `ByteFronts Website <no-reply@${domain}>`,
    to: CONTACT_EMAIL,
    replyTo: parsed.data.email,
    subject,
    text,
  });
  if (error) {
    console.error("[contact] send failed:", error.name, error.message);
    return { error: SEND_FAILED };
  }

  recent.set(ip, [...hits, now]);
  return { ok: true };
}
