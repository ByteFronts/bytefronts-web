"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";
import { reasonSchema } from "@/lib/owners";
import type { FormState } from "@/app/register/actions";

const GENERIC = "Something went wrong. Please try again.";

// RPCs raise the bare message text (`not_pending`, `reason_required`, ...).
async function call(name: string, args: Record<string, unknown>): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(name, args);
  if (error) {
    if (error.message === "not_pending") return { error: "This application was already reviewed." };
    if (error.message === "reason_required") return { fieldErrors: { reason: ["Enter a reason"] } };
    return { error: GENERIC };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

function reason(fd: FormData) {
  const r = reasonSchema.safeParse(fd.get("reason") ?? "");
  return r.success ? { value: r.data } : { state: { fieldErrors: { reason: r.error.issues.map((i) => i.message) } } as FormState };
}

export async function approveApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  return call("approve_application", { app_id: str(fd, "id") });
}

export async function rejectApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = reason(fd);
  if (!("value" in r)) return r.state;
  return call("reject_application", { app_id: str(fd, "id"), reason: r.value });
}

export async function setServerHidden(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const hidden = str(fd, "hidden") === "true";
  if (!hidden) return call("set_server_hidden", { server_id: str(fd, "id"), hidden, reason: null });
  const r = reason(fd);
  if (!("value" in r)) return r.state;
  return call("set_server_hidden", { server_id: str(fd, "id"), hidden, reason: r.value });
}

export async function setOwnerStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const status = z.enum(["active", "suspended"]).safeParse(str(fd, "status"));
  if (!status.success) return { error: GENERIC };
  return call("set_owner_status", { target: str(fd, "user_id"), status: status.data });
}

export async function markAuditReviewed(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const ids = fd.getAll("ids").map(String);
  if (ids.length === 0) return { ok: true };
  return call("mark_audit_reviewed", { ids });
}
