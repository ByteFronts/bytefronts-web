import type { Metadata } from "next";
import Link from "next/link";
import AsciiField from "@/components/AsciiField";
import MatchShowcase from "@/components/MatchShowcase";
import PixelScene from "@/components/PixelScene";
import ScrollUi from "@/components/ScrollUi";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { siteConfig } from "@/lib/config";

const kinds = [
  {
    title: "Friends",
    body: "Tell us your play style and what you enjoy. We pair you with players you'll actually want to play with, then connect you on Discord.",
    tags: ["Play style", "Interests", "Schedule"],
  },
  {
    title: "Servers",
    body: "Survival, creative, PvP, minigames. Find a server whose community and gameplay fit the way you like to play.",
    tags: ["Survival", "Creative", "PvP", "Minigames"],
  },
];

const steps = [
  { title: "Log in with Discord", body: "One click, no passwords." },
  { title: "Share your play style", body: "Your name, interests and how you like to play." },
  { title: "Get matched", body: "The matching bot in our Discord finds your friends and servers." },
];

const description =
  "MineFriend matches you with Minecraft players and servers that fit how you play, right inside Discord.";

export const metadata: Metadata = {
  title: `MineFriend, find friends to play Minecraft with`,
  description,
  openGraph: { title: "MineFriend", description, type: "website" },
  twitter: { card: "summary", title: "MineFriend", description },
};

const h2 = "font-display text-3xl font-bold tracking-tight sm:text-4xl";

export default function MineFriend() {
  return (
    <>
      <ScrollUi />
      <SiteHeader current="/minefriend" />

      <main className="flex-1">
        <section className="relative">
          <PixelScene />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-24 pt-14 md:grid-cols-[1.1fr_1fr] md:pt-20">
            <div>
              <h1 className="anim-hero font-display text-[clamp(3.5rem,10vw,7rem)] font-bold leading-none tracking-[-0.04em] [text-shadow:0.06em_0.06em_0_var(--brand-deep)]">
                MineFriend
              </h1>
              <p className="anim-hero mt-6 max-w-md text-lg leading-relaxed text-fg/80" style={{ animationDelay: "0.1s" }}>
                Find Minecraft friends and servers that play the way you do. Matching happens right inside Discord.
              </p>
              <div className="anim-hero mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.2s" }}>
                <Link href="/register" data-scene-trigger className="btn btn-brand">
                  Try MineFriend with Discord
                </Link>
                <a href="#how" className="btn">
                  See how it works
                </a>
              </div>
            </div>

            <div className="anim-hero" style={{ animationDelay: "0.3s" }}>
              <MatchShowcase />
            </div>
          </div>
          <div className="pixel-ground" aria-hidden />
        </section>

        <section className="bg-card py-20 md:py-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className={h2}>Two kinds of matches</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {kinds.map((k) => (
                <article key={k.title} className="panel p-8 pb-9">
                  <h3 className="font-display text-2xl font-bold">{k.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{k.body}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {k.tags.map((t) => (
                      <li key={t} className="chip">{t}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="py-20 md:py-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className={h2}>Three steps to your squad</h2>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
              {/* The track joining the steps: a dashed pixel line behind the numbers. */}
              <span
                aria-hidden
                className="absolute left-5 top-5 hidden h-1 w-[calc(100%-2.5rem)] bg-[repeating-linear-gradient(90deg,var(--line)_0_8px,transparent_8px_16px)] md:block"
              />
              {steps.map((s, i) => (
                <li key={s.title} className="relative">
                  <span className="notch flex h-10 w-10 items-center justify-center bg-brand font-display font-bold text-brand-ink shadow-[inset_0_-4px_0_var(--brand-deep)]">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="contact" className="relative overflow-hidden border-t border-line py-20 md:py-28">
          <AsciiField />
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <h2 data-ascii-quiet className="w-fit font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to find your squad?
            </h2>
            <p data-ascii-quiet className="mt-4 w-fit max-w-md leading-relaxed text-fg/80">
              Log in with Discord, share how you play, and get matched with friends and servers in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-brand">
                Try MineFriend with Discord
              </Link>
              <a href={siteConfig.discordInvite} className="btn">
                Join the community
              </a>
            </div>
            <p data-ascii-quiet className="mt-12 w-fit text-sm text-muted">
              MineFriend is made by {siteConfig.name}, a small team building tools that make Minecraft more social.{" "}
              <Link href="/#team" className="text-fg underline underline-offset-4 hover:text-brand">
                Meet the team
              </Link>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
