"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitApplication } from "./actions";
import type { FormState } from "@/app/register/actions";
import { Chips, ErrorBanner, Field, Segmented, inputClass } from "@/components/form/controls";
import { EDITIONS, PLAY_STYLES, SIZE_BUCKETS } from "@/lib/config";

const card = "panel p-6 pb-7";

export default function ApplyForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitApplication, {});
  const fe = state.fieldErrors ?? {};

  const [edition, setEdition] = useState("java");
  const [styles, setStyles] = useState<string[]>([]);
  const [playerBase, setPlayerBase] = useState("");
  const [community, setCommunity] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [other, setOther] = useState("");
  const [since, setSince] = useState("");
  const [invite, setInvite] = useState("");
  const [about, setAbout] = useState("");
  const [why, setWhy] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  if (state.ok) {
    return (
      <div className={`${card} anim-hero`}>
        <h2 className="font-display text-2xl font-bold">Application sent</h2>
        <p className="mt-3 text-sm text-muted">Application sent — we&apos;ll review it soon.</p>
        <Link href="/dashboard" className="btn mt-6 w-full">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={card}>
      <h2 className="font-display text-2xl font-bold">Become a server owner</h2>
      <p className="mt-3 text-sm text-muted">Tell us about your server. We read every application.</p>

      <form action={action} className="mt-5 space-y-5">
        <Field label="Server name" htmlFor="server_name" error={fe.server_name?.[0]}>
          <input
            id="server_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            name="server_name"
            maxLength={48}
            placeholder="e.g. Cozy Survival"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Server address" htmlFor="server_address" error={fe.server_address?.[0]}>
          <input
            id="server_address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            name="server_address"
            placeholder="play.example.com"
            autoComplete="off"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Edition" error={fe.edition?.[0]}>
          <Segmented name="edition" value={edition} onChange={setEdition} options={EDITIONS} />
        </Field>

        <Field label="About your server" htmlFor="server_about" hint={`${about.length} / 500`} error={fe.server_about?.[0]}>
          <textarea
            id="server_about"
            name="server_about"
            rows={4}
            maxLength={500}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="What's your server about?"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Play style" hint="Pick all that fit" error={fe.play_styles?.[0]}>
          <Chips name="play_styles" value={styles} onChange={setStyles} options={PLAY_STYLES} max={8} />
        </Field>

        <Field label="Other play style" htmlFor="play_styles_other" hint="Optional" error={fe.play_styles_other?.[0]}>
          <input
            id="play_styles_other"
            name="play_styles_other"
            maxLength={40}
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Players on your server" error={fe.player_base_size?.[0]}>
          <Segmented name="player_base_size" value={playerBase} onChange={setPlayerBase} options={SIZE_BUCKETS} />
        </Field>

        <Field label="Community size" hint="Discord or other" error={fe.community_size?.[0]}>
          <Segmented name="community_size" value={community} onChange={setCommunity} options={SIZE_BUCKETS} />
        </Field>

        <Field label="Running since" htmlFor="running_since" error={fe.running_since?.[0]}>
          <input
            id="running_since"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            name="running_since"
            type="date"
            max={today}
            className={inputClass}
            required
          />
        </Field>

        <Field label="Discord invite" htmlFor="discord_link" error={fe.discord_link?.[0]}>
          <input
            id="discord_link"
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            name="discord_link"
            placeholder="https://discord.gg/..."
            autoComplete="off"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Why do you want to join?" htmlFor="why_join" hint={`${why.length} / 500`} error={fe.why_join?.[0]}>
          <textarea
            id="why_join"
            name="why_join"
            rows={4}
            maxLength={500}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            className={inputClass}
            required
          />
        </Field>

        {state.error && <ErrorBanner>{state.error}</ErrorBanner>}

        <button type="submit" disabled={pending} className="btn btn-brand w-full">
          {pending ? "Sending…" : "Send application"}
        </button>
      </form>
    </div>
  );
}
