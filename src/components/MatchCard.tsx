"use client";

import { useState } from "react";
import { useCountUp } from "./useCountUp";

type Tag = { text: string; active?: boolean };

// Interactive match preview: click tags to toggle them and watch the match
// score react; the card also tilts toward the pointer.
export default function MatchCard({
  label,
  name,
  subtitle,
  match,
  tags,
  avatar = "discord",
}: {
  label: string;
  name: string;
  subtitle: string;
  match: number;
  tags: Tag[];
  avatar?: "discord" | "brand";
}) {
  const [active, setActive] = useState(() => new Set(tags.filter((t) => t.active).map((t) => t.text)));
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [bump, setBump] = useState(0);

  const initial = tags.filter((t) => t.active).length;
  const target = Math.max(40, Math.min(99, match + (active.size - initial) * 3));
  const score = useCountUp(target, Math.max(0, target - 35));

  const toggle = (text: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(text)) next.delete(text);
      else next.add(text);
      return next;
    });
    setBump((b) => b + 1);
  };

  return (
    <div className="anim-swap">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <div
        className="lift rounded-2xl border border-line bg-surface p-4"
        style={{
          transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: "transform 0.15s ease-out, border-color 0.25s, box-shadow 0.25s",
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTilt({
            x: ((e.clientX - r.left) / r.width - 0.5) * 8,
            y: -((e.clientY - r.top) / r.height - 0.5) * 8,
          });
        }}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`h-9 w-9 shrink-0 rounded-full ${avatar === "brand" ? "bg-brand" : "bg-discord"}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-semibold">{name}</p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>
          <span
            key={bump}
            className="anim-pop rounded-md bg-bg px-2 py-1 text-xs font-medium tabular-nums text-brand"
            aria-live="polite"
          >
            {score}% match
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t, i) => {
            const on = active.has(t.text);
            return (
              <button
                key={t.text}
                type="button"
                aria-pressed={on}
                style={{ animationDelay: `${150 + i * 90}ms` }}
                onClick={() => toggle(t.text)}
                className={`anim-tag-in cursor-pointer rounded-full px-3 py-1 text-xs transition active:scale-95 ${
                  on
                    ? "bg-brand font-medium text-brand-ink"
                    : "border border-line bg-bg text-fg/80 hover:border-brand/60 hover:text-fg"
                }`}
              >
                {t.text}
              </button>
            );
          })}
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
