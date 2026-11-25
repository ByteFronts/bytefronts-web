"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerServer } from "./actions";
import { signOut, type FormState } from "@/app/register/actions";
import { Chips, ErrorBanner, Field, Segmented, inputClass } from "@/components/form/controls";
import { EDITIONS, PLAY_STYLES } from "@/lib/config";

const card = "panel p-6 pb-7";

export default function ServerRegisterForm({ discordName }: { discordName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerServer, {});
  const fe = state.fieldErrors ?? {};

  const [edition, setEdition] = useState("java");
  const [styles, setStyles] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  if (state.ok) {
    return (
      <div className={`${card} anim-hero`}>
        <h2 className="font-display text-2xl font-bold">Submitted!</h2>
        <p className="mt-3 text-sm text-muted">
          We&apos;ll review your server and list it once it&apos;s approved. You can check its status on this page.
        </p>
        <Link
          href="/servers"
          className="btn mt-6 w-full"
        >
          Browse servers
        </Link>
      </div>
    );
  }

  return (
    <div className={card}>
      <h2 className="font-display text-2xl font-bold">Register your server</h2>

      <div className="slot mt-5 flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted">Logged in with Discord</p>
          <p className="truncate text-sm font-medium">{discordName}</p>
        </div>
        <form action={signOut}>
          <button className="text-xs text-brand hover:underline">Change</button>
        </form>
      </div>

      <form action={action} className="mt-5 space-y-5">
        <Field label="Server name" htmlFor="name" error={fe.name?.[0]}>
          <input id="name" name="name" maxLength={48} placeholder="e.g. Cozy Survival" className={inputClass} required />
        </Field>

        <Field label="Server address" htmlFor="address" error={fe.address?.[0]}>
          <input
            id="address"
            name="address"
            placeholder="play.example.com"
            autoComplete="off"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Edition" error={fe.edition?.[0]}>
          <Segmented name="edition" value={edition} onChange={setEdition} options={EDITIONS} />
        </Field>

        <Field label="Play style" hint="Pick all that fit" error={fe.play_styles?.[0]}>
          <Chips name="play_styles" value={styles} onChange={setStyles} options={PLAY_STYLES} />
        </Field>

        <Field label="Description" htmlFor="description" hint={`${description.length} / 200`} error={fe.description?.[0]}>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's your server about?"
            className={inputClass}
          />
        </Field>

        <Field label="Discord invite" htmlFor="discord_invite" hint="Optional" error={fe.discord_invite?.[0]}>
          <input
            id="discord_invite"
            name="discord_invite"
            placeholder="https://discord.gg/..."
            autoComplete="off"
            className={inputClass}
          />
        </Field>

        <div>
          <label className="flex items-start gap-2.5 text-xs text-muted">
            <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 accent-[#5bd66a]" />
            <span>
              I run this server and agree to list it publicly on ByteFronts once it&apos;s approved.
            </span>
          </label>
          {fe.consent && <p className="mt-1.5 text-xs text-red-400">{fe.consent[0]}</p>}
        </div>

        {state.error && <ErrorBanner>{state.error}</ErrorBanner>}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-brand w-full"
        >
          {pending ? "Submitting…" : "Submit server"}
        </button>
      </form>
    </div>
  );
}
