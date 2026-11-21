"use client";

import { useEffect, useState } from "react";
import MatchCard from "./MatchCard";

const friends = [
  { name: "Steve_Builder", subtitle: "Looking for a build partner", match: 92, tags: ["Creative", "Redstone", "Chill"] },
  { name: "AlexMiner", subtitle: "Cave diving and co-op survival", match: 89, tags: ["Survival", "Adventure", "Social"] },
  { name: "Pixel_Pam", subtitle: "Redstone engineer, always tinkering", match: 94, tags: ["Redstone", "Creative", "Chill"] },
];

const servers = [
  { name: "CozySurvival SMP", subtitle: "Friendly survival community", match: 88, tags: ["Survival", "Community", "No grief"] },
  { name: "BlockBrawl Network", subtitle: "Competitive PvP and minigames", match: 85, tags: ["PvP", "Minigames", "Ranked"] },
  { name: "Meadowcraft", subtitle: "Relaxed roleplay town", match: 91, tags: ["Roleplay", "Events", "Community"] },
];

const INTERVAL = 6000;

// Cycles through example friend and server matches. Pauses while you hover or
// interact with the cards, and the dots let you jump to any example.
export default function MatchShowcase() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % friends.length), INTERVAL);
    return () => clearInterval(id);
  }, [paused, index]);

  const f = friends[index];
  const s = servers[index];

  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="space-y-5">
        <MatchCard
          key={`f-${index}`}
          label="Friend match"
          name={f.name}
          subtitle={f.subtitle}
          match={f.match}
          tags={f.tags.map((text, i) => ({ text, active: i === 0 }))}
        />
        <MatchCard
          key={`s-${index}`}
          label="Server match"
          name={s.name}
          subtitle={s.subtitle}
          match={s.match}
          avatar="brand"
          tags={s.tags.map((text, i) => ({ text, active: i === 0 }))}
        />
      </div>
      <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Example matches">
        {friends.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Example ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-brand" : "w-1.5 bg-line hover:bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
