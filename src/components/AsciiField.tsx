"use client";

import { useEffect, useRef } from "react";

const RAMP = " .:-=+*#%@";
const CELL_W = 9;
const CELL_H = 14;
const WAVE_SPEED = 420; // px per second
const WAVE_LIFE = 2.4; // seconds
const QUIET_PAD = 14; // px around marked text where the ASCII is hidden
const QUIET_FADE = 64; // px over which it fades back in
const QUIET_STRENGTH = 0.94; // how much text areas are dimmed (1 = fully hidden)

type Rect = { l: number; t: number; r: number; b: number };

// Animated ASCII background: drifting noise rendered as text on a canvas.
// - The pointer lights up the characters near it, easing in and out smoothly.
// - Clicking sends a wave rippling outward.
// - Elements marked with data-ascii-quiet (inside the parent) keep the ASCII dimmed
//   behind them so text stays readable.
// Static when reduced motion is on.
export default function AsciiField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement ?? canvas;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { x: 0, y: 0, inside: false }; // where the pointer is
    const glow = { x: 0, y: 0, amt: 0 }; // eased position and strength
    const ripples: { x: number; y: number; t0: number }[] = [];
    let quiet: Rect[] = [];
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let visible = true;
    let last = 0;
    let frame = 0;

    const refreshQuiet = () => {
      const c = canvas.getBoundingClientRect();
      quiet = [...parent.querySelectorAll("[data-ascii-quiet]")].map((el) => {
        const r = el.getBoundingClientRect();
        return { l: r.left - c.left - QUIET_PAD, t: r.top - c.top - QUIET_PAD, r: r.right - c.left + QUIET_PAD, b: r.bottom - c.top + QUIET_PAD };
      });
    };

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL_W);
      rows = Math.ceil(height / CELL_H);
      refreshQuiet();
    };

    // 1 far from any marked text, down to (1 - QUIET_STRENGTH) right on top of it.
    const quietFactor = (px: number, py: number) => {
      let f = 1;
      for (const q of quiet) {
        const dx = Math.max(q.l - px, 0, px - q.r);
        const dy = Math.max(q.t - py, 0, py - q.b);
        const d = Math.sqrt(dx * dx + dy * dy);
        const near = 1 - Math.min(1, d / QUIET_FADE);
        f = Math.min(f, 1 - near * near * QUIET_STRENGTH);
      }
      return f;
    };

    const draw = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;

      // Ease the pointer glow in and out instead of snapping.
      const k = 1 - Math.exp(-dt * 9);
      if (target.inside) {
        if (glow.amt < 0.01) {
          glow.x = target.x; // appear at the pointer, then follow it
          glow.y = target.y;
        }
        glow.x += (target.x - glow.x) * k;
        glow.y += (target.y - glow.y) * k;
      }
      glow.amt += ((target.inside ? 1 : 0) - glow.amt) * (1 - Math.exp(-dt * (target.inside ? 7 : 4)));
      if (glow.amt < 0.002) glow.amt = 0;
      const radius = 70 + 90 * glow.amt;

      if (frame++ % 12 === 0) refreshQuiet(); // text may be mid-animation
      for (let i = ripples.length - 1; i >= 0; i--) {
        if ((t - ripples[i].t0) / 1000 > WAVE_LIFE) ripples.splice(i, 1);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${CELL_H - 2}px ui-monospace, Menlo, Consolas, monospace`;
      ctx.textBaseline = "top";
      const time = t / 1000;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * CELL_W;
          const py = y * CELL_H;
          const v =
            Math.sin(x * 0.18 + time * 0.9) +
            Math.sin(y * 0.26 - time * 0.7) +
            Math.sin((x + y) * 0.11 + time * 0.5);
          let n = (v + 3) / 6; // 0..1

          let g = 0;
          if (glow.amt > 0) {
            const gx = px - glow.x;
            const gy = py - glow.y;
            const d = Math.sqrt(gx * gx + gy * gy);
            const s = Math.max(0, 1 - d / radius);
            g = s * s * (3 - 2 * s) * glow.amt; // smoothstep falloff
          }

          let wave = 0;
          for (const r of ripples) {
            const age = (t - r.t0) / 1000;
            const rx = px - r.x;
            const ry = py - r.y;
            const dist = Math.sqrt(rx * rx + ry * ry);
            const front = age * WAVE_SPEED;
            const band = Math.exp(-Math.pow((dist - front) / 38, 2)); // bright ring
            const trail = Math.sin((dist - front) * 0.09) * 0.25 * Math.exp(-Math.max(0, front - dist) / 160);
            const fade = Math.max(0, 1 - age / WAVE_LIFE);
            wave += (band + (dist < front ? trail : 0)) * fade;
          }

          n = Math.min(1, n * 0.55 + g * 0.85 + wave * 0.9);
          const ch = RAMP[Math.floor(n * (RAMP.length - 1))];
          if (ch === " ") continue;

          const q = quietFactor(px, py);
          ctx.fillStyle = `rgba(91, 214, 106, ${(0.1 + n * 0.6) * q})`;
          ctx.fillText(ch, px, py);
        }
      }
    };

    const loop = (t: number) => {
      if (visible) draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      target.inside = true;
    };
    const onLeave = () => {
      target.inside = false; // glow fades out where it was
    };
    // Click (or tap) sends a wave rippling out from that point.
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      const r = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now() });
      if (ripples.length > 8) ripples.shift();
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);
    parent.addEventListener("pointerdown", onDown);

    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      parent.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
