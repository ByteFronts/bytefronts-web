import Link from "next/link";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import { siteConfig } from "@/lib/config";

// Header for signed-in pages. "Matches" opens the Discord server, where matching happens.
export default function AppHeader({
  name,
  avatarUrl,
  active,
}: {
  name: string;
  avatarUrl: string | null;
  active: "profile";
}) {
  const link = (on: boolean) => `text-sm transition ${on ? "text-brand" : "text-fg/70 hover:text-fg"}`;
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-5 md:px-16">
        <Logo />
        <nav className="hidden items-center gap-10 md:flex">
          <Link href="/" className={link(false)}>
            Home
          </Link>
          <a href={siteConfig.discordInvite} className={link(false)}>
            Matches
          </a>
          <Link href="/profile" className={link(active === "profile")}>
            Profile
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Avatar source="discord" discordUrl={avatarUrl} size={36} />
          <span className="hidden max-w-[10rem] truncate sm:inline">{name}</span>
        </div>
      </div>
    </header>
  );
}
