"use client";

import Link from "next/link";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20">
        <h1 className="font-display text-5xl font-bold tracking-tight [text-shadow:0.06em_0.06em_0_#7f1d1d]">
          Something broke
        </h1>
        <p className="mt-4 max-w-md text-muted">The page hit an unexpected error. Try loading it again.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => retry()} className="btn btn-brand">
            Try again
          </button>
          <Link href="/" className="btn">
            Back to home
          </Link>
        </div>
      </div>
      <div className="pixel-ground" aria-hidden />
    </main>
  );
}
