import type { Article } from "../../lib/research";

/**
 * Shared visual header for a research card (used on both /research and the
 * homepage's "Recent Intelligence" section). Every card gets a visual header
 * of the same height, whether or not it has a satellite thumbnail — a card
 * with no `thumb` used to render nothing here at all, which left unfinished
 * content sitting next to real imagery in the same grid. The fallback is a
 * generated, tier-tinted pattern + icon rather than a blank box, so the
 * grid reads as deliberate at every tier, not partially built.
 */

const TIER_TINT: Record<Article["tier"], string> = {
  flagship: "212,175,55", // gold
  regulatory: "16,185,129", // terminal green
  "case-study": "59,130,246", // blue
};

function TierIcon({ tier }: { tier: Article["tier"] }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;
  if (tier === "flagship") {
    return (
      <svg {...common}>
        <path d="M4 19.5V6a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v13" />
        <path d="M6 21a2 2 0 0 1 0-4h12v4H6Z" />
        <path d="M8 7h7M8 10h7" />
      </svg>
    );
  }
  if (tier === "regulatory") {
    return (
      <svg {...common}>
        <path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10Z" />
    </svg>
  );
}

export function CardThumb({ a, heightClass = "h-40" }: { a: Article; heightClass?: string }) {
  const badge = a.kicker.split("·")[0].trim();

  if (!a.thumb) {
    const tint = TIER_TINT[a.tier] ?? TIER_TINT.flagship;
    return (
      <div
        className={`relative ${heightClass} overflow-hidden flex items-center justify-center`}
        style={{ background: `radial-gradient(circle at 22% 18%, rgba(${tint},0.14), transparent 62%), #0c0f14` }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div
          aria-hidden="true"
          className="relative"
          style={{ color: `rgba(${tint},0.75)` }}
        >
          <TierIcon tier={a.tier} />
        </div>
        {badge ? (
          <span className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wide text-gold-200 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1">
            {badge}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`relative ${heightClass} overflow-hidden`}>
      <img src={a.thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,11,14,0.10) 0%, rgba(10,11,14,0.55) 60%, rgba(10,11,14,0.96) 100%)",
        }}
      />
      {badge ? (
        <span className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wide text-gold-200 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
