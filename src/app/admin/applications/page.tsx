import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";
import { siteConfig } from "@/lib/config";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import AdminNav from "../AdminNav";

export const metadata: Metadata = { title: `Applications · Admin · ${siteConfig.name}` };

async function Pending() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("owner_applications")
    .select("id, server_name, discord_username, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (!data?.length) {
    return <p className="slot px-6 py-10 text-muted">No pending applications.</p>;
  }
  return (
    <ul className="space-y-3">
      {data.map((a) => (
        <li key={a.id} className="panel flex flex-wrap items-center justify-between gap-4 p-5 pb-6">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold">{a.server_name}</h2>
            <p className="mt-1 text-sm text-muted">
              {a.discord_username} · {new Date(a.created_at).toLocaleDateString("en-GB")}
            </p>
          </div>
          <Link href={`/admin/applications/${a.id}`} className="btn">
            Review
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ApplicationsPage() {
  return (
    <>
      <SiteHeader current="/admin" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-14 md:pt-20">
        <h1 className="mb-8 font-display text-5xl font-bold tracking-tight">Applications</h1>
        <AdminNav current="/admin/applications" />
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Pending />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
