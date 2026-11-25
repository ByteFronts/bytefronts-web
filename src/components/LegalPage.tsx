import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

// Same black-and-white theme as the home page.
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
    <div className="mono contents">
      <SiteHeader mono links={[{ href: "/", label: "Back to home" }]} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-16 md:pt-24">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-4 text-sm text-muted">Last updated {updated}</p>
        <div className="mt-12 max-w-2xl space-y-10 leading-relaxed text-fg/80 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-fg [&_ul]:list-[square] [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <SiteFooter mono />
    </div>
  );
}
