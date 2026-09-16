import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";
import { BRIEFS, type Brief } from "./data";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Flagship whitepapers, regulatory briefs, and applied case studies from the ClimRisk research desk, covering physical and transition risk translated into financial terms.",
};

function CardBody({ b }: { b: Brief }) {
  const inProgress = b.status === "in-progress";
  return (
    <>
      <p className="text-xs font-mono text-zinc-600 mb-3 uppercase tracking-wide">{b.kicker}</p>
      <h2 className="text-white font-semibold leading-snug mb-3">{b.title}</h2>
      <p className="text-sm text-zinc-500 leading-relaxed">{b.detail}</p>
      {inProgress ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-zinc-600 mt-5">
          In development, notify me when it publishes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm text-gold-200 mt-5">
          Read the full brief
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17 17 7M7 7h10v10"/>
          </svg>
        </span>
      )}
    </>
  );
}

function BriefCard({ b, delayMs }: { b: Brief; delayMs: number }) {
  const inProgress = b.status === "in-progress";

  if (inProgress) {
    return (
      <Reveal delayMs={delayMs}>
        <div className="panel p-7 h-full opacity-60 cursor-default">
          <CardBody b={b} />
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal delayMs={delayMs}>
      {b.href ? (
        <a href={b.href} target="_blank" rel="noopener noreferrer" className="panel panel-hover p-7 h-full block">
          <CardBody b={b} />
        </a>
      ) : (
        <Link href={`/research/${b.slug}`} className="panel panel-hover p-7 h-full block">
          <CardBody b={b} />
        </Link>
      )}
    </Reveal>
  );
}

const TIERS: { key: Brief["tier"]; label: string; description: string }[] = [
  {
    key: "flagship",
    label: "Flagship Whitepapers",
    description: "The deep, definitive studies, full sector or scenario coverage, gated for download once published.",
  },
  {
    key: "regulatory",
    label: "Regulatory & Compliance Briefs",
    description: "Short, practical reads on what a specific disclosure regime actually requires.",
  },
  {
    key: "case-study",
    label: "Applied Case Studies",
    description: "Real events and real portfolios, run through the engine and translated into financial terms.",
  },
];

export default function ResearchPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      <div className="max-w-4xl mx-auto mb-16">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Research</p>
          <h1 className="heading-xl grad-text mb-6">Research from the desk.</h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            Flagship whitepapers, regulatory briefs, and applied case studies, published as we run
            them, physical and transition risk always translated into financial terms.
          </p>
        </Reveal>
      </div>

      <div className="max-w-5xl mx-auto space-y-20">
        {TIERS.map((tier) => {
          const items = BRIEFS.filter((b) => b.tier === tier.key);
          if (items.length === 0) return null;
          return (
            <div key={tier.key}>
              <Reveal>
                <h2 className="heading-md text-white mb-2">{tier.label}</h2>
                <p className="text-zinc-500 text-sm mb-8 max-w-2xl">{tier.description}</p>
              </Reveal>
              <div className="grid md:grid-cols-2 gap-6">
                {items.map((b, i) => (
                  <BriefCard key={b.slug} b={b} delayMs={(i % 4) * 60} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-5xl mx-auto mt-20 pt-10 border-t border-white/8">
        <Reveal>
          <p className="text-sm text-zinc-500">
            For the full text of any brief, early access to a whitepaper still in development, or to
            discuss commissioning sector-specific research, contact the research desk at{" "}
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
