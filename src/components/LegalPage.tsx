import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { siteConfig } from "@/lib/config";

// Same black-and-white theme as the home page.
const monochrome = { "--brand": "#f2f5f7", "--brand-ink": "#0b0f14" } as CSSProperties;

const logo = (className: string) => (
  <Image src="/bytefronts-logo.svg" alt={siteConfig.name} width={996} height={225} className={`w-auto invert ${className}`} />
);

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mono contents" style={monochrome}>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label={siteConfig.name}>
            {logo("h-7")}
          </Link>
          <Link href="/" className="nav-link text-sm text-fg/80 hover:text-fg">
            Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-16">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 text-xs text-muted">Last updated {updated}</p>
        <div className="mt-10 space-y-8 border-t border-line pt-10 text-sm leading-relaxed text-fg/80 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-fg [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {logo("h-4 opacity-70")}
            <span>© 2026 {siteConfig.name}</span>
          </div>
          <span>
            <Link href="/privacy" className="hover:text-fg">Privacy</Link> · <Link href="/terms" className="hover:text-fg">Terms</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
