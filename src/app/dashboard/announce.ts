import { createClient } from "@/lib/supabase/server";
import { buildAnnouncement, postAnnouncement } from "@/lib/discord";

// Runs inside after(): posts a new server to Discord once per address. Never throws.
export async function announceServer(serverId: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_SERVER_WEBHOOK_URL;
  if (!webhookUrl) return; // Local dev: don't post and don't claim the address.
  try {
    const supabase = await createClient();
    const { data: server } = await supabase
      .from("servers")
      .select("id, name, address, edition, description, owner_id")
      .eq("id", serverId)
      .maybeSingle();
    if (!server) return;

    const { data: role } = await supabase
      .from("user_roles")
      .select("discord_username")
      .eq("user_id", server.owner_id)
      .maybeSingle();

    const { data: claimed } = await supabase.rpc("claim_announcement", { p_server_id: serverId });
    if (claimed !== true) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const err = await postAnnouncement(webhookUrl, buildAnnouncement(server, role?.discord_username || "Unknown owner", siteUrl));
    if (err) await supabase.rpc("record_announcement_error", { p_server_id: serverId, error: err });
  } catch {
    // Best effort: the server stays live even if the announcement fails.
  }
}
