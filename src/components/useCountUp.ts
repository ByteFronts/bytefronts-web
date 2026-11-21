"use client";

import { useEffect, useRef, useState } from "react";

// Animates a number toward `target`, starting from wherever it currently is.
export function useCountUp(target: number, from?: number, duration = 700) {
  const [value, setValue] = useState(target);
  const current = useRef(from ?? target);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const origin = current.current;
    let raf = 0;
    const step = (now: number) => {
      const p = reduced ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(origin + (target - origin) * eased);
      current.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
