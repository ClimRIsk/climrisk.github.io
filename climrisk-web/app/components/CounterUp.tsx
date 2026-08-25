"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-time-only number animation: brief digit-scramble, then eases into the
 * final value. Never re-triggers after the first time it enters view.
 */
export default function CounterUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 1100,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => "0".padStart(String(Math.round(value)).length, "0"));
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            obs.unobserve(entry.target);
            runAnimation();
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runAnimation() {
    const digits = String(Math.round(value)).length;
    const start = performance.now();
    const scrambleEnd = durationMs * 0.35;

    function frame(now: number) {
      const elapsed = now - start;
      if (elapsed < scrambleEnd) {
        const rand = Array.from({ length: digits }, () => Math.floor(Math.random() * 10)).join("");
        setDisplay(rand);
        requestAnimationFrame(frame);
      } else if (elapsed < durationMs) {
        const t = (elapsed - scrambleEnd) / (durationMs - scrambleEnd);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay((value * eased).toFixed(decimals));
        requestAnimationFrame(frame);
      } else {
        setDisplay(value.toFixed(decimals));
      }
    }
    requestAnimationFrame(frame);
  }

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
