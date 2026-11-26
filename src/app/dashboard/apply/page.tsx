import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/config";
import { getViewer } from "@/lib/roles";
import RegisterShell from "@/app/register/RegisterShell";
import ApplyForm from "../ApplyForm";

export const metadata: Metadata = { title: `Apply · ${siteConfig.name}` };

const applyCopy = {
  eyebrow: "Servers",
  title: ["Get your server", "found."],
  blurb: "Tell us about your server. Once you're approved, you can add and manage it from your dashboard.",
  bullets: ["We review every application", "Free to list", "Takes about two minutes"],
};

async function ApplyContent() {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "player") redirect("/dashboard");

  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("owner_applications")
    .select("id")
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();
  if (pending) redirect("/dashboard");

  return <ApplyForm />;
}

export default function ApplyPage() {
  return (
    <RegisterShell copy={applyCopy}>
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <ApplyContent />
      </Suspense>
    </RegisterShell>
  );
}
