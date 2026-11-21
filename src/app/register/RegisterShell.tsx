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
          <span key={n} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <span
              className={`block h-full rounded-full bg-brand transition-all duration-700 ${n <= step ? "w-full" : "w-0"}`}
            />
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">Step {step} of 2</p>
    </div>
  );
}

export default function RegisterShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid flex-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative flex flex-col overflow-hidden bg-surface">
        <PixelScene startPhase={0.1} />
        <div className="relative px-8 pt-6 md:px-10">
          <Logo />
        </div>
        <div className="relative flex-1 px-8 pb-24 pt-12 md:px-10 md:pb-28 md:pt-16">
          <p className="text-[11px] font-medium uppercase tracking-widest text-brand">MineFriend</p>
          <h1 className="anim-hero mt-4 font-display [text-shadow:0_2px_14px_var(--surface)] text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Find your squad.
            <br />
            Play your way.
          </h1>
          <p className="mt-5 max-w-sm text-muted">
            Create your player profile in under a minute. We match you with friends and servers that fit how you
            play.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="pixel-ground" aria-hidden />
      </aside>

      <section className="flex items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
