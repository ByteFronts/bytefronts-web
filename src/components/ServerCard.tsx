import { siteConfig, isPlaceholderServer } from "@/lib/config";
import { getServerStatus } from "@/lib/server-status";
import CopyAddress from "./CopyAddress";

export default async function ServerCard() {
  const status = isPlaceholderServer ? null : await getServerStatus(siteConfig.serverAddress);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{siteConfig.serverName}</h2>
        {status ? (
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              status.online ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${status.online ? "bg-emerald-400" : "bg-red-400"}`} />
            {status.online ? "Online" : "Offline"}
          </span>
        ) : (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">Status unavailable</span>
        )}
      </div>

      {status?.motd && <p className="mt-2 text-sm text-white/60">{status.motd}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CopyAddress address={siteConfig.serverAddress} />
        {status?.online && (
          <span className="text-sm text-white/60">
            {status.playersOnline}/{status.playersMax} players
            {status.version ? ` · ${status.version}` : ""}
          </span>
        )}
      </div>

      {isPlaceholderServer && (
        <p className="mt-3 text-xs text-amber-300/80">
          Placeholder address. Set NEXT_PUBLIC_SERVER_ADDRESS to show live status.
        </p>
      )}
    </div>
  );
}
