"use client";

import { useActionState, useEffect, useState } from "react";
import { saveProfile, signOut, type FormState } from "@/app/register/actions";
import Avatar from "@/components/Avatar";
import Confetti from "@/components/Confetti";
import { Chips, ErrorBanner, Field, Segmented, Toggle, inputClass } from "@/components/form/controls";
import {
  AVATAR_SOURCES,
  BANNER_COLORS,
  EDITIONS,
  LOOKING_FOR,
  PLAY_STYLES,
  PLAY_TIMES,
  VIBES,
  siteConfig,
} from "@/lib/config";
import { bannerGradient, type Profile } from "@/lib/profile";

const card = "scroll-mt-6 rounded-3xl border border-line bg-surface p-6 md:p-8";
const cardTitle = "font-display text-2xl font-bold";
const cardSub = "mt-1 text-sm text-muted";

const nav = [
  { id: "appearance", label: "Profile" },
  { id: "play-style", label: "Play style" },
  { id: "privacy", label: "Privacy" },
  { id: "account", label: "Account" },
];

const AVATAR_OPTIONS = [...AVATAR_SOURCES, { value: "upload", label: "Upload" }];

function label(list: readonly { value: string; label: string }[], value: string) {
  return list.find((x) => x.value === value)?.label ?? value;
}

function Preview({ form, discordAvatar }: { form: Profile; discordAvatar: string | null }) {
  const sub = [form.minecraft_username || "your_username", label(EDITIONS, form.edition)].join(" · ");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return (
    <div>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted">Live preview</p>
      <div
        className="overflow-hidden rounded-3xl border border-line bg-surface"
        style={{
          transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: "transform 0.15s ease-out",
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTilt({
            x: ((e.clientX - r.left) / r.width - 0.5) * 6,
            y: -((e.clientY - r.top) / r.height - 0.5) * 6,
          });
        }}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div
          className="relative h-[88px] overflow-hidden transition-[background] duration-500"
          style={{ background: bannerGradient(form.banner_color) }}
        >
          {/* A light sweep plays each time the banner color changes. */}
          <span
            key={form.banner_color}
            aria-hidden
            className="anim-sweep absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </div>
        <div className="relative px-5 pb-5">
          <div key={form.avatar_source} className="anim-tag-in -mt-8 w-fit">
            <Avatar
              source={form.avatar_source}
              discordUrl={discordAvatar}
              minecraftName={form.minecraft_username}
              size={64}
              className="border-4 border-surface"
            />
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold">{form.display_name || "Your name"}</p>
              <p className="truncate text-xs text-muted">{sub}</p>
            </div>
            <span className="rounded-md bg-bg px-2 py-1 text-xs font-medium text-brand">92% match</span>
          </div>
          <p className="mt-4 min-h-10 break-words text-sm text-muted">{form.bio || "Your bio shows up here."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {form.play_styles.length === 0 && <span className="text-xs text-muted">Pick a play style</span>}
            {form.play_styles.map((s, i) => (
              <span
                key={s}
                className={`anim-tag-in rounded-full px-3 py-1 text-xs ${
                  i === 0 ? "bg-brand font-medium text-brand-ink" : "border border-line bg-bg text-fg/80"
                }`}
              >
                {label(PLAY_STYLES, s)}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-discord px-4 py-3 text-center text-sm font-semibold text-white">
            Say hi on Discord
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">
        This is how other players see you in matches. Changes update here as you edit.
      </p>
    </div>
  );
}

export default function ProfileEditor({
  initial,
  discordAvatar,
  deleteAction,
}: {
  initial: Profile;
  discordAvatar: string | null;
  deleteAction: () => Promise<void>;
}) {
  const [form, setForm] = useState<Profile>(initial);
  const [baseline, setBaseline] = useState<Profile>(initial);
  const set = (patch: Partial<Profile>) => setForm((f) => ({ ...f, ...patch }));

  const [celebrate, setCelebrate] = useState(0);

  // Highlight the settings section that is currently on screen (scroll-spy).
  const [active, setActive] = useState(nav[0].id);
  useEffect(() => {
    const onScroll = () => {
      // The active section is the last one whose top has passed 30% of the viewport height.
      let current = nav[0].id;
      for (const n of nav) {
        const el = document.getElementById(n.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.3) current = n.id;
      }
      // At the very bottom the last card may be too short to reach that line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = nav[nav.length - 1].id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await saveProfile(prev, fd);
    if (result.ok) {
      setBaseline(form);
      setCelebrate((n) => n + 1);
    }
    return result;
  }, {});
  const fe = state.fieldErrors ?? {};
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  return (
    <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-8 px-6 py-8 md:px-16 lg:grid-cols-[232px_minmax(0,1fr)_360px]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted">Settings</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              aria-current={active === n.id ? "location" : undefined}
              onClick={() => setActive(n.id)}
              className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-[15px] transition ${
                active === n.id ? "bg-surface text-fg" : "text-fg/70 hover:bg-surface/60 hover:text-fg"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 transition-colors duration-300 ${active === n.id ? "bg-brand" : "bg-line"}`}
                aria-hidden
              />
              {n.label}
            </a>
          ))}
        </nav>
        <form action={signOut} className="mt-4 hidden lg:block">
          <button className="px-4 py-2 text-sm text-muted transition hover:text-fg">Log out</button>
        </form>
      </aside>

      <div className="min-w-0 space-y-6">
        <form action={action} className="space-y-6">
          <input type="hidden" name="_form" value="settings" />

          <section id="appearance" className={card}>
            <h2 className={cardTitle}>Appearance</h2>
            <p className={cardSub}>Pick a banner color and avatar for your profile card.</p>

            <div className="relative mt-6 h-24 max-w-[616px] rounded-xl transition-[background] duration-500" style={{ background: bannerGradient(form.banner_color) }}>
              <Avatar
                source={form.avatar_source}
                discordUrl={discordAvatar}
                minecraftName={form.minecraft_username}
                size={72}
                className="absolute -bottom-6 left-6 border-4 border-surface"
              />
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <span className="text-xs text-muted">Banner color</span>
              <input type="hidden" name="banner_color" value={form.banner_color} />
              <div role="radiogroup" aria-label="Banner color" className="flex gap-3">
                {BANNER_COLORS.map((c) => {
                  const on = form.banner_color === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={c.label}
                      onClick={() => set({ banner_color: c.value })}
                      className={`h-7 w-7 rounded-full transition hover:scale-110 ${on ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : ""}`}
                      style={{ background: c.hex }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <Field label="Avatar">
                <Segmented
                  name="avatar_source"
                  value={form.avatar_source}
                  onChange={(v) => set({ avatar_source: v })}
                  options={AVATAR_OPTIONS}
                  disabledValues={["upload"]}
                />
              </Field>
              <p className="mt-2 text-xs text-muted">Custom uploads are coming soon.</p>
            </div>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Basics</h2>
            <p className={cardSub}>This is what other players see first.</p>
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Display name" htmlFor="display_name" error={fe.display_name?.[0]}>
                  <input
                    id="display_name"
                    name="display_name"
                    value={form.display_name}
                    onChange={(e) => set({ display_name: e.target.value })}
                    maxLength={32}
                    className={inputClass}
                    required
                  />
                </Field>
                <Field label="Minecraft username" htmlFor="minecraft_username" error={fe.minecraft_username?.[0]}>
                  <input
                    id="minecraft_username"
                    name="minecraft_username"
                    value={form.minecraft_username}
                    onChange={(e) => set({ minecraft_username: e.target.value })}
                    autoComplete="off"
                    className={inputClass}
                    required
                  />
                </Field>
              </div>
              <Field label="Edition" error={fe.edition?.[0]}>
                <Segmented name="edition" value={form.edition} onChange={(v) => set({ edition: v })} options={EDITIONS} />
              </Field>
              <Field label="Bio" htmlFor="bio" hint={`${form.bio.length} / 200`} error={fe.bio?.[0]}>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  maxLength={200}
                  value={form.bio}
                  onChange={(e) => set({ bio: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section id="play-style" className={card}>
            <h2 className={cardTitle}>Play style</h2>
            <p className={cardSub}>We use this to find friends and servers that fit you.</p>
            <div className="mt-6 space-y-5">
              <Field label="What do you play?" error={fe.play_styles?.[0]}>
                <Chips name="play_styles" value={form.play_styles} onChange={(v) => set({ play_styles: v })} options={PLAY_STYLES} />
              </Field>
              <Field label="When do you play?" error={fe.play_time?.[0]}>
                <Segmented name="play_time" value={form.play_time} onChange={(v) => set({ play_time: v })} options={PLAY_TIMES} />
              </Field>
              <Field label="Vibe" error={fe.vibe?.[0]}>
                <Segmented name="vibe" value={form.vibe} onChange={(v) => set({ vibe: v })} options={VIBES} />
              </Field>
              <Field label="I am looking for" error={fe.looking_for?.[0]}>
                <Chips name="looking_for" value={form.looking_for} onChange={(v) => set({ looking_for: v })} options={LOOKING_FOR} />
              </Field>
            </div>
          </section>

          <section id="privacy" className={card}>
            <h2 className={cardTitle}>Privacy</h2>
            <div className="mt-6 space-y-5">
              <Toggle
                name="show_in_matching"
                checked={form.show_in_matching}
                onChange={(v) => set({ show_in_matching: v })}
                title="Show me in matching"
                description="Turn off to pause matches without deleting your profile."
              />
              <Toggle
                name="show_discord_name"
                checked={form.show_discord_name}
                onChange={(v) => set({ show_discord_name: v })}
                title="Show my Discord name to matches"
                description="Matches can message you on Discord."
              />
              <Toggle
                name="recommend_servers"
                checked={form.recommend_servers}
                onChange={(v) => set({ recommend_servers: v })}
                title="Recommend servers to me"
                description="Get server suggestions based on your play style."
              />
            </div>
          </section>

          {state.error && <ErrorBanner>{state.error}</ErrorBanner>}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <span aria-live="polite" className="mr-auto text-sm text-muted">
              {state.ok && !dirty ? (
                <span key={celebrate} className="anim-pop inline-block text-brand">
                  Saved ✓
                </span>
              ) : dirty ? (
                "You have unsaved changes"
              ) : (
                ""
              )}
            </span>
            <button
              type="button"
              disabled={!dirty || pending}
              onClick={() => setForm(baseline)}
              className="rounded-lg border border-line bg-bg px-5 py-3 text-sm font-semibold transition hover:border-fg/40 disabled:opacity-40"
            >
              Discard changes
            </button>
            <button
              type="submit"
              disabled={!dirty || pending}
              className="btn-shine rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-ink disabled:opacity-40"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <section id="account" className={card}>
          <h2 className={cardTitle}>Account</h2>
          <p className={cardSub}>Signed in with Discord. Matching happens in {siteConfig.name}&apos;s Discord server.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <form action={signOut}>
              <button className="rounded-lg border border-line bg-bg px-4 py-2.5 text-sm font-semibold transition hover:border-fg/40">
                Log out
              </button>
            </form>
            <form action={deleteAction}>
              <button className="text-sm text-red-400 underline transition hover:text-red-300">
                Delete my profile
              </button>
            </form>
          </div>
          <p className="mt-3 text-xs text-muted">Deleting removes your profile and logs you out. This can&apos;t be undone.</p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Preview form={form} discordAvatar={discordAvatar} />
      </aside>
      <Confetti trigger={celebrate} />
    </div>
  );
}
