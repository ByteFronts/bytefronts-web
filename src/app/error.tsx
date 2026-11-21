"use client";

import Link from "next/link";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted">An unexpected error happened. Please try again.</p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="btn-shine rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold">
          Home
        </Link>
      </div>
    </main>
  );
}
