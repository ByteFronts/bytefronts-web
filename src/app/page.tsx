import Link from "next/link";
import AsciiField from "@/components/AsciiField";
import MatchCard from "@/components/MatchCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import Spotlight from "@/components/Spotlight";
import { siteConfig } from "@/lib/config";

const team = [
  { name: "sw1ft_z", role: "Founder & Developer", bio: "Don't be afraid to make a difference." },
  { name: "adx0.ry", role: "Software Engineer", bio: "La peace" },
  { name: "Team member", role: "Role", bio: "Short bio goes here." },
];

const links = [
  { href: "#work", label: "Our work" },
  { href: "#team", label: "Team" },
  { href: "#contact", label: "Contact" },
];

const btnPrimary = "rounded-md bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-fg/85";
const btnOutline = "rounded-md border border-fg/40 px-5 py-2.5 text-sm font-semibold transition hover:border-fg hover:bg-fg/5";
const h2 = "text-3xl font-semibold tracking-tight sm:text-4xl";

// The ByteFronts company page is strictly black and white (.mono re-points the brand tokens).
export default function Home() {
  return (
    <div className="mono contents">
      <SiteHeader mono links={links} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line">
          <Spotlight />
          <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-32">
          <h1 className="anim-hero max-w-4xl text-[clamp(2.75rem,7.5vw,6rem)] font-semibold leading-[1] tracking-[-0.035em]">
            We build the ideas others overlook.
          </h1>
          <div className="anim-hero mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between" style={{ animationDelay: "0.12s" }}>
            <p className="max-w-md text-lg leading-relaxed text-muted">
              In a world chasing the future, we choose to build it.
              <br />
              Built by gamers, for gamers.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#work" className={btnPrimary}>View our work</a>
              <a href="#contact" className={btnOutline}>Contact us</a>
            </div>
          </div>
          </div>
        </section>

        <section id="work" className="border-b border-line py-20 md:py-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className={h2}>What we&apos;re building</h2>

            <article className="panel mt-10 grid gap-10 p-8 md:grid-cols-[1fr_minmax(0,24rem)] md:p-12">
              <div className="flex flex-col">
                <p className="text-sm text-muted">Available now</p>
                <h3 className="mt-2 font-display text-4xl font-bold tracking-tight">MineFriend</h3>
                <p className="mt-4 max-w-md leading-relaxed text-muted">
                  Minecraft matching built around how you play. Find friends and servers that fit your style, right
                  inside Discord.
                </p>
                <Link href="/minefriend" className="btn btn-brand mt-8 w-fit md:mt-auto">
                  Open MineFriend
                </Link>
              </div>
              <div className="slot self-start p-4 pb-5">
                <MatchCard
                  label="Try it: tap a tag"
                  name="Alex"
                  subtitle="Java, evenings, chill"
                  match={87}
                  avatar="brand"
                  tags={[{ text: "Survival", active: true }, { text: "Redstone" }, { text: "Building" }]}
                />
              </div>
            </article>

            <div className="mt-4 flex flex-col gap-2 rounded-md border border-dashed border-line px-8 py-6 sm:flex-row sm:items-center sm:justify-between md:px-12">
              <h3 className="text-lg font-semibold">Next project</h3>
              <p className="text-sm text-muted">In development. More tools that make Minecraft more social.</p>
            </div>
          </div>
        </section>

        <section id="team" className="relative overflow-hidden py-20 md:py-28">
          <AsciiField rgb="242, 245, 247" />
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <h2 data-ascii-quiet className={`w-fit ${h2}`}>The people behind the work</h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {team.map((m) => (
                <li key={m.name} className="rounded-md border border-line bg-surface p-6">
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-bg text-sm font-semibold uppercase"
                  >
                    {m.name.slice(0, 2)}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{m.name}</h3>
                  <p className="text-sm text-muted">{m.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-fg/80">{m.bio}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contact" className="py-20 md:py-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className={h2}>Get in touch</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Questions, partnerships or feedback? Send us a message, or reach the team on Discord.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className={btnPrimary}>Send us a message</Link>
              <a href={siteConfig.discordInvite} className={btnOutline}>Join our Discord</a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter mono />
    </div>
  );
}
