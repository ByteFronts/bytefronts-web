"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/register/actions";
import { Chips, ErrorBanner, Field, Segmented, inputClass } from "@/components/form/controls";
import { EDITIONS, PLAY_STYLES } from "@/lib/config";
import type { ServerInput } from "@/lib/servers";

const card = "panel p-6 pb-7";

export default function ServerForm({
  action: serverAction,
  initial = {},
  submitLabel,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Partial<ServerInput> & { id?: string };
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {});
  const fe = state.fieldErrors ?? {};

  // Controlled so typed values survive a failed submit (React resets uncontrolled form fields).
  const [name, setName] = useState(initial.name ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [edition, setEdition] = useState<string>(initial.edition ?? "java");
  const [styles, setStyles] = useState<string[]>(initial.play_styles ?? []);
  const [description, setDescription] = useState(initial.description ?? "");
  const [invite, setInvite] = useState(initial.discord_invite ?? "");

  return (
    <div className={card}>
      <h2 className="font-display text-2xl font-bold">{initial.id ? "Edit server" : "Add a server"}</h2>

      <form action={action} className="mt-5 space-y-5">
        {initial.id && <input type="hidden" name="id" value={initial.id} />}

        <Field label="Server name" htmlFor="name" error={fe.name?.[0]}>
          <input
            id="name"
            name="name"
            maxLength={48}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cozy Survival"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Server address" htmlFor="address" error={fe.address?.[0]}>
          <input
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            placeholder="https://discord.gg/..."
            autoComplete="off"
            className={inputClass}
          />
        </Field>

        {state.error && <ErrorBanner>{state.error}</ErrorBanner>}

        <button type="submit" disabled={pending} className="btn btn-brand w-full">
          {pending ? "Saving…" : submitLabel}
        </button>
      </form>
    </div>
  );
}
