"use client";

import { useEffect, useRef } from "react";

// A living pixel world behind the hero, drawn on one canvas:
//  - a day/night cycle with a square sun and moon, stars, and drifting clouds
//  - fireflies at night, falling leaves by day
//  - two players who wander the grass, meet (a heart appears), and can be clicked
//  - hovering a [data-scene-trigger] button makes them run over and celebrate
//  - clicking the scene breaks a burst of pixel blocks
// Static (one still frame) when the user prefers reduced motion.

const P = 4; // one art "pixel" in CSS px
const GROUND = 44; // height of the .pixel-ground strip under the scene
const CYCLE = 90; // seconds for a full day
const START_PHASE = 0.62; // begin at night so the page matches the dark theme

type Rows = string[];
type Palette = Record<string, string>;

const HEAD: Rows = ["..hhhh..", ".hssssh.", ".sessse.", "..ssss.."];
const FRAMES: Record<string, Rows> = {
  stand: [".bbbbbb.", "sbbbbbbs", "sbbbbbbs", ".bbbbbb.", ".pp..pp.", ".pp..pp."],
  walkA: [".bbbbbb.", "sbbbbbbs", ".bbbbbbs", ".bbbbbb.", ".pp..pp.", "pp....pp"],
  walkB: [".bbbbbb.", ".bbbbbbs", "sbbbbbb.", ".bbbbbb.", "..pppp..", "..pppp.."],
  up: ["sbbbbbbs", ".bbbbbb.", ".bbbbbb.", ".bbbbbb.", ".pp..pp.", ".pp..pp."],
};
// In the "up" pose the arms go over the head.
const UP_HEAD: Rows = ["s.hhhh.s", "s.ssss.s", ".sessse.", "..ssss.."];

const PAL_A: Palette = { h: "#6b4a2f", s: "#e0b48a", e: "#2b2b2b", b: "#5865f2", p: "#2d3a8c" };
const PAL_B: Palette = { h: "#3a2a1c", s: "#e0b48a", e: "#2b2b2b", b: "#5bd66a", p: "#2f7a3a" };
const HEART: Rows = [".rr.rr.", "rrrrrrr", "rrrrrrr", ".rrrrr.", "..rrr..", "...r..."];
const CONFETTI = ["#5bd66a", "#5865f2", "#f29a4a", "#ec6a9a", "#4cc9e0", "#a66cf0", "#ffffff"];
const BLOCKS = ["#8a5a36", "#6f4a2b", "#5bd66a", "#3f9a4b", "#9aa6b2"];

type Player = {
  x: number;
  target: number;
  wait: number;
  jy: number; // height above ground
  vy: number;
  hopT: number;
  step: number;
  moving: boolean;
  pal: Palette;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  max: number;
  heart?: boolean;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

// Small deterministic generator so stars/clouds are stable between renders.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function drawRows(ctx: CanvasRenderingContext2D, rows: Rows, pal: Palette, x: number, y: number, px = P) {
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const color = pal[rows[r][c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + c * px, y + r * px, px, px);
    }
  }
}

// startPhase: where in the day the scene begins (0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight).
export default function PixelScene({ startPhase = START_PHASE }: { startPhase?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const section = canvas.parentElement ?? canvas;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let clock = 0; // seconds of scene time
    let encounterCooldown = 3;
    let showTimer = 0;
    let excitedNow = false;

    // Scenery, stored in 0..1 coordinates so it survives resizes.
    const rnd = seeded(7);
    const stars = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd() * 0.7, ph: rnd() * 6.28, big: rnd() > 0.85 }));
    const clouds = Array.from({ length: 6 }, () => ({
      x: rnd(),
      y: 0.08 + rnd() * 0.4,
      scale: 0.8 + rnd() * 0.9,
      speed: 6 + rnd() * 9,
    }));
    const flies = Array.from({ length: 16 }, () => ({ x: rnd(), y: rnd(), ph: rnd() * 6.28, sp: 0.5 + rnd() * 0.8 }));
    const leaves = Array.from({ length: 10 }, () => ({
      x: rnd(),
      y: rnd(),
      sp: 12 + rnd() * 14,
      sway: 0.8 + rnd(),
      ph: rnd() * 6.28,
      color: ["#5bd66a", "#3f9a4b", "#8a5a36"][Math.floor(rnd() * 3)],
    }));

    const players: Player[] = [
      { x: 0, target: 0, wait: 1, jy: 0, vy: 0, hopT: 0, step: 0, moving: false, pal: PAL_A },
      { x: 0, target: 0, wait: 2, jy: 0, vy: 0, hopT: 0, step: 0, moving: false, pal: PAL_B },
    ];
    const particles: Particle[] = [];

    const trigger = { hover: false, until: 0, x: 0 };
    let triggerEl: Element | null = null;

    const burst = (x: number, y: number, colors: string[], count: number, speed: number) => {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
        const s = rand(speed * 0.4, speed);
        particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          size: P * (1 + Math.floor(Math.random() * 2)),
          color: colors[Math.floor(Math.random() * colors.length)],
          life: rand(0.7, 1.3),
          max: 1.3,
        });
      }
    };
    const heart = (x: number, y: number) =>
      particles.push({ x, y, vx: 0, vy: -26, size: 3, color: "#ff5d73", life: 1.6, max: 1.6, heart: true });

    const groundY = () => h - GROUND + 2;
    const pickTarget = () => rand(w * 0.06, w * 0.94);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      players.forEach((p, i) => {
        p.x = p.x ? clamp(p.x, 30, w - 30) : w * (i ? 0.66 : 0.34);
        p.target = pickTarget();
      });
    };

    const updatePlayers = (dt: number, now: number) => {
      const excited = trigger.hover || now < trigger.until;
      excitedNow = excited;
      players.forEach((p, i) => {
        p.moving = false;
        let speed = 36;
        let goal: number | null = null;

        if (excited) {
          goal = clamp(trigger.x + (i ? 28 : -28), 30, w - 30);
          speed = 150;
        } else if (p.wait > 0) {
          p.wait -= dt;
        } else {
          goal = p.target;
        }

        if (goal !== null) {
          const dx = goal - p.x;
          if (Math.abs(dx) > 3) {
            p.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
            p.moving = true;
          } else if (!excited) {
            p.wait = rand(1, 3.5);
            p.target = pickTarget();
            if (Math.random() < 0.35) p.vy = 260; // a little hop
          }
        }

        // Celebrate with hops once they arrive.
        if (excited && !p.moving) {
          p.hopT -= dt;
          if (p.hopT <= 0 && p.jy === 0) {
            p.vy = 340;
            p.hopT = 0.6 + i * 0.15;
          }
        }

        if (p.vy !== 0 || p.jy > 0) {
          p.jy += p.vy * dt;
          p.vy -= 950 * dt;
          if (p.jy <= 0) {
            p.jy = 0;
            p.vy = 0;
          }
        }
        if (p.moving) p.step += dt * (excited ? 14 : 7);
      });

      // Fireworks while celebrating.
      if (excited) {
        showTimer -= dt;
        if (showTimer <= 0) {
          showTimer = 0.9;
          const mid = (players[0].x + players[1].x) / 2;
          burst(mid, groundY() - 70, CONFETTI, 20, 230);
        }
      } else {
        showTimer = 0.2;
      }

      // The two meet: show a heart.
      encounterCooldown -= dt;
      if (!excited && encounterCooldown <= 0 && Math.abs(players[0].x - players[1].x) < 64) {
        heart((players[0].x + players[1].x) / 2 - 6, groundY() - 62);
        encounterCooldown = 7;
      }
    };

    const updateParticles = (dt: number) => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const q = particles[i];
        q.life -= dt;
        if (q.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        if (!q.heart) q.vy += 520 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      const horizon = h - GROUND;

      // --- sky -----------------------------------------------------------------
      const phase = (time / CYCLE + startPhase) % 1;
      const sunH = Math.sin(phase * Math.PI * 2); // > 0 : sun up, < 0 : moon up
      const day = smooth(clamp((sunH + 0.1) / 0.55, 0, 1));
      const dusk = clamp(1 - Math.abs(sunH) / 0.32, 0, 1);
      const night = 1 - day;

      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, `rgba(20, 52, 86, ${0.1 + day * 0.3})`);
      sky.addColorStop(1, `rgba(46, 120, 160, ${day * 0.5})`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, horizon);
      if (dusk > 0) {
        const glow = ctx.createLinearGradient(0, horizon * 0.45, 0, horizon);
        glow.addColorStop(0, "rgba(242, 154, 74, 0)");
        glow.addColorStop(1, `rgba(242, 154, 74, ${dusk * 0.28})`);
        ctx.fillStyle = glow;
        ctx.fillRect(0, horizon * 0.45, w, horizon * 0.55);
      }

      // stars
      for (const s of stars) {
        const a = night * (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 1.6 + s.ph)));
        if (a < 0.03) continue;
        ctx.fillStyle = `rgba(230, 240, 255, ${a})`;
        const size = s.big ? P : P / 2;
        ctx.fillRect(Math.round(s.x * w), Math.round(s.y * horizon), size, size);
      }

      // sun and moon (square, like the game)
      const isSun = sunH > 0;
      const u = isSun ? phase * 2 : (phase - 0.5) * 2;
      const bx = w * (0.08 + 0.84 * u);
      const by = horizon * 0.86 - Math.sin(Math.PI * u) * horizon * 0.72;
      if (isSun) {
        ctx.fillStyle = "rgba(255, 216, 107, 0.92)";
        ctx.fillRect(Math.round(bx - 14), Math.round(by - 14), 28, 28);
        ctx.fillStyle = "rgba(255, 240, 180, 0.95)";
        ctx.fillRect(Math.round(bx - 8), Math.round(by - 8), 16, 16);
      } else {
        ctx.fillStyle = "rgba(223, 230, 242, 0.88)";
        ctx.fillRect(Math.round(bx - 12), Math.round(by - 12), 24, 24);
        ctx.fillStyle = "rgba(184, 194, 212, 0.9)";
        ctx.fillRect(Math.round(bx - 6), Math.round(by - 6), 6, 6);
        ctx.fillRect(Math.round(bx + 2), Math.round(by + 2), 6, 6);
      }

      // clouds
      for (const c of clouds) {
        const u8 = 8 * c.scale;
        const span = w + 260;
        const x = ((c.x * span + time * c.speed) % span) - 130;
        const y = Math.round(c.y * horizon);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + day * 0.1 + night * 0.025})`;
        ctx.fillRect(Math.round(x + 2 * u8), y, Math.round(4 * u8), Math.round(u8));
        ctx.fillRect(Math.round(x + u8), Math.round(y + u8), Math.round(6 * u8), Math.round(u8));
        ctx.fillRect(Math.round(x), Math.round(y + 2 * u8), Math.round(8 * u8), Math.round(u8));
      }

      // leaves by day
      for (const l of leaves) {
        const y = ((l.y * horizon + time * l.sp) % (horizon + 20)) - 10;
        const x = l.x * w + Math.sin(time * l.sway + l.ph) * 28;
        ctx.fillStyle = l.color;
        ctx.globalAlpha = 0.15 + day * 0.55;
        ctx.fillRect(Math.round(x), Math.round(y), P, P);
      }
      ctx.globalAlpha = 1;

      // fireflies at night
      for (const f of flies) {
        const x = f.x * w + Math.sin(time * f.sp + f.ph) * 34;
        const y = horizon - 24 - f.y * 130 + Math.cos(time * f.sp * 0.8 + f.ph) * 16;
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.4 + f.ph * 3);
        const a = night * (0.25 + 0.75 * pulse);
        if (a < 0.05) continue;
        ctx.fillStyle = `rgba(216, 255, 122, ${a * 0.25})`;
        ctx.fillRect(Math.round(x - 4), Math.round(y - 4), 10, 10);
        ctx.fillStyle = `rgba(216, 255, 122, ${a})`;
        ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
      }

      // --- players ------------------------------------------------------------
      const gy = groundY();
      const excited = excitedNow;
      players.forEach((p) => {
        const airborne = p.jy > 0;
        const frame = excited && !p.moving ? "up" : p.moving ? (Math.floor(p.step) % 2 ? "walkA" : "walkB") : "stand";
        const rows = [...(frame === "up" ? UP_HEAD : HEAD), ...FRAMES[frame]];
        const px = Math.round(p.x - 16);
        const py = Math.round(gy - rows.length * P - p.jy);
        // shadow shrinks as they jump
        ctx.fillStyle = `rgba(0, 0, 0, ${0.28 - Math.min(0.18, p.jy / 400)})`;
        ctx.fillRect(px + 2, gy - 2, 28 - (airborne ? 8 : 0), 3);
        drawRows(ctx, rows, p.pal, px, py);
      });

      // --- particles -----------------------------------------------------------
      for (const q of particles) {
        ctx.globalAlpha = clamp(q.life / 0.4, 0, 1);
        if (q.heart) drawRows(ctx, HEART, { r: q.color }, Math.round(q.x), Math.round(q.y), q.size);
        else {
          ctx.fillStyle = q.color;
          ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size);
        }
      }
      ctx.globalAlpha = 1;
    };

    const refreshTrigger = () => {
      if (!triggerEl) return;
      const c = canvas.getBoundingClientRect();
      const r = triggerEl.getBoundingClientRect();
      trigger.x = r.left - c.left + r.width / 2;
    };

    const loop = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      if (visible) {
        clock += dt;
        refreshTrigger();
        updatePlayers(dt, t);
        updateParticles(dt);
        draw(clock);
      }
      raf = requestAnimationFrame(loop);
    };

    // --- interaction -------------------------------------------------------------
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const trig = target?.closest?.("[data-scene-trigger]");
      if (trig) {
        triggerEl = trig;
        refreshTrigger();
        trigger.until = performance.now() + 2600; // also works on touch screens
        return;
      }
      if (target?.closest?.("a, button, input, textarea, select")) return;
      const { x, y } = local(e);
      const gy = groundY();
      const hit = players.find((p) => Math.abs(x - p.x) < 22 && y > gy - 54 && y < gy + 4);
      if (hit) {
        hit.vy = 360;
        heart(hit.x - 6, gy - 66);
        burst(hit.x, gy - 40, CONFETTI, 10, 150);
      } else {
        burst(x, y, BLOCKS, 14, 200);
      }
    };

    const onOver = (e: PointerEvent) => {
      const trig = (e.target as Element | null)?.closest?.("[data-scene-trigger]");
      if (trig) {
        triggerEl = trig;
        trigger.hover = true;
        refreshTrigger();
      }
    };
    const onOut = (e: PointerEvent) => {
      const leaving = (e.target as Element | null)?.closest?.("[data-scene-trigger]");
      if (leaving && !leaving.contains(e.relatedTarget as Node | null)) trigger.hover = false;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);

    if (reduced) {
      draw(0);
    } else {
      section.addEventListener("pointerdown", onDown);
      document.addEventListener("pointerover", onOver);
      document.addEventListener("pointerout", onOut);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      section.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  }, [startPhase]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
