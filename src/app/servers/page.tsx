import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteConfig, EDITIONS, PLAY_STYLES } from "@/lib/config";
import { getServerStatus } from "@/lib/server-status";
import CopyAddress from "@/components/CopyAddress";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { isDiscordInvite } from "@/lib/servers";

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
  const light = !status ? "bg-line" : status.online ? "bg-brand" : "bg-red-400";
  return (
    <li id={s.id} className="panel scroll-mt-24 grid gap-x-6 gap-y-4 p-5 pb-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span aria-hidden className={`notch hidden h-12 w-12 sm:block ${light}`} />
      <div className="min-w-0">
        <h2 className="truncate font-display text-lg font-bold">{s.name}</h2>
        {s.description && <p className="mt-1 text-sm text-muted">{s.description}</p>}
        <ul className="mt-3 flex flex-wrap gap-2">
          <li className="chip">{label(EDITIONS, s.edition)}</li>
          {s.play_styles.map((p) => (
            <li key={p} className="chip">{label(PLAY_STYLES, p)}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
        <p className="text-sm tabular-nums">
          {status ? (
            status.online ? (
              <>
                <span className="font-display text-lg font-bold text-brand">{status.playersOnline}</span>
                <span className="text-muted"> / {status.playersMax} online</span>
              </>
            ) : (
              <span className="text-red-300">Offline</span>
            )
          ) : (
            <span className="text-muted">Status unavailable</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          {s.discord_invite && isDiscordInvite(s.discord_invite) && (
            <a href={s.discord_invite} className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline" rel="noopener noreferrer">
              Discord
            </a>
          )}
          <CopyAddress address={s.address} />
        </div>
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
      .order("created_at", { ascending: false })
      .limit(50);
    servers = data ?? [];
  }

  if (servers.length === 0) {
    return (
      <div className="slot px-6 py-10">
        <p className="font-display text-lg font-semibold">No servers listed yet</p>
        <p className="mt-1 text-sm text-muted">Server owners can list theirs from the dashboard.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {servers.map((s) => (
        <ServerItem key={s.id} s={s} />
      ))}
    </ul>
  );
}

export default function ServersPage() {
  return (
    <>
      <SiteHeader current="/servers" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-14 md:pt-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight [text-shadow:0.06em_0.06em_0_var(--brand-deep)]">
              Servers
            </h1>
            <p className="mt-4 max-w-md text-muted">
              Community Minecraft servers from approved owners. Click an address to copy it.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-brand">
            List your server
          </Link>
        </div>
        <Suspense fallback={<p className="slot px-6 py-10 text-muted">Loading servers…</p>}>
          <ServerList />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
