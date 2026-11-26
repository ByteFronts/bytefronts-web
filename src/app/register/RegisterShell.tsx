import Link from "next/link";
import Logo from "@/components/Logo";
import PixelScene from "@/components/PixelScene";

const bullets = [
  "Matching runs in our Discord server",
  "Only your Discord name and avatar are used",
  "No passwords to remember",
];

export function Steps({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-5">
      <div className="flex gap-2" aria-hidden>
        {[1, 2].map((n) => (
          <span key={n} className="slot h-2.5 flex-1 p-0.5">
            <span
              className={`block h-full bg-brand transition-all duration-700 ${n <= step ? "w-full" : "w-0"}`}
            />
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Step {step} of 2</p>
    </div>
  );
}

const playerCopy = {
  eyebrow: "MineFriend",
  title: ["Find your squad.", "Play your way."],
  blurb:
    "Create your player profile in under a minute. We match you with friends and servers that fit how you play.",
  bullets,
};

export default function RegisterShell({
  children,
  copy = playerCopy,
  backToMineFriend = false,
}: {
  children: React.ReactNode;
  copy?: typeof playerCopy;
  backToMineFriend?: boolean;
}) {
  return (
    <main className="grid flex-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative flex flex-col overflow-hidden bg-surface">
        <PixelScene startPhase={0.1} />
        <div className="relative px-8 pt-6 md:px-10">
          <Logo />
        </div>
        <div className="relative flex-1 px-8 pb-24 pt-12 md:px-10 md:pb-28 md:pt-16">
          <p className="text-sm font-medium text-brand">{copy.eyebrow}</p>
          <h1 className="anim-hero mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0.06em_0.06em_0_var(--brand-deep)] sm:text-5xl">
            {copy.title[0]}
            <br />
            {copy.title[1]}
          </h1>
          <p className="mt-5 max-w-sm text-muted">{copy.blurb}</p>
          <ul className="mt-8 space-y-3 text-sm text-fg/80">
            {copy.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span aria-hidden className="h-2 w-2 shrink-0 bg-brand" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="pixel-ground" aria-hidden />
      </aside>

      <section className="flex items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-md">
          {backToMineFriend && (
            <Link href="/minefriend" className="btn mb-4 w-fit text-sm">
              ← Back to MineFriend
            </Link>
          )}
          {children}
        </div>
      </section>
    </main>
  );
}
