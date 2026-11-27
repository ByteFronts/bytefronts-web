import type { Metadata } from "next";
import CopyEmail from "@/components/CopyEmail";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CONTACT_EMAIL } from "@/lib/contact";
import { siteConfig } from "@/lib/config";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: `Contact · ${siteConfig.name}` };

const btnOutline = "rounded-md border border-fg/40 px-5 py-2.5 text-sm font-semibold transition hover:border-fg hover:bg-fg/5";

// Same black-and-white theme as the home page.
export default function ContactPage() {
  return (
    <div className="mono contents">
      <SiteHeader mono links={[{ href: "/", label: "Back to home" }]} />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-12 px-6 pb-24 pt-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:pt-24">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Get in touch</h1>
          <p className="mt-5 max-w-sm leading-relaxed text-muted">
            Questions, partnerships or feedback? Send us a message and we&apos;ll reply by email.
          </p>
          <p className="mt-10 text-sm text-muted">Prefer another way?</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <CopyEmail email={CONTACT_EMAIL} className={btnOutline} />
            <a href={siteConfig.discordInvite} className={btnOutline}>
              Join our Discord
            </a>
          </div>
        </div>
        <ContactForm />
      </main>
      <SiteFooter mono />
    </div>
  );
}
