import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";
import { siteConfig } from "@/lib/config";
import { isDiscordInvite } from "@/lib/servers";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import AdminNav from "../../AdminNav";
import { ApproveForm, RejectForm } from "./ReviewForms";

export const metadata: Metadata = { title: `Application · Admin · ${siteConfig.name}` };

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  // A malformed id makes Postgres error on the uuid cast; both cases are a 404.
  const { data: a } = await supabase.from("owner_applications").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Server name", a.server_name],
    ["Address", a.server_address],
    ["Edition", a.edition],
    ["About", a.server_about],
    ["Play styles", [...a.play_styles, a.play_styles_other].filter(Boolean).join(", ")],
    ["Player base", a.player_base_size],
    ["Community size", a.community_size],
    ["Running since", a.running_since],
    [
      "Discord invite",
      isDiscordInvite(a.discord_link) ? (
        <a href={a.discord_link} rel="noopener noreferrer" className="underline underline-offset-4">
          {a.discord_link}
        </a>
      ) : (
        "Not a valid Discord invite"
      ),
    ],
    ["Why join", a.why_join],
    ["Applicant", `${a.discord_username} (${a.discord_id})`],
    ["Submitted", new Date(a.created_at).toLocaleString("en-GB")],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <dl className="panel space-y-4 p-6 pb-7">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-medium text-muted">{k}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      <aside className="panel h-fit space-y-6 p-6 pb-7">
        {a.status === "pending" ? (
          <>
            <ApproveForm id={a.id} />
            <RejectForm id={a.id} />
          </>
        ) : (
          <div>
            <p className="font-display text-lg font-bold capitalize">{a.status}</p>
            {a.reject_reason && <p className="mt-2 text-sm text-muted">Reason: {a.reject_reason}</p>}
            {a.reviewed_at && (
              <p className="mt-2 text-xs text-muted">{new Date(a.reviewed_at).toLocaleString("en-GB")}</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

export default function ApplicationPage(props: PageProps<"/admin/applications/[id]">) {
  return (
    <>
      <SiteHeader current="/admin" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-14 md:pt-20">
        <h1 className="mb-8 font-display text-5xl font-bold tracking-tight">Application</h1>
        <AdminNav current="/admin/applications" />
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Detail params={props.params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
