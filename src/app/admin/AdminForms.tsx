"use client";

import { useActionState } from "react";
import { markAuditReviewed, setOwnerStatus, setServerHidden } from "./actions";
import type { FormState } from "@/app/register/actions";
import { ErrorBanner, inputClass } from "@/components/form/controls";

export function HideForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setServerHidden, {});
  return (
    <form action={action} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="hidden" value="true" />
      <input
        name="reason"
        maxLength={200}
        required
        placeholder="Reason (shown to owner)"
        aria-label="Hide reason"
        aria-invalid={state.fieldErrors?.reason ? true : undefined}
        className={`${inputClass} w-64`}
      />
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Hiding…" : "Hide"}
      </button>
      {state.fieldErrors?.reason && <p className="w-full text-sm text-red-400">{state.fieldErrors.reason[0]}</p>}
      {state.error && <ErrorBanner>{state.error}</ErrorBanner>}
    </form>
  );
}

export function UnhideForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setServerHidden, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="hidden" value="false" />
      {state.error && <ErrorBanner>{state.error}</ErrorBanner>}
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Unhiding…" : "Unhide"}
      </button>
    </form>
  );
}

export function OwnerStatusForm({ userId, status }: { userId: string; status: "active" | "suspended" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setOwnerStatus, {});
  const suspend = status === "active";
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="status" value={suspend ? "suspended" : "active"} />
      {state.error && <ErrorBanner>{state.error}</ErrorBanner>}
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Saving…" : suspend ? "Suspend" : "Reinstate"}
      </button>
    </form>
  );
}

export function AuditForm({ children }: { children: React.ReactNode }) {
  const [state, action, pending] = useActionState<FormState, FormData>(markAuditReviewed, {});
  return (
    <form action={action} className="space-y-4">
      {children}
      {state.error && <ErrorBanner>{state.error}</ErrorBanner>}
      <button type="submit" disabled={pending} className="btn btn-brand">
        {pending ? "Saving…" : "Mark reviewed"}
      </button>
    </form>
  );
}
