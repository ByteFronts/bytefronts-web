import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";
import { siteConfig } from "@/lib/config";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import AdminNav from "../AdminNav";
import { OwnerStatusForm } from "../AdminForms";

export const metadata: Metadata = { title: `Owners · Admin · ${siteConfig.name}` };

async function List() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: owners } = await supabase
    .from("user_roles")
    .select("user_id, discord_id, discord_username, owner_status")
    .eq("role", "owner")
    .order("updated_at", { ascending: false });

  if (!owners?.length) return <p className="slot px-6 py-10 text-muted">No owners yet.</p>;

  const { data: servers } = await supabase.from("servers").select("owner_id").in("owner_id", owners.map((o) => o.user_id));
  const counts = new Map<string, number>();
  for (const s of servers ?? []) counts.set(s.owner_id, (counts.get(s.owner_id) ?? 0) + 1);

  return (
    <ul className="space-y-3">
      {owners.map((o) => (
        <li key={o.user_id} className="panel flex flex-wrap items-center justify-between gap-4 p-5 pb-6">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold">{o.discord_username ?? o.user_id.slice(0, 8)}</h2>
            <p className="mt-1 text-sm text-muted">
              {o.discord_id ?? "no Discord ID"} · {o.owner_status} · {counts.get(o.user_id) ?? 0} server(s)
            </p>
          </div>
          <OwnerStatusForm userId={o.user_id} status={o.owner_status === "suspended" ? "suspended" : "active"} />
        </li>
      ))}
    </ul>
  );
}

export default function OwnersPage() {
  return (
    <>
      <SiteHeader current="/admin" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-14 md:pt-20">
        <h1 className="mb-8 font-display text-5xl font-bold tracking-tight">Owners</h1>
        <AdminNav current="/admin/owners" />
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <List />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
