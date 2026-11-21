"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#5bd66a", "#5865f2", "#f29a4a", "#ec6a9a", "#4cc9e0", "#a66cf0", "#ffffff"];

// Pixel-square confetti burst. Fires each time `trigger` changes to a non-zero value.
export default function Confetti({ trigger, origin = { x: 0.5, y: 0.7 } }: { trigger: number; origin?: { x: number; y: number } }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles = Array.from({ length: 110 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const speed = 7 + Math.random() * 10;
      return {
        x: w * origin.x,
        y: h * origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.floor(Math.random() * 3) * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 90 + Math.random() * 50,
      };
    });

    let raf = 0;
    const step = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive++;
        p.vy += 0.38; // gravity
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
    };
  }, [trigger, origin.x, origin.y]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}
