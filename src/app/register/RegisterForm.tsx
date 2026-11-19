"use client";

import { useActionState } from "react";
import { saveRegistration, type FormState } from "./actions";
import { AGE_RANGES, EDITIONS, LANGUAGES, PLAY_STYLES, TIMEZONES, siteConfig } from "@/lib/config";

export type Defaults = {
  minecraft_username?: string;
  edition?: string;
  play_styles?: string[];
  timezone?: string;
  language?: string;
  age_range?: string;
  bio?: string | null;
};

const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none";
const label = "mb-1.5 block text-sm font-medium text-white/80";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-red-400">{errors[0]}</p>;
}

export default function RegisterForm({
  defaults,
  isUpdate,
}: {
  defaults: Defaults;
  isUpdate: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveRegistration, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={label} htmlFor="minecraft_username">
          Minecraft username
        </label>
        <input
          id="minecraft_username"
          name="minecraft_username"
          defaultValue={defaults.minecraft_username}
          placeholder="Steve"
          className={input}
          required
        />
        <FieldError errors={fe.minecraft_username} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="edition">
            Edition
          </label>
          <select id="edition" name="edition" defaultValue={defaults.edition ?? ""} className={input} required>
            <option value="" disabled>
              Select…
            </option>
            {EDITIONS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <FieldError errors={fe.edition} />
        </div>
        <div>
          <label className={label} htmlFor="age_range">
            Age range
          </label>
          <select id="age_range" name="age_range" defaultValue={defaults.age_range ?? ""} className={input} required>
            <option value="" disabled>
              Select…
            </option>
            {AGE_RANGES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <FieldError errors={fe.age_range} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>How do you like to play?</legend>
        <div className="flex flex-wrap gap-2">
          {PLAY_STYLES.map((p) => (
            <label
              key={p.value}
              className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-400/15 has-[:checked]:text-emerald-200"
            >
              <input
                type="checkbox"
                name="play_styles"
                value={p.value}
                defaultChecked={defaults.play_styles?.includes(p.value)}
                className="sr-only"
              />
              {p.label}
            </label>
          ))}
        </div>
        <FieldError errors={fe.play_styles} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="timezone">
            Timezone
          </label>
          <select id="timezone" name="timezone" defaultValue={defaults.timezone ?? ""} className={input} required>
            <option value="" disabled>
              Select…
            </option>
            {TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <FieldError errors={fe.timezone} />
        </div>
        <div>
          <label className={label} htmlFor="language">
            Main language
          </label>
          <select id="language" name="language" defaultValue={defaults.language ?? ""} className={input} required>
            <option value="" disabled>
              Select…
            </option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <FieldError errors={fe.language} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="bio">
          About you <span className="text-white/40">(optional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={280}
          defaultValue={defaults.bio ?? ""}
          placeholder="What are you building or looking for?"
          className={input}
        />
        <FieldError errors={fe.bio} />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-white/70">
          <input type="checkbox" name="consent" defaultChecked={isUpdate} className="mt-1 accent-emerald-400" />
          <span>
            I&apos;m 13 or older and I agree that {siteConfig.name} stores this information and uses it to
            match me with other players inside Discord. I can delete it at any time.
          </span>
        </label>
        <FieldError errors={fe.consent} />
      </div>

      {state.error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state.ok && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <p className="font-medium">{isUpdate ? "Saved!" : "You're registered!"}</p>
          <p className="mt-1 text-emerald-200/80">
            Join our Discord server so we can match you with other players.
          </p>
          <a
            href={siteConfig.discordInvite}
            className="mt-3 inline-block rounded-lg bg-emerald-400 px-4 py-2 font-medium text-black hover:bg-emerald-300"
          >
            Join the Discord
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {pending ? "Saving…" : isUpdate ? "Update registration" : "Register"}
      </button>
    </form>
  );
}
