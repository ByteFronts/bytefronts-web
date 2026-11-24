import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteConfig, EDITIONS, PLAY_STYLES } from "@/lib/config";
import { getServerStatus } from "@/lib/server-status";
import CopyAddress from "@/components/CopyAddress";

export const metadata: Metadata = { title: `Servers · ${siteConfig.name}` };

const label = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

type Row = {
  id: string;
  name: string;
  address: string;
  edition: string;
  description: string | null;
  play_styles: string[];
  discord_invite: string | null;
};

async function ServerItem({ s }: { s: Row }) {
  const status = await getServerStatus(s.address);
  return (
    <li className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{s.name}</h2>
        {status ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status.online ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
            }`}
          >
            {status.online ? `${status.playersOnline}/${status.playersMax} online` : "Offline"}
          </span>
        ) : (
          <span className="rounded-full bg-line px-3 py-1 text-xs text-muted">Status unavailable</span>
        )}
      </div>
      {s.description && <p className="mt-2 text-sm text-muted">{s.description}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CopyAddress address={s.address} />
        <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">{label(EDITIONS, s.edition)}</span>
        {s.play_styles.map((p) => (
          <span key={p} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
            {label(PLAY_STYLES, p)}
          </span>
        ))}
        {s.discord_invite && (
          <a href={s.discord_invite} className="text-xs text-brand hover:underline" rel="noopener noreferrer">
            Discord
          </a>
        )}
      </div>
    </li>
  );
}

async function ServerList() {
  let servers: Row[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("servers")
      .select("id, name, address, edition, description, play_styles, discord_invite")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);
    servers = data ?? [];
  }

  if (servers.length === 0) {
    return <p className="mt-10 text-muted">No servers listed yet. Be the first to register yours.</p>;
  }
  return (
    <ul className="mt-8 space-y-4">
      {servers.map((s) => (
        <ServerItem key={s.id} s={s} />
      ))}
    </ul>
  );
}

export default function ServersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold tracking-tight">Servers</h1>
        <Link
          href="/servers/register"
          className="btn-shine rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"
        >
          Register your server
        </Link>
      </div>
      <Suspense fallback={<p className="mt-10 text-muted">Loading…</p>}>
        <ServerList />
      </Suspense>
    </main>
  );
}
