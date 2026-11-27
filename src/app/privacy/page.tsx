import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: `Privacy · ${siteConfig.name}` };

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="November 2026">
      <p>
        {siteConfig.name} runs MineFriend, a service that matches Minecraft players with friends and servers. This page
        explains what we collect and why.
      </p>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Your Discord username, Discord ID and avatar, when you log in with Discord.</li>
          <li>
            The profile you fill in: Minecraft name, edition, play style, play times, vibe, what you are looking for, and
            your privacy choices.
          </li>
          <li>Your name, email address and message, if you use our contact form. We use these only to reply to you.</li>
        </ul>
        <p className="mt-2">We never see your Discord password.</p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          To match you with other players and servers, and to connect you with them through our Discord server. We do
          not sell your data or use it for advertising.
        </p>
      </section>
      <section>
        <h2>Who can see it</h2>
        <p>
          Matching staff and the matching system can see your profile. What other members see follows the privacy
          switches in your profile settings.
        </p>
      </section>
      <section>
        <h2>Where it is stored</h2>
        <p>Your data is stored with our database provider, Supabase, and your profile picture may be loaded from Discord or mc-heads.net.</p>
      </section>
      <section>
        <h2>Your control</h2>
        <p>
          You can edit your profile at any time, and delete your registration from the Account section of your profile
          settings. Deleting removes your profile from our database.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions? Reach us on <a className="text-brand underline" href={siteConfig.discordInvite}>our Discord</a>.
        </p>
      </section>
    </LegalPage>
  );
}
