import Link from "next/link";
import PixelScene from "@/components/PixelScene";
import { SiteHeader } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex flex-1 flex-col">
        <PixelScene />
        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20">
          <p className="font-display text-[clamp(5rem,18vw,11rem)] font-bold leading-none tracking-[-0.04em] [text-shadow:0.05em_0.05em_0_var(--brand-deep)]">
            404
          </p>
          <h1 className="mt-6 font-display text-3xl font-bold">This chunk hasn&apos;t loaded</h1>
          <p className="mt-3 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
          <Link href="/" className="btn btn-brand mt-8 w-fit">
            Back to home
          </Link>
        </div>
        <div className="pixel-ground" aria-hidden />
      </main>
    </>
  );
}
