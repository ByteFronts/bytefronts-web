import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

// mono: the ByteFronts wordmark (black-and-white pages). Otherwise the green block mark.
export default function Logo({ mono = false, className = "" }: { mono?: boolean; className?: string }) {
  if (mono) {
    return (
      <Link href="/" aria-label={siteConfig.name} className={className}>
        <Image src="/bytefronts-logo.svg" alt="" width={996} height={225} loading="eager" className="h-6 w-auto invert sm:h-7" />
      </Link>
    );
  }
  return (
    <Link href="/" className={`flex items-center gap-3 font-display text-lg font-bold text-fg ${className}`}>
      <span aria-hidden className="notch relative h-7 w-7 bg-brand shadow-[inset_0_-7px_0_var(--brand-deep)]" />
      {siteConfig.name}
    </Link>
  );
}
