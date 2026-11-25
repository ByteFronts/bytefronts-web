"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveProfile, signOut, type FormState } from "./actions";
import { Steps } from "./RegisterShell";
import Avatar from "@/components/Avatar";
import Confetti from "@/components/Confetti";
import { Chips, ErrorBanner, Field, Segmented, inputClass } from "@/components/form/controls";
import { EDITIONS, LOOKING_FOR, PLAY_STYLES, PLAY_TIMES, siteConfig } from "@/lib/config";

const card = "panel p-6 pb-7";

export default function RegisterForm({ discordName, discordAvatar }: { discordName: string; discordAvatar: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const fe = state.fieldErrors ?? {};

  const [edition, setEdition] = useState("java");
  const [styles, setStyles] = useState<string[]>([]);
  const [playTime, setPlayTime] = useState("evenings");
  const [lookingFor, setLookingFor] = useState<string[]>(["friends"]);
  const [bio, setBio] = useState("");

  if (state.ok) {
    return (
      <div className={`${card} anim-hero`}>
        <Steps step={2} />
        <Confetti trigger={1} />
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
          <circle cx="28" cy="28" r="24" stroke="#5bd66a" strokeWidth="4" strokeLinecap="round" className="anim-draw-circle" />
          <path d="M17 29l8 8 15-17" stroke="#5bd66a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="anim-draw-check" />
        </svg>
        <h2 className="mt-4 font-display text-2xl font-bold">You&apos;re in!</h2>
        <p className="mt-3 text-sm text-muted">
          Your profile is saved. Open our Discord server and the matching bot will message you when it finds your
          squad.
        </p>
        <a
          href={siteConfig.discordInvite}
          className="btn btn-discord mt-6 w-full"
        >
          Open the Discord server
        </a>
        <Link
          href="/profile"
          className="btn mt-3 w-full"
        >
          Edit my profile
        </Link>
      </div>
    );
  }

  return (
    <div className={card}>
      <Steps step={2} />
      <h2 className="font-display text-2xl font-bold">Your player profile</h2>

      <div className="slot mt-5 flex items-center gap-3 p-3">
        <Avatar source="discord" discordUrl={discordAvatar} size={32} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted">Logged in with Discord</p>
          <p className="truncate text-sm font-medium">{discordName}</p>
        </div>
        <form action={signOut}>
          <button className="text-xs text-brand hover:underline">Change</button>
        </form>
      </div>

      <form action={action} className="mt-5 space-y-5">
        <input type="hidden" name="_form" value="register" />

        <Field label="Minecraft username" htmlFor="minecraft_username" error={fe.minecraft_username?.[0]}>
          <input
            id="minecraft_username"
            name="minecraft_username"
            placeholder="e.g. Steve_Builder"
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

        <Field label="When do you play?" error={fe.play_time?.[0]}>
          <Segmented name="play_time" value={playTime} onChange={setPlayTime} options={PLAY_TIMES} />
        </Field>

        <Field label="I am looking for" error={fe.looking_for?.[0]}>
          <Chips name="looking_for" value={lookingFor} onChange={setLookingFor} options={LOOKING_FOR} />
        </Field>

        <Field label="About you" htmlFor="bio" hint={`${bio.length} / 200`} error={fe.bio?.[0]}>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={200}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a little about how you play..."
            className={inputClass}
          />
        </Field>

        <div>
          <label className="flex items-start gap-2.5 text-xs text-muted">
            <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 accent-[#5bd66a]" />
            <span>
              I&apos;m 13 or older and I agree to share this profile with the MineFriend matching system. I can
              delete it at any time.
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
          {pending ? "Creating…" : "Create my profile"}
        </button>
      </form>
    </div>
  );
}
