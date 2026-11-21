import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: `Terms · ${siteConfig.name}` };

export default function Terms() {
  return (
    <LegalPage title="Terms" updated="November 2026">
      <p>By using MineFriend you agree to these terms.</p>
      <section>
        <h2>Using the service</h2>
        <ul>
          <li>Give honest information and keep your profile up to date.</li>
          <li>Be respectful to other players. Harassment, hate and cheating are not allowed.</li>
          <li>Follow Discord&apos;s Terms of Service and the rules of our Discord server.</li>
        </ul>
      </section>
      <section>
        <h2>Matching</h2>
        <p>
          Matches are suggestions, not guarantees. We can&apos;t promise you will find a match, and we are not
          responsible for what other players or third-party servers do.
        </p>
      </section>
      <section>
        <h2>Accounts</h2>
        <p>We may remove profiles that break these terms. You can delete yours at any time from your profile settings.</p>
      </section>
      <section>
        <h2>Not affiliated</h2>
        <p>{siteConfig.name} is not affiliated with Mojang, Microsoft or Discord. Minecraft is a trademark of Mojang AB.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We may update these terms. Continuing to use MineFriend after a change means you accept it.</p>
      </section>
    </LegalPage>
  );
}
