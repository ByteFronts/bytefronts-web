import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/config";
import { getViewer } from "@/lib/roles";
import type { ServerInput } from "@/lib/servers";
import RegisterShell from "@/app/register/RegisterShell";
import { createServer } from "../../actions";
import ServerForm from "../ServerForm";

export const metadata: Metadata = { title: `Add server · ${siteConfig.name}` };

const copy = {
  eyebrow: "Servers",
  title: ["Get your server", "found."],
  blurb: "Add your Minecraft server. It's listed for players as soon as you save it.",
  bullets: ["Listed right away", "Edit or remove it any time", "Free to list"],
};

async function NewServerContent() {
  const viewer = await getViewer();
  if (viewer?.role !== "owner" || viewer.ownerStatus !== "active") redirect("/dashboard");

  const supabase = await createClient();
  const { count } = await supabase
    .from("servers")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", viewer.user.id);

  // First server only: prefill from the approved application.
  let initial: Partial<ServerInput> = {};
  if (count === 0) {
    const { data: app } = await supabase
      .from("owner_applications")
      .select("server_name, server_address, edition, play_styles, discord_link, server_about")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (app) {
      initial = {
        name: app.server_name,
        address: app.server_address,
        edition: app.edition,
        play_styles: app.play_styles,
        discord_invite: app.discord_link,
        description: (app.server_about ?? "").slice(0, 200),
      };
    }
  }

  return <ServerForm action={createServer} initial={initial} submitLabel="Add server" />;
}

export default function NewServerPage() {
  return (
    <RegisterShell copy={copy}>
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <NewServerContent />
      </Suspense>
    </RegisterShell>
  );
}
