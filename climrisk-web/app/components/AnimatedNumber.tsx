"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tweens smoothly between values every time `value` changes — unlike
 * CounterUp (one-shot, triggered by scroll-into-view), this is for a
 * number that updates live in response to user input (a slider, a toggle).
 */
export default function AnimatedNumber({
  value,
  decimals = 1,
  prefix = "",
  suffix = "",
  durationMs = 420,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(0);
  const fromRef = useRef(value);

  useEffect(() => {
    const start = performance.now();
    const startVal = fromRef.current;
    const delta = value - startVal;

    function frame(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(startVal + delta * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        fromRef.current = value;
      }
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
