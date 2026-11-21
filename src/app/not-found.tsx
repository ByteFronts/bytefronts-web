import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Logo />
      <p className="mt-12 font-display text-7xl font-bold text-brand">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">This chunk hasn&apos;t loaded</h1>
      <p className="mt-3 text-muted">The page you are looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="btn-shine mt-8 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink">
        Back to home
      </Link>
    </main>
  );
}
