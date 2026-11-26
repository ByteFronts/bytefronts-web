import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";
import { siteConfig } from "@/lib/config";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import AdminNav from "../AdminNav";
import { HideForm, UnhideForm } from "../AdminForms";

export const metadata: Metadata = { title: `Servers · Admin · ${siteConfig.name}` };

async function List({ searchParams }: { searchParams: PageProps<"/admin/servers">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  // PostgREST or() breaks on , ( ) " \ ; ilike treats % and _ as wildcards.
  const q = (raw ?? "").trim().slice(0, 64).replace(/[,()"\\]/g, " ").replace(/[%_]/g, "\\$&");

  const supabase = await createClient();
  let query = supabase
    .from("servers")
    .select("id, owner_id, name, address, is_hidden, hidden_reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
  const { data: servers } = await query;

  const ownerIds = [...new Set((servers ?? []).map((s) => s.owner_id))];
  const { data: roles } = ownerIds.length
    ? await supabase.from("user_roles").select("user_id, discord_username, owner_status").in("user_id", ownerIds)
    : { data: [] };
  const names = new Map((roles ?? []).map((r) => [r.user_id, r.discord_username]));
  const suspended = new Set((roles ?? []).filter((r) => r.owner_status === "suspended").map((r) => r.user_id));

  return (
    <>
      <form className="mb-6 flex gap-2" role="search">
        <input name="q" defaultValue={raw?.slice(0, 64) ?? ""} maxLength={64} placeholder="Filter by name or address" aria-label="Filter servers" className="w-full max-w-sm rounded-lg border border-white/10 bg-transparent px-3 py-2" />
        <button type="submit" className="btn">Filter</button>
      </form>
      {!servers?.length ? (
        <p className="slot px-6 py-10 text-muted">No servers found.</p>
      ) : (
        <ul className="space-y-3">
          {servers.map((s) => (
            <li key={s.id} className="panel space-y-3 p-5 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="truncate font-display text-lg font-bold">{s.name}</h2>
                <div className="flex gap-2">
                  {suspended.has(s.owner_id) && <span className="chip px-3 py-1 text-xs">Owner suspended</span>}
                  {s.is_hidden && <span className="chip px-3 py-1 text-xs">Hidden</span>}
                </div>
              </div>
              <p className="text-sm text-muted">
                {s.address} · {names.get(s.owner_id) ?? s.owner_id.slice(0, 8)}
              </p>
              {s.is_hidden && <p className="text-sm">Reason: {s.hidden_reason}</p>}
              {s.is_hidden ? <UnhideForm id={s.id} /> : <HideForm id={s.id} />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function ServersPage(props: PageProps<"/admin/servers">) {
  return (
    <>
      <SiteHeader current="/admin" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-14 md:pt-20">
        <h1 className="mb-8 font-display text-5xl font-bold tracking-tight">Servers</h1>
        <AdminNav current="/admin/servers" />
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <List searchParams={props.searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
