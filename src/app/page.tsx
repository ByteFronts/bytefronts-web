import Link from "next/link";
import { Suspense } from "react";
import ServerCard from "@/components/ServerCard";
import { siteConfig } from "@/lib/config";

const steps = [
  { title: "Register", body: "Log in with Discord and tell us your play style, edition, timezone and language." },
  { title: "Join our Discord", body: "Hop into the server. Matching and chat happen there, not on this site." },
  { title: "Meet your crew", body: "We match you with players who fit how and when you play. Then jump on the server together." },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-lg font-bold tracking-tight text-white">
          {siteConfig.name}
          <span className="text-emerald-400">.</span>
        </span>
        <Link
          href="/register"
          className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
        >
          Register
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5">
        <section className="py-16 text-center sm:py-24">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Never play Minecraft <span className="text-emerald-400">alone</span> again.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
            {siteConfig.tagline} Tell us how you play, and we&apos;ll connect you with players who match, right
            inside our Discord server.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-black hover:bg-emerald-300"
            >
              Find my crew
            </Link>
            <a
              href={siteConfig.discordInvite}
              className="rounded-lg border border-white/15 px-6 py-3 font-semibold text-white hover:border-white/40"
            >
              Join the Discord
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-xl pb-16">
          <Suspense
            fallback={<div className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5" />}
          >
            <ServerCard />
          </Suspense>
        </section>

        <section className="pb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="text-sm font-mono text-emerald-400">0{i + 1}</span>
                <h3 className="mt-2 font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-white/60">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-16 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 text-sm text-white/70">
          <h2 className="mb-1 font-semibold text-emerald-300">Safe by design</h2>
          You must be 13 or older. We ask for an age range so younger players can be matched with similar ages,
          and you can delete your registration any time.
        </section>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {siteConfig.name}. Not affiliated with Mojang or Microsoft.
      </footer>
    </>
  );
}
