import { z } from "zod";

export const CONTACT_EMAIL = "contact@bytefronts.com";

export const CONTACT_TOPICS = [
  { value: "general", label: "General" },
  { value: "partnership", label: "Partnership" },
  { value: "server", label: "List my server" },
  { value: "bug", label: "Bug report" },
  { value: "privacy", label: "Privacy / data" },
] as const;

export const MESSAGE_MAX = 1000;

const text = (label: string, max: number) =>
  z.string().trim().min(1, `Enter ${label}`).max(max, `Keep ${label} under ${max} characters`);

export const contactSchema = z.object({
  name: text("your name", 80),
  email: z.string().trim().pipe(z.email("Enter a valid email address")).pipe(z.string().max(254)),
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [string, ...string[]], "Pick a topic"),
  subject: text("a subject", 120),
  message: text("a message", MESSAGE_MAX),
});

export type ContactInput = z.infer<typeof contactSchema>;

// Plain-text email to the company inbox. Reply-To is the visitor, so "Reply" answers them.
export function buildContactEmail(c: ContactInput) {
  const topic = CONTACT_TOPICS.find((t) => t.value === c.topic)?.label ?? c.topic;
  // Strip line breaks so a subject can't inject extra headers or look odd in the inbox.
  const subject = `[${topic}] ${c.subject}`.replace(/[\r\n]+/g, " ");
  const body = [`From: ${c.name} <${c.email}>`, `Topic: ${topic}`, "", c.message].join("\n");
  return { subject, text: body };
}
