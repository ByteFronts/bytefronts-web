"use client";

import { useState } from "react";

export default function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the address is still visible to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-sm text-emerald-300 hover:border-emerald-400"
      title="Click to copy"
    >
      {copied ? "Copied!" : address}
    </button>
  );
}
