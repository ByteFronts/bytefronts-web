"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { applicationSchema } from "@/lib/owners";
import { serverSchema } from "@/lib/servers";
import { MAX_SERVERS_PER_OWNER } from "@/lib/config";
import { getViewer } from "@/lib/roles";
import type { FormState } from "@/app/register/actions";
import { announceServer } from "./announce";

export async function submitApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in with Discord again." };

  // Only these fields are read from the form: never user, Discord ID/name or status (the DB fills those).
  const parsed = applicationSchema.safeParse({
    server_name: formData.get("server_name") ?? "",
    server_address: formData.get("server_address") ?? "",
    edition: formData.get("edition"),
    server_about: formData.get("server_about") ?? "",
    play_styles: formData.getAll("play_styles").map(String),
    play_styles_other: formData.get("play_styles_other") ?? "",
    player_base_size: formData.get("player_base_size"),
    community_size: formData.get("community_size"),
    running_since: formData.get("running_since") ?? "",
    discord_link: formData.get("discord_link") ?? "",
    why_join: formData.get("why_join") ?? "",
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { error } = await supabase.from("owner_applications").insert(parsed.data);

  if (error) {
    if (error.code === "23505") return { error: "You already have an application waiting for review." };
    if (error.code === "42501") return { error: "You're already a server owner." };
    if (error.message.includes("no_discord_identity"))
      return { error: "Couldn't read your Discord account. Please log in again." };
    return { error: "Something went wrong sending your application. Please try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

// Only these fields are read from the form: never owner, Discord ID, status or hidden flags.
function parseServer(formData: FormData) {
  return serverSchema.safeParse({
    name: formData.get("name") ?? "",
    address: formData.get("address") ?? "",
    edition: formData.get("edition"),
    description: formData.get("description") ?? "",
    play_styles: formData.getAll("play_styles").map(String),
    discord_invite: formData.get("discord_invite") ?? "",
  });
}

const CAP_ERROR = `You can list up to ${MAX_SERVERS_PER_OWNER} servers.`;
const SUSPENDED = "Your owner account is suspended.";

function revalidateServers() {
  revalidatePath("/dashboard");
  revalidatePath("/servers");
}

export async function createServer(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session expired. Please log in with Discord again." };
  if (viewer.role !== "owner") return { error: "Only server owners can add servers." };

  const parsed = parseServer(formData);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { count } = await supabase
    .from("servers")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", viewer.user.id);
  if ((count ?? 0) >= MAX_SERVERS_PER_OWNER) return { error: CAP_ERROR };

  // owner_id comes from the column default (auth.uid()).
  const { data, error } = await supabase.from("servers").insert(parsed.data).select("id").single();
  if (error || !data) {
    if (error?.code === "23505") return { fieldErrors: { address: ["That server is already registered"] } };
    if (error?.message.includes("server_limit")) return { error: CAP_ERROR };
    if (viewer.ownerStatus === "suspended") return { error: SUSPENDED };
    return { error: "Something went wrong adding your server. Please try again." };
  }

  const id = data.id as string;
  after(() => announceServer(id));
  revalidateServers();
  redirect("/dashboard");
}

export async function updateServer(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session expired. Please log in with Discord again." };
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing server." };

  const parsed = parseServer(formData);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  // RLS limits this to the caller's own servers while they're an active owner.
  const { data, error } = await supabase.from("servers").update(parsed.data).eq("id", id).select("id");
  if (error?.code === "23505") return { fieldErrors: { address: ["That server is already registered"] } };
  if (error || !data?.length) {
    if (viewer.ownerStatus === "suspended") return { error: SUSPENDED };
    return { error: "Something went wrong saving your server. Please try again." };
  }

  revalidateServers();
  redirect("/dashboard");
}

export async function deleteServer(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("servers").delete().eq("id", id); // RLS: own servers, active owners only.
  revalidateServers();
}
