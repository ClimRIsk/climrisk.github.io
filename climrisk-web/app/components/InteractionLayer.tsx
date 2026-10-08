"use client";

import { useEffect } from "react";

/**
 * Sitewide pointer interactions, mounted once in the root layout:
 *  - a soft gold spotlight that tracks the cursor across any `.panel`
 *    (sets --spot-x/--spot-y consumed by the `.panel::before` glow in
 *    globals.css)
 *  - a small magnetic pull on `.btn-primary` CTAs toward the cursor
 *
 * Both are pure enhancement — nothing here is required for the page to
 * work, so a missing/failed effect degrades silently. Skipped entirely on
 * touch devices (no fine pointer) and when the user has asked for reduced
 * motion, rather than fighting either preference.
 */
export default function InteractionLayer() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;

    let raf = 0;
    let lastEvent: PointerEvent | null = null;
    let activeBtn: HTMLElement | null = null;

    function apply() {
      raf = 0;
      const e = lastEvent;
      if (!e) return;

      const panel = (e.target as HTMLElement)?.closest?.(".panel") as HTMLElement | null;
      if (panel) {
        const r = panel.getBoundingClientRect();
        panel.style.setProperty("--spot-x", `${((e.clientX - r.left) / r.width) * 100}%`);
        panel.style.setProperty("--spot-y", `${((e.clientY - r.top) / r.height) * 100}%`);
      }

      const btn = (e.target as HTMLElement)?.closest?.(".btn-primary") as HTMLElement | null;
      if (btn !== activeBtn && activeBtn) {
        activeBtn.style.transform = "";
      }
      activeBtn = btn;
      if (btn) {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = Math.max(-8, Math.min(8, (e.clientX - cx) * 0.25));
        const dy = Math.max(-6, Math.min(6, (e.clientY - cy) * 0.25));
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    }

    function onMove(e: PointerEvent) {
      lastEvent = e;
      if (!raf) raf = requestAnimationFrame(apply);
    }

    function onLeaveWindow() {
      if (activeBtn) {
        activeBtn.style.transform = "";
        activeBtn = null;
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeaveWindow, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeaveWindow);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
