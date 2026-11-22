import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import AsciiField from "@/components/AsciiField";
import CopyEmail from "@/components/CopyEmail";
import MatchCard from "@/components/MatchCard";
import Reveal from "@/components/Reveal";
import { siteConfig } from "@/lib/config";

// The home page is strictly black and white: re-point the shared brand tokens for this subtree only.
const monochrome = { "--brand": "#f2f5f7", "--brand-ink": "#0b0f14" } as CSSProperties;

const email = "contact@bytefronts.com";

const projects = [
  {
    title: "MineFriend",
    status: "Available",
    body: "Minecraft matching built around how you play. Find friends and servers that fit your style, right inside Discord.",
    meta: "Friends · Servers · Discord",
    href: "/minefriend",
    cta: "Open MineFriend",
  },
  {
    title: "Future products",
    status: "In development",
    body: "We are a small team and MineFriend is just the start. More tools that make Minecraft more social are coming.",
    meta: "Coming soon",
  },
];

const team = [
  { name: "sw1ft_z", role: "Founder & Developer", bio: "Don't be afraid to make a difference." },
  { name: "adx0.ry", role: "Software Engineer", bio: "La peace" },
  { name: "Team member", role: "Role", bio: "Short bio goes here." },
];

const btnPrimary =
  "rounded-md bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-fg/85";
const btnOutline =
  "rounded-md border border-fg/40 px-5 py-2.5 text-sm font-semibold transition hover:border-fg hover:bg-fg/5";
const eyebrow = "text-xs font-medium uppercase tracking-[0.18em] text-muted";
const heading = "mt-4 text-3xl font-semibold tracking-tight sm:text-4xl";

function Wordmark({ className }: { className: string }) {
  return (
    <Image src="/bytefronts-logo.svg" alt={siteConfig.name} width={996} height={225} className={`w-auto invert ${className}`} />
  );
}

export default function Home() {
  return (
    <div className="mono contents" style={monochrome}>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label={siteConfig.name}>
            <Wordmark className="h-7" />
          </Link>
          <nav className="hidden gap-8 text-sm text-fg/80 md:flex">
            <a href="#work" className="nav-link hover:text-fg">Our work</a>
            <a href="#team" className="nav-link hover:text-fg">Team</a>
            <a href="#contact" className="nav-link hover:text-fg">Contact</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-line">
          <div className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
            <p className={`anim-hero ${eyebrow}`}>Technology company</p>
            <h1 className="anim-hero mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl" style={{ animationDelay: "0.08s" }}>
              Software that makes Minecraft more social.
            </h1>
            <p className="anim-hero mt-6 max-w-xl text-lg leading-relaxed text-muted" style={{ animationDelay: "0.16s" }}>
              {siteConfig.name} is a small team building tools that help players find friends and servers that fit the way they play.
            </p>
            <div className="anim-hero mt-10 flex flex-wrap gap-3" style={{ animationDelay: "0.24s" }}>
              <a href="#work" className={btnPrimary}>View our work</a>
              <a href="#contact" className={btnOutline}>Contact us</a>
            </div>
          </div>
        </section>

        <section id="work" className="border-b border-line py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <p className={eyebrow}>Our work</p>
              <h2 className={heading}>What we&apos;re building</h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {projects.map((p, i) => (
                <Reveal
                  key={p.title}
                  delay={i * 120}
                  className={`flex flex-col rounded-md border p-8 transition-colors hover:border-fg/50 ${
                    p.href ? "border-line bg-surface" : "border-dashed border-line bg-transparent"
                  }`}
                >
                  <p className={eyebrow}>{p.status}</p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{p.body}</p>
                  <p className="mt-6 text-xs uppercase tracking-wider text-fg/60">{p.meta}</p>
                  {p.href && (
                    <>
                      <div className="mt-6">
                        <MatchCard
                          label="Example match"
                          name="Alex"
                          subtitle="Java · Evenings · Chill"
                          match={87}
                          avatar="brand"
                          tags={[{ text: "Survival", active: true }, { text: "Redstone" }, { text: "Building" }]}
                        />
                      </div>
                      <Link href={p.href} className={`${btnPrimary} mt-8 w-fit`}>
                        {p.cta}
                      </Link>
                    </>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="relative overflow-hidden border-b border-line py-20">
          <AsciiField rgb="242, 245, 247" />
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <p data-ascii-quiet className={`w-fit ${eyebrow}`}>Team</p>
              <h2 data-ascii-quiet className={`w-fit ${heading}`}>The people behind the work</h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {team.map((m, i) => (
                <Reveal key={i} delay={i * 120} className="rounded-md border border-line bg-surface p-6">
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-bg text-sm font-semibold uppercase"
                  >
                    {m.name.slice(0, 2)}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{m.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted">{m.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{m.bio}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-20">
          <Reveal className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className={eyebrow}>Contact</p>
              <h2 className={heading}>Get in touch</h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                Questions, partnerships or feedback? Email us or reach the team on our Discord server.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <CopyEmail email={email} className={btnPrimary} />
              <a href={siteConfig.discordInvite} className={btnOutline}>Join our Discord</a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Wordmark className="h-4 opacity-70" />
            <span>© 2026 {siteConfig.name}</span>
          </div>
          <span>
            <a href={`mailto:${email}`} className="hover:text-fg">Contact</a> · <a href={siteConfig.discordInvite} className="hover:text-fg">Discord</a> ·<Link href="/privacy" className="hover:text-fg">Privacy</Link> · <Link href="/terms" className="hover:text-fg">Terms</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
