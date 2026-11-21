import Link from "next/link";
import { siteConfig } from "@/lib/config";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 font-display text-xl font-bold text-fg">
      <span aria-hidden className="h-8 w-8 rounded-lg bg-brand" />
      {siteConfig.name}
    </Link>
  );
}
