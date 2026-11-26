import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MAX_SERVERS_PER_OWNER, siteConfig } from "@/lib/config";
import { getViewer } from "@/lib/roles";
import RegisterShell from "@/app/register/RegisterShell";
import { signInWithDiscord } from "@/app/register/actions";
import DeleteServerButton from "./DeleteServerButton";

export const metadata: Metadata = { title: `Dashboard · ${siteConfig.name}` };

const card = "panel p-6 pb-7";

const dashboardCopy = {
  eyebrow: "Servers",
  title: ["Get your server", "found."],
  blurb: "Apply to list your Minecraft server. Once you're approved, you can add and manage it here.",
  bullets: ["Log in with Discord, no passwords", "We review every application", "Free to list"],
};

async function DashboardContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <p className="notch bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
        Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your
        Supabase URL and key.
      </p>
    );
  }

  const viewer = await getViewer();

  if (!viewer) {
    return (
      <>
        {error && (
          <p className="notch mb-4 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            Discord login didn&apos;t complete. Please try again.
          </p>
        )}
        <div className={card}>
          <h2 className="font-display text-2xl font-bold">Server dashboard</h2>
          <p className="mt-3 text-sm text-muted">Log in with Discord to apply or manage your servers.</p>
          <form action={signInWithDiscord} className="mt-6">
            <input type="hidden" name="next" value="/dashboard" />
            <button type="submit" className="btn btn-discord w-full">
              Continue with Discord
            </button>
          </form>
        </div>
      </>
    );
  }

  const supabase = await createClient();

  if (viewer.role === "admin") {
    return (
      <div className={card}>
        <h2 className="font-display text-2xl font-bold">Server dashboard</h2>
        <p className="mt-3 text-sm text-muted">You&apos;re an admin. Review applications and servers from the admin area.</p>
        <Link href="/admin" className="btn mt-6 w-full">
          Admin
        </Link>
      </div>
    );
  }

  if (viewer.role === "owner") {
    const suspended = viewer.ownerStatus === "suspended";
    const { data } = await supabase
      .from("servers")
      .select("id, name, address, is_hidden, hidden_reason")
      .eq("owner_id", viewer.user.id)
      .order("created_at", { ascending: true });
    const servers = data ?? [];
    const atCap = servers.length >= MAX_SERVERS_PER_OWNER;

    return (
      <div className={card}>
        <h2 className="font-display text-2xl font-bold">Your servers</h2>
        {suspended && (
          <p className="notch mt-4 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            Your owner account is suspended. Your servers are hidden and can&apos;t be changed.
          </p>
        )}
        {servers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">You haven&apos;t listed a server yet.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {servers.map((s) => (
              <li key={s.id} className="slot flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted">{s.address}</p>
                  {s.is_hidden && (
                    <p className="mt-1 text-xs text-amber-200">Hidden by admin: {s.hidden_reason}</p>
                  )}
                </div>
                {!suspended && (
                  <>
                    <Link href={`/dashboard/servers/${s.id}/edit`} className="text-sm text-brand hover:underline">
                      Edit
                    </Link>
                    {s.is_hidden ? (
                      <p className="text-xs text-muted">Hidden by admin — contact us on Discord to resolve it.</p>
                    ) : (
                      <DeleteServerButton id={s.id} />
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {!suspended &&
          (atCap ? (
            <>
              <button type="button" disabled className="btn btn-brand mt-6 w-full">
                Add server
              </button>
              <p className="mt-2 text-center text-xs text-muted">You can list up to {MAX_SERVERS_PER_OWNER} servers.</p>
            </>
          ) : (
            <Link href="/dashboard/servers/new" className="btn btn-brand mt-6 w-full">
              Add server
            </Link>
          ))}
      </div>
    );
  }

  const { data: application } = await supabase
    .from("owner_applications")
    .select("status, reject_reason")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (application?.status === "pending") {
    return (
      <div className={card}>
        <h2 className="font-display text-2xl font-bold">Your application is waiting for review</h2>
        <p className="mt-3 text-sm text-muted">We&apos;ll let you know here once it&apos;s been looked at.</p>
      </div>
    );
  }

  if (application?.status === "rejected") {
    return (
      <div className={card}>
        <h2 className="font-display text-2xl font-bold">Application not approved</h2>
        {application.reject_reason && (
          <p className="mt-3 text-sm text-muted">
            <span className="font-medium text-fg">Reason:</span> {application.reject_reason}
          </p>
        )}
        <Link href="/dashboard/apply" className="btn btn-brand mt-6 w-full">
          Apply again
        </Link>
      </div>
    );
  }

  return (
    <div className={card}>
      <h2 className="font-display text-2xl font-bold">Run a server?</h2>
      <p className="mt-3 text-sm text-muted">Apply to list your server and manage it from here.</p>
      <Link href="/dashboard/apply" className="btn btn-brand mt-6 w-full">
        Become a server owner
      </Link>
    </div>
  );
}

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <RegisterShell copy={dashboardCopy}>
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <DashboardContent searchParams={props.searchParams} />
      </Suspense>
    </RegisterShell>
  );
}
