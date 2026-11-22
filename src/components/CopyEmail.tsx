"use client";

import { useEffect, useRef, useState } from "react";

// Click copies the email and the button confirms with a pop and a drawn checkmark.
// If the clipboard is blocked it falls back to opening the mail app.
export default function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Click to copy"
      className={`inline-flex min-w-[15.5rem] items-center justify-center gap-2 ${className} ${copied ? "anim-pop" : ""}`}
    >
      {copied ? (
        <svg key="ok" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path className="anim-draw-check" style={{ animationDelay: "0s" }} d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" />
        </svg>
      )}
      <span aria-live="polite">{copied ? "Copied to clipboard" : email}</span>
    </button>
  );
}
