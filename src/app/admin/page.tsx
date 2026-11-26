import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";
import { siteConfig } from "@/lib/config";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import AdminNav from "./AdminNav";

export const metadata: Metadata = { title: `Admin · ${siteConfig.name}` };

async function Overview() {
  await requireAdmin();
  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;
  const [apps, flagged, failed] = await Promise.all([
    supabase.from("owner_applications").select("id", head).eq("status", "pending"),
    supabase.from("audit_log").select("id", head).eq("is_flagged", true).eq("reviewed", false),
    supabase.from("audit_log").select("id", head).eq("action", "announce_failed").eq("reviewed", false),
  ]);
  const stats = [
    { label: "Pending applications", n: apps.count },
    { label: "Unreviewed flagged changes", n: flagged.count },
    { label: "Unreviewed announce failures", n: failed.count },
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <li key={s.label} className="panel p-5 pb-6">
          <p className="font-display text-4xl font-bold tabular-nums">{s.n ?? "–"}</p>
          <p className="mt-2 text-sm text-muted">{s.label}</p>
        </li>
      ))}
    </ul>
  );
}

export default function AdminPage() {
  return (
    <>
      <SiteHeader current="/admin" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-14 md:pt-20">
        <h1 className="mb-8 font-display text-5xl font-bold tracking-tight">Admin</h1>
        <AdminNav current="/admin" />
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Overview />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
