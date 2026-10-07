# CRI Demo — UX & Trust Audit

Scope: `CRI_Demo.html`. Triggered by your review of the Excel Integration screen and a broader question — does the engine handle partial data, GIS opacity, and physical-mechanism scenarios honestly, or does it just look confident?

Verdict, short version: the engine is more rigorous than the UI lets on. Three of your five concerns are already solved in the JavaScript — they're just invisible. The other two (sidebar clustering, landing-page overload) are real information-architecture problems. Details and line references below, then a prioritized fix plan.

---

## 1. Sidebar has no clustering logic

`STEP 2 — ANALYSIS` (line 890) is eight flat, same-weight buttons: Physical Risk, Transition Risk, CBAM Liability, Materiality, Abatement MACC, Site Assessment, Supply Chain, Loan Portfolio. These aren't one category. They're three:

- **Risk domains** — Physical, Transition, CBAM
- **Cross-cutting frameworks** — Materiality, Abatement MACC
- **Scope/aggregation level** — Site Assessment (asset), Supply Chain (value chain), Loan Portfolio (financial portfolio)

Flattening them loses the logic a first-time user needs to know what to run and in what order. No sub-headers, no icon system distinguishing category (icons are decorative, not functional — 🌡 ⚡ 🇪🇺 ⚖ 📉 🏗 🔗 🏦 don't share a visual language).

**Fix:** three sub-groups under Step 2 with a consistent icon palette (e.g., all risk-domain icons on a red/blue/amber base, all framework icons on a neutral base, all scope-level icons on a purple base), and a short label per sub-group so the hierarchy reads without hovering.

## 2. Landing page (Excel Integration) does too much at once

Everything ships in one screen: connection status, drag-and-drop zone, four action buttons (Connect / One-time Import / Import CSV / Download Template), a four-tab data preview, and a full template-structure reference table — all visible with zero data loaded. A brand-new user has to parse the whole page before doing anything.

**Fix:** progressive disclosure. Collapse "Excel Template Structure" into an expandable "What should my file look like?" link. Preview tabs (Assets/Suppliers/Financials/Emissions) should only render once a file is connected — currently they show empty/greyed placeholders that add visual noise before there's anything to show.

## 3. Partial-data climate rating — the fallback logic exists, but is invisible on the rating itself

This is the one that worried you most, and the engine already handles it correctly:

```js
// line ~7078
if (rat && rat.composite != null && rat.pillars) {
  // full 3-pillar composite
} else {
  // Estimate from physical scores only (transition / financial pillars not yet computed)
  ...
  'Note', 'Full composite (Transition + Financial pillars) computed on complete analysis run'
}
```

So if a firm has only run physical risk, the engine does *not* fabricate a transition/financial score — it falls back to a physical-only estimate and logs that explicitly. The problem: that note is written to the **hidden trace panel** (`#cri-trace-panel`, `display:none` by default), not to the rating card itself. The actual rating hero — what a user sees first — is this, unconditionally:

```html
<!-- line 1959 -->
<div class="rating-badge" id="rat-badge">B</div>
<div class="rating-sub" id="rat-sub">Composite score: 33.9 / 100 · Confidence: High · ...</div>
```

"Confidence: High" is not wired to whether all three pillars actually ran. A B-rating built from physical data alone looks identical to a B-rating built from a complete run. That's the trust gap — not missing logic, missing disclosure.

**Fix:** bind `#rat-sub` (and the badge itself, e.g. a border style or a small flag) to `rat.pillars` completeness. Something like: `Composite score: 33.9/100 · Physical + Transition only · Financial pillar not run` with a visibly different badge treatment (outlined vs. filled) when it's partial. This is a small code change with a large trust payoff.

## 4. GIS/computation transparency exists, but only surfaces after a run, only inside Physical Risk, and nowhere near the Ratings or Map panels

The `#cri-trace-panel` (line 1750) is a genuinely good feature — it logs GPS → CMIP6 0.25° grid cell → nearest WRI Aqueduct baseline + distance-based confidence → per-hazard severity formula → joint-probability loss, citing IPCC AR6 / WRI Aqueduct 4.0 / NGFS at each step. `_ctrStart()` unhides it (`p.style.display=''`) when a computation actually runs — so it's not lying dormant, it just:

- only lives inside the **Physical Risk** panel, not Climate Rating or the Portfolio Map where a user would naturally ask "is this live?"
- is off-screen and easy to miss unless you scroll past the methodology paragraph first
- gives no persistent visual cue elsewhere that says "this score has a calculation trail — click to see it"

There's also already a strong disclaimer buried in the methodology note (line 1747): *"a parameterised assessment framework built on peer-reviewed science — not a live geospatial API query."* That's the exact honesty you're asking for. It's just written as one sentence inside a 300-word paragraph nobody reads in full.

**Fix:** add a small persistent "🔬 How was this calculated?" affordance next to every score/badge across Physical Risk, Climate Rating, and the Portfolio Map, all pointing at (or spawning) the same trace panel. Pull the "not a live geospatial query" line out of the paragraph into a standing one-line disclaimer chip near the map itself.

## 5. Heatwave → material stress → cooling/maintenance — modeled, but statistically, not mechanistically

This one's genuinely modeled deeper than the screenshot suggests. Sector hazard profiles (line ~6700 onward) carry heat-specific severity multipliers with explicit rationale — e.g., steel: *"cooling tower efficiency loss; worker safety heat limits; production rate cut"*; data centres: *"chip fab cleanroom thermal control; cooling CAPEX"*. There's a cascade model per hazard (line ~10230: Heat Stress → workforce productivity loss, cooling system overload, product quality degradation, OH&S incidents) and even a modeled adaptation response (HVAC upgrade + cooling stations, ~55% loss-reduction efficacy, line ~10987).

What it is **not**: a first-principles physics model of thermal expansion tolerances triggering specific maintenance schedules. It's a parameterized, peer-reviewed-literature-calibrated severity multiplier — same fidelity tier as the rest of the physical risk engine, and consistent with what `METHODOLOGY.md` states as v0.1 scope. That's a defensible choice for a valuation tool, not a physics simulator, but the user should be told which one they're getting.

**Fix:** no engine change needed. Add one line of UI copy near the hazard cascade view: "Severity multipliers are calibrated from published engineering/climate literature per sector, not asset-specific physical simulation." That single sentence closes the expectation gap without you having to build a thermal-stress FEA model.

---

## Prioritized plan

**Now (high trust impact, low effort):**
1. Bind the Climate Rating hero (`#rat-badge`, `#rat-sub`) to pillar completeness — show "Partial (Physical only)" vs. "Full Composite" explicitly.
2. Add a persistent "🔬 How was this calculated?" link next to every score, wired to the existing trace panel — don't build new logic, just expose what's there.
3. Pull the "not a live geospatial query / parameterised framework" disclaimer out of the wall-of-text methodology note into a standing chip near the map and near Climate Rating.

**Next (structural, medium effort):**
4. Regroup the sidebar's Step 2 into Risk Domains / Frameworks / Scope Level, with a consistent icon system per group.
5. Progressive-disclosure the Excel Integration landing page — collapse template reference and empty preview tabs until a file is connected.

**Later (content, not architecture):**
6. One-line fidelity disclaimer on hazard cascade views clarifying statistical calibration vs. physical simulation.

---

## Open questions for you

- Do you want the "Partial" rating state to be blocking (can't generate a Climate Rating report until all three pillars run) or advisory (shown but exportable with a watermark)?
- Should the trace panel become a persistent right-hand drawer available from every analysis page, or stay page-scoped but duplicated where needed?
- Is a physics-based mechanistic layer (point 5) something you want on the roadmap, or is the statistical/parameterized approach the intended permanent methodology given `METHODOLOGY.md`'s stated v0.1 scope?
