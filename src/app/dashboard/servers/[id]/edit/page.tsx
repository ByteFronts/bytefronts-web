import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/config";
import { getViewer } from "@/lib/roles";
import RegisterShell from "@/app/register/RegisterShell";
import { updateServer } from "../../../actions";
import ServerForm from "../../ServerForm";

export const metadata: Metadata = { title: `Edit server · ${siteConfig.name}` };

const copy = {
  eyebrow: "Servers",
  title: ["Keep your server", "up to date."],
  blurb: "Changes go live as soon as you save them.",
  bullets: ["Saved right away", "Every change is logged", "Free to list"],
};

async function EditServerContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (viewer?.role !== "owner") redirect("/dashboard");

  const supabase = await createClient();
  const { data: server } = await supabase
    .from("servers")
    .select("id, name, address, edition, description, play_styles, discord_invite")
    .eq("id", id)
    .eq("owner_id", viewer.user.id)
    .maybeSingle();
  if (!server) notFound();

  if (viewer.ownerStatus === "suspended") {
    return (
      <div className="panel p-6 pb-7">
        <h2 className="font-display text-2xl font-bold">{server.name}</h2>
        <p className="notch mt-4 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          Your owner account is suspended. Your servers are hidden and can&apos;t be changed.
        </p>
        <Link href="/dashboard" className="btn mt-6 w-full">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <ServerForm action={updateServer} initial={server} submitLabel="Save changes" />;
}

export default function EditServerPage(props: PageProps<"/dashboard/servers/[id]/edit">) {
  return (
    <RegisterShell copy={copy}>
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <EditServerContent params={props.params} />
      </Suspense>
    </RegisterShell>
  );
}
