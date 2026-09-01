import type { Metadata } from "next";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "Intelligence & Research",
  description:
    "Technical briefs and sector deep dives from the ClimRisk research desk — physical and transition risk, translated into financial terms.",
};

const BRIEFS = [
  {
    kicker: "Flagship Study",
    title: "We Ran 21 Global Industries Through Every Climate Scenario",
    detail: "A coal power plant in Germany breaks even on carbon costs at $27/tonne — the EU price today is $65. The full sector-by-sector break-even map, from coal power to oil refining.",
  },
  {
    kicker: "Physical Risk · South & Southeast Asia",
    title: "The Supply Chain Tax",
    detail: "In April 2024 a heat dome settled over South and Southeast Asia and did not move for three weeks. What that costs a global supply chain, quantified.",
    href: "https://climriskresearch.substack.com/p/the-supply-chain-tax",
  },
  {
    kicker: "Physical Risk · South Asia · Agricultural Finance · August 2026",
    title: "The Financial Anatomy of a Monsoon Deficit",
    detail: "What happens to global markets when India's rain fails — a deep dive into agricultural credit exposure under a shifting monsoon.",
  },
  {
    kicker: "Physical Risk · India",
    title: "The Productivity Tax",
    detail: "In May 2024, temperatures crossed 45°C simultaneously across Rajasthan, Uttar Pradesh, and Haryana. The labor-productivity cost of that heatwave, modelled.",
  },
  {
    kicker: "Macro Risk",
    title: "The Financial Anatomy of a Super El Niño",
    detail: "What the physical parameters of a super El Niño tell investors — before the headlines catch up.",
  },
  {
    kicker: "Sector Deep Dive · Beverages",
    title: "Assessing Physical and Transition Climate Risk in Beverages: Carlsberg Group",
    detail: "A CRFM deep dive into water stress and carbon transition exposure across a global brewer's asset base.",
  },
  {
    kicker: "Sector Deep Dive · Luxury Goods",
    title: "Assessing Physical and Transition Climate Risk in Luxury Goods: Kering Group",
    detail: "Physical and transition risk across a luxury goods supply chain, quantified asset by asset.",
  },
  {
    kicker: "Sector Deep Dive · Manufacturing",
    title: "Assessing Physical and Transition Climate Risk in Manufacturing: Michelin Group",
    detail: "A CRFM deep dive into physical and transition exposure across a global manufacturing footprint.",
  },
  {
    kicker: "Sector Deep Dive · Agriculture",
    title: "Assessing Physical and Transition Climate Risk in Agriculture: European Olive Oil Cooperatives",
    detail: "Physical risk quantification for one of Europe's most climate-exposed agricultural sectors.",
  },
];

export default function ResearchPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      <div className="max-w-4xl mx-auto mb-16">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Intelligence & Research</p>
          <h1 className="heading-xl grad-text mb-6">Research from the desk.</h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            Technical briefs and sector deep dives, published as we run them — physical and
            transition risk, always translated into financial terms.
          </p>
        </Reveal>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        {BRIEFS.map((b, i) => {
          const Wrapper = b.href ? "a" : "article";
          const linkProps = b.href
            ? { href: b.href, target: "_blank", rel: "noopener noreferrer" }
            : {};
          return (
            <Reveal key={b.title} delayMs={(i % 4) * 60}>
              <Wrapper {...linkProps} className="panel panel-hover p-7 h-full block">
                <p className="text-xs font-mono text-zinc-600 mb-3 uppercase tracking-wide">{b.kicker}</p>
                <h2 className="text-white font-semibold leading-snug mb-3">{b.title}</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">{b.detail}</p>
                {b.href && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-gold-200 mt-5">
                    Read the full brief
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M7 17 17 7M7 7h10v10"/>
                    </svg>
                  </span>
                )}
              </Wrapper>
            </Reveal>
          );
        })}
      </div>

      <div className="max-w-5xl mx-auto mt-16 pt-10 border-t border-white/8">
        <Reveal>
          <p className="text-sm text-zinc-500">
            For the full text of any brief, or to discuss commissioning sector-specific research,
            contact the research desk at{" "}
            <a href="mailto:shri@climrisk.io" className="text-white hover:text-gold-200 transition-colors font-mono">
              shri@climrisk.io
            </a>
            .
          </p>
        </Reveal>
      </div>
    </div>
  );
}
