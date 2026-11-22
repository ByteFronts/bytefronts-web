import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import Logo from "@/components/Logo";
import AsciiField from "@/components/AsciiField";
import PixelScene from "@/components/PixelScene";
import Reveal from "@/components/Reveal";
import ScrollUi from "@/components/ScrollUi";
import { siteConfig } from "@/lib/config";

const projects = [
  {
    title: "MineFriend",
    body: "Minecraft matching built around how you play. Find friends and servers that fit your style, right inside Discord.",
    tags: ["Friends", "Servers", "Discord"],
    href: "/minefriend",
    cta: "Open MineFriend",
  },
  {
    title: "More on the way",
    body: "We are a small team and MineFriend is just the start. More tools that make Minecraft more social are coming.",
    tags: ["Soon"],
  },
];

const team = [
  { name: "sw1ft_z", role: "Founder & Developer", bio: "Don't be afraid to make a difference.", brand: true },
  { name: "adx0.ry", role: "Software Enginner", bio: "La peace" },
  { name: "Team member", role: "Role", bio: "Short bio goes here." },
];

const btnBrand =
  "btn-shine rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink";

export default function Home() {
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
          <div className="relative mx-auto w-full max-w-4xl px-6 pb-28 pt-16 text-center md:pt-24">
            <h1 className="anim-hero font-display text-6xl font-bold tracking-tight sm:text-7xl">
              Byte<span className="bg-gradient-to-r from-brand to-[#9af2a4] bg-clip-text text-transparent">Fronts</span>
            </h1>
            <p className="anim-hero mx-auto mt-6 max-w-xl text-lg text-muted" style={{ animationDelay: "0.1s" }}>
              A small tech startup building tools that make Minecraft more social.
            </p>
            <div className="anim-hero mt-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: "0.2s" }}>
              <a href="#work" data-scene-trigger className={btnBrand}>
                View our work
              </a>
              <a
                href={siteConfig.discordInvite}
                className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-fg/40"
              >
                Join the community
              </a>
            </div>
          </div>
          <div className="pixel-ground" aria-hidden />
        </section>

        <section id="work" className="bg-surface/60 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-wide text-brand">Our work</p>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">What we&apos;re building</h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {projects.map((p, i) => (
                <Reveal key={p.title} delay={i * 120} className="lift rounded-2xl border border-line bg-card p-8">
                  <h3 className="font-display text-2xl font-semibold">{p.title}</h3>
                  <p className="mt-4 text-muted">{p.body}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full border border-line bg-surface px-3 py-1 text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                  {p.href && (
                    <Link href={p.href} className={`${btnBrand} mt-8 inline-block`}>
                      {p.cta}
                    </Link>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="relative overflow-hidden py-20">
          <AsciiField />
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <p data-ascii-quiet className="w-fit text-xs font-medium uppercase tracking-wide text-brand">The team</p>
              <h2 data-ascii-quiet className="mt-4 w-fit font-display text-3xl font-bold sm:text-4xl">Who&apos;s behind the work</h2>
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
              <h2 className="font-display text-3xl font-bold sm:text-5xl">Say hi</h2>
              <p className="mx-auto mt-4 max-w-md text-muted">
                Questions, ideas, or just want to hang out? Join us on Discord.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href={siteConfig.discordInvite} className={btnBrand}>
                  Join the community
                </a>
                <Link
                  href="/minefriend"
                  className="rounded-lg border border-line bg-bg px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-fg/40"
                >
                  Try MineFriend
                </Link>
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
