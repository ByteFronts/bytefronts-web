"use client";

import { useEffect, useRef } from "react";

// A faint dot grid that lights up under the cursor. Place inside a `relative` parent;
// it tracks the pointer over that parent. On touch screens the light drifts on its own (CSS).
export default function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || !window.matchMedia("(pointer: fine)").matches) return;
    el.dataset.pointer = "";

    let raf = 0;
    let x = 0;
    let y = 0;
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--x", `${x}px`);
        el.style.setProperty("--y", `${y}px`);
        el.dataset.active = "";
      });
    };
    const leave = () => delete el.dataset.active;

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} aria-hidden className="spotlight" />;
}
