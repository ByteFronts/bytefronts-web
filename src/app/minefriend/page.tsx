import type { Metadata } from "next";
import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import Logo from "@/components/Logo";
import MatchShowcase from "@/components/MatchShowcase";
import AsciiField from "@/components/AsciiField";
import PixelScene from "@/components/PixelScene";
import Reveal from "@/components/Reveal";
import ScrollUi from "@/components/ScrollUi";
import { siteConfig } from "@/lib/config";

const kinds = [
  {
    title: "Match friends",
    body: "Tell us your play style and what you enjoy. We pair you with players you will actually want to play with, then connect you on Discord.",
    tags: ["Play style", "Interests", "Schedule"],
  },
  {
    title: "Match servers by play style",
    body: "Survival, creative, PvP, minigames. We help you find a server whose community and gameplay fit the way you like to play.",
    tags: ["Survival", "Creative", "PvP", "Minigames"],
  },
];

const steps = [
  { title: "Login with Discord", body: "One click, no passwords." },
  { title: "Share your play style", body: "Name, interests, and how you like to play." },
  { title: "Get matched", body: "Our Discord matching system finds your friends and servers." },
];

const team = [
  { name: "sw1ft_z", role: "Founder & Developer", bio: "Don't be afraid to make a difference.", brand: true },
  { name: "adx0.ry", role: "Software Enginner", bio: "La peace" },
  { name: "Team member", role: "Role", bio: "Short bio goes here." },
];

const btnBrand =
  "btn-shine rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink";

const description =
  "MineFriend matches you with Minecraft players and servers that fit how you play, right inside Discord.";

export const metadata: Metadata = {
  title: `MineFriend, find friends to play Minecraft with`,
  description,
  openGraph: { title: "MineFriend", description, type: "website" },
  twitter: { card: "summary", title: "MineFriend", description },
};

export default function MineFriend() {
  return (
    <>
      <ScrollUi />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden gap-8 text-sm text-fg/80 md:flex">
          <a href="#work" className="nav-link hover:text-fg">Our work</a>
          <a href="#team" className="nav-link hover:text-fg">Who we are</a>
          <a href="#contact" className="nav-link hover:text-fg">Contact</a>
        </nav>
        <HeaderAuth />
      </header>

      <main className="flex-1">
        <section className="relative">
          <PixelScene />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 pb-24 pt-12 md:grid-cols-2 md:pt-16">
            <div>
              <span className="anim-hero inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-fg/80">
                <span className="anim-pulse-dot h-1.5 w-1.5 rounded-full bg-brand" /> Our latest work
              </span>
              <h1
                className="anim-hero mt-6 font-display text-6xl font-bold tracking-tight sm:text-7xl"
                style={{ animationDelay: "0.1s" }}
              >
                Mine<span className="bg-gradient-to-r from-brand to-[#9af2a4] bg-clip-text text-transparent">Friend</span>
              </h1>
              <p className="anim-hero mt-6 max-w-md text-lg text-muted" style={{ animationDelay: "0.2s" }}>
                Minecraft matching, built around how you play. Find friends who match your style, and servers that
                match it too.
              </p>
              <div className="anim-hero mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
                <Link href="/register" data-scene-trigger className={btnBrand}>
                  Try MineFriend with Discord
                </Link>
                <a
                  href="#how"
                  className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-fg/40"
                >
                  See how it works
                </a>
              </div>
            </div>

            <div className="anim-hero" style={{ animationDelay: "0.35s" }}>
              <MatchShowcase />
            </div>
          </div>
          <div className="pixel-ground" aria-hidden />
        </section>

        <section id="work" className="bg-surface/60 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-wide text-brand">Our work</p>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">One project, two kinds of matches</h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {kinds.map((k, i) => (
                <Reveal key={k.title} delay={i * 120} className="lift rounded-2xl border border-line bg-card p-8">
                  <h3 className="font-display text-2xl font-semibold">{k.title}</h3>
                  <p className="mt-4 text-muted">{k.body}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {k.tags.map((t) => (
                      <span
                        key={t}
                        className="cursor-default rounded-full border border-line bg-surface px-3 py-1 text-xs transition hover:-translate-y-0.5 hover:border-brand/70 hover:text-brand"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Three steps to your squad</h2>
            </Reveal>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 120} className="lift rounded-2xl border border-line bg-surface p-6">
                  <span className="flex h-8 w-8 items-center justify-center badge-pop rounded-lg bg-brand text-sm font-bold text-brand-ink">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section id="team" className="relative overflow-hidden bg-surface/60 py-20">
          <AsciiField />
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <p data-ascii-quiet className="w-fit text-xs font-medium uppercase tracking-wide text-brand">The team</p>
              <h2 data-ascii-quiet className="mt-4 w-fit font-display text-3xl font-bold sm:text-4xl">Who&apos;s behind the work</h2>
              <p data-ascii-quiet className="mt-6 max-w-xl text-fg/75">
                {siteConfig.name} is a small tech startup building tools that make Minecraft more social. MineFriend
                is our first project.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {team.map((m, i) => (
                <Reveal key={i} delay={i * 120} className="lift rounded-2xl border border-line bg-card/95 p-6">
                  <span
                    aria-hidden
                    className={`badge-pop block h-14 w-14 rounded-full ${m.brand ? "bg-brand" : "bg-discord"}`}
                  />
                  <h3 className="mt-5 font-display text-lg font-semibold">{m.name}</h3>
                  <p className="mt-1 text-xs text-brand">{m.role}</p>
                  <p className="mt-3 text-sm text-muted">{m.bio}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="px-6 py-24">
          <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-line bg-surface px-6 pb-24 pt-14 text-center">
            <div
              aria-hidden
              className="anim-glow pointer-events-none absolute left-1/2 top-0 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
            />
            <div className="relative">
              <div aria-hidden className="mb-6 flex justify-center">
                {["bg-discord", "bg-brand", "bg-[#f29a4a]", "bg-[#ec6a9a]"].map((c, i) => (
                  <span
                    key={c}
                    className={`anim-float h-11 w-11 rounded-full border-4 border-surface ${c} ${i ? "-ml-3" : ""}`}
                    style={{ animationDelay: `${i * -1.1}s` }}
                  />
                ))}
              </div>
              <h2 className="font-display text-3xl font-bold sm:text-5xl">Ready to find your squad?</h2>
              <p className="mx-auto mt-4 max-w-md text-muted">
                Log in with Discord, share how you play, and get matched with friends and servers in minutes.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/register" className={btnBrand}>
                  Try MineFriend with Discord
                </Link>
                <a
                  href={siteConfig.discordInvite}
                  className="rounded-lg border border-line bg-bg px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-fg/40"
                >
                  Join the community
                </a>
              </div>
            </div>
            <div className="pixel-ground absolute inset-x-0 bottom-0" aria-hidden />
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-24 pt-8 text-xs text-muted md:pb-8">
        <span>© 2026 {siteConfig.name}</span>
        <span>
          <a href={siteConfig.discordInvite} className="hover:text-fg">Discord</a> · <Link href="/privacy" className="hover:text-fg">Privacy</Link> · <Link href="/terms" className="hover:text-fg">Terms</Link>
        </span>
      </footer>
    </>
  );
}
