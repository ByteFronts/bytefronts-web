import Link from "next/link";
import Logo from "@/components/Logo";

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
    <>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <Logo />
        <Link href="/" className="nav-link text-sm text-fg/80 hover:text-fg">
          Back to home
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-8">
        <h1 className="font-display text-4xl font-bold">{title}</h1>
        <p className="mt-2 text-xs text-muted">Last updated {updated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-fg/80 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </>
  );
}
