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
      className="slot px-3 py-1.5 font-mono text-sm text-brand transition hover:text-fg"
      title="Click to copy"
    >
      {copied ? "Copied!" : address}
    </button>
  );
}
