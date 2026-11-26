"use client";

import { useActionState } from "react";
import { approveApplication, rejectApplication } from "../../actions";
import type { FormState } from "@/app/register/actions";
import { ErrorBanner, Field, inputClass } from "@/components/form/controls";

export function ApproveForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(approveApplication, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      {state.error && <ErrorBanner>{state.error}</ErrorBanner>}
      <button type="submit" disabled={pending} className="btn btn-brand w-full">
        {pending ? "Approving…" : "Approve"}
      </button>
    </form>
  );
}

export function RejectForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(rejectApplication, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <Field label="Reject reason" htmlFor="reason" hint="Shown to the applicant" error={state.fieldErrors?.reason?.[0]}>
        <textarea id="reason" name="reason" rows={3} maxLength={200} required className={inputClass} />
      </Field>
      {state.error && <ErrorBanner>{state.error}</ErrorBanner>}
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? "Rejecting…" : "Reject"}
      </button>
    </form>
  );
}
