import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";
import { siteConfig } from "@/lib/config";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import AdminNav from "../AdminNav";
import { AuditForm } from "../AdminForms";

export const metadata: Metadata = { title: `Audit · Admin · ${siteConfig.name}` };

async function Log() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("audit_log")
    .select("id, server_name, actor_id, action, field, old_value, new_value, is_flagged, reviewed, created_at")
    .order("reviewed", { ascending: true })
    .order("is_flagged", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (!rows?.length) return <p className="slot px-6 py-10 text-muted">No audit entries.</p>;

  // owner_suspend / owner_reinstate rows carry the target user id in new_value.
  const isOwnerRow = (a: string) => a === "owner_suspend" || a === "owner_reinstate";
  const ids = [
    ...new Set(
      rows
        .flatMap((r) => [r.actor_id, isOwnerRow(r.action) ? r.new_value : null])
        .filter((x): x is string => !!x),
    ),
  ];
  const { data: roles } = ids.length
    ? await supabase.from("user_roles").select("user_id, discord_username").in("user_id", ids)
    : { data: [] };
  const names = new Map((roles ?? []).map((r) => [r.user_id, r.discord_username]));

  return (
    <AuditForm>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className={`panel flex gap-4 p-5 ${r.is_flagged ? "ring-2 ring-amber-400/60" : ""}`}>
            {!r.reviewed ? (
              <input type="checkbox" name="ids" value={r.id} aria-label="Select for review" className="mt-1" />
            ) : (
              <span className="w-4" aria-hidden />
            )}
            <div className="min-w-0 text-sm">
              <p className="font-bold">
                {r.action}
                {r.is_flagged && <span className="chip ml-2 px-2 py-0.5 text-xs">Flagged</span>}
                {r.reviewed && <span className="ml-2 font-normal text-muted">reviewed</span>}
              </p>
              <p className="text-muted">
                {new Date(r.created_at).toLocaleString("en-GB")} · {r.server_name ?? "–"} ·{" "}
                {r.actor_id ? (names.get(r.actor_id) ?? r.actor_id.slice(0, 8)) : "system"}
              </p>
              {isOwnerRow(r.action) && r.new_value ? (
                <p className="mt-1 break-words">Owner: {names.get(r.new_value) ?? r.new_value.slice(0, 8)}</p>
              ) : r.field && (
                <p className="mt-1 break-words">
                  {r.field}: {r.old_value ?? "–"} → {r.new_value ?? "–"}
                </p>
              )}
              {!r.field && r.new_value && <p className="mt-1 break-words">{r.new_value}</p>}
            </div>
          </li>
        ))}
      </ul>
    </AuditForm>
  );
}

export default function AuditPage() {
  return (
    <>
      <SiteHeader current="/admin" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-14 md:pt-20">
        <h1 className="mb-8 font-display text-5xl font-bold tracking-tight">Audit</h1>
        <AdminNav current="/admin/audit" />
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Log />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
