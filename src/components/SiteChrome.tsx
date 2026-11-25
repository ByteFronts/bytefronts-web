import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import Logo from "@/components/Logo";
import { siteConfig } from "@/lib/config";

type NavLink = { href: string; label: string };

// Links for the MineFriend side of the site.
export const appLinks: NavLink[] = [
  { href: "/minefriend", label: "MineFriend" },
  { href: "/servers", label: "Servers" },
  { href: siteConfig.discordInvite, label: "Discord" },
];

function NavA({ href, label, current }: NavLink & { current?: string }) {
  const cls = "nav-link whitespace-nowrap text-fg/75 hover:text-fg aria-[current=page]:text-fg";
  // Plain <a> for in-page anchors and external links, <Link> for routes.
  return href.startsWith("/") ? (
    <Link href={href} className={cls} aria-current={current === href ? "page" : undefined}>
      {label}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {label}
    </a>
  );
}

export function SiteHeader({
  mono = false,
  links = appLinks,
  current,
  auth = !mono,
}: {
  mono?: boolean;
  links?: NavLink[];
  current?: string;
  auth?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4">
        <Logo mono={mono} />
        <nav
          aria-label="Main"
          className="order-last -mx-6 flex w-[calc(100%+3rem)] gap-6 overflow-x-auto px-6 pb-2 text-sm md:order-none md:mx-0 md:ml-auto md:w-auto md:overflow-visible md:p-0"
        >
          {links.map((l) => (
            <NavA key={l.href} {...l} current={current} />
          ))}
        </nav>
        {auth && <HeaderAuth />}
      </div>
    </header>
  );
}

export function SiteFooter({ mono = false }: { mono?: boolean }) {
  return (
    <footer className={`mt-auto ${mono ? "border-t border-line" : ""}`}>
      {!mono && <div className="pixel-ground" aria-hidden />}
      <div className={mono ? "" : "bg-card"}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Logo mono={mono} className="opacity-80 [&_img]:h-4 sm:[&_img]:h-5" />
            <span className="text-xs">© 2026 {siteConfig.name}</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <Link href="/minefriend" className="hover:text-fg">MineFriend</Link>
            <Link href="/servers" className="hover:text-fg">Servers</Link>
            <a href={siteConfig.discordInvite} className="hover:text-fg">Discord</a>
            <Link href="/privacy" className="hover:text-fg">Privacy</Link>
            <Link href="/terms" className="hover:text-fg">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
