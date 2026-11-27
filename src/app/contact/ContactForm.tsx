"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/register/actions";
import { ErrorBanner, Field } from "@/components/form/controls";
import { CONTACT_TOPICS, MESSAGE_MAX } from "@/lib/contact";
import { sendContact } from "./actions";

const inputClass =
  "w-full rounded-md border border-fg/25 bg-transparent px-4 py-3 text-sm text-fg placeholder:text-muted/60 transition focus:border-fg focus:outline-none";
const btn = "rounded-md bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-fg/85 disabled:opacity-60";

export default function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, {});
  // Controlled so React 19's post-action form reset doesn't wipe input after a validation error.
  const [v, setV] = useState({ name: "", email: "", topic: "general", subject: "", message: "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));
  const fe = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="anim-hero self-start rounded-lg border border-fg/15 p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Message sent</h2>
        <p className="mt-3 leading-relaxed text-muted">
          Thanks{v.name ? `, ${v.name.trim()}` : ""}. We&apos;ll reply to {v.email || "your email"} within a few days.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <ErrorBanner>{state.error}</ErrorBanner>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={fe.name?.[0]}>
          <input id="name" name="name" autoComplete="name" maxLength={80} value={v.name} onChange={set("name")} className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="email" error={fe.email?.[0]}>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={254} value={v.email} onChange={set("email")} className={inputClass} />
        </Field>
      </div>

      <Field label="Topic" htmlFor="topic" error={fe.topic?.[0]}>
        <select id="topic" name="topic" value={v.topic} onChange={set("topic")} className={inputClass}>
          {CONTACT_TOPICS.map((t) => (
            <option key={t.value} value={t.value} className="bg-bg">
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Subject" htmlFor="subject" error={fe.subject?.[0]}>
        <input id="subject" name="subject" maxLength={120} value={v.subject} onChange={set("subject")} className={inputClass} />
      </Field>

      <Field label="Message" htmlFor="message" hint={`${v.message.length}/${MESSAGE_MAX}`} error={fe.message?.[0]}>
        <textarea id="message" name="message" rows={6} maxLength={MESSAGE_MAX} value={v.message} onChange={set("message")} className={`${inputClass} resize-y`} />
      </Field>

      {/* Honeypot: hidden from people and screen readers; bots that fill it are dropped. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={btn}>
          {pending ? "Sending…" : "Send message"}
        </button>
        <p className="text-xs text-muted">We only use your details to reply to you.</p>
      </div>
    </form>
  );
}
