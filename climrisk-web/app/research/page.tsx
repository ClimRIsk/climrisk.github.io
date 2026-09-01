import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";
import { BRIEFS } from "./data";

export const metadata: Metadata = {
  title: "Intelligence & Research",
  description:
    "Technical briefs and sector deep dives from the ClimRisk research desk — physical and transition risk, translated into financial terms.",
};

function CardBody({ kicker, title, detail }: { kicker: string; title: string; detail: string }) {
  return (
    <>
      <p className="text-xs font-mono text-zinc-600 mb-3 uppercase tracking-wide">{kicker}</p>
      <h2 className="text-white font-semibold leading-snug mb-3">{title}</h2>
      <p className="text-sm text-zinc-500 leading-relaxed">{detail}</p>
      <span className="inline-flex items-center gap-1.5 text-sm text-gold-200 mt-5">
        Read the full brief
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M7 17 17 7M7 7h10v10"/>
        </svg>
      </span>
    </>
  );
}

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
        {BRIEFS.map((b, i) => (
          <Reveal key={b.slug} delayMs={(i % 4) * 60}>
            {b.href ? (
              <a href={b.href} target="_blank" rel="noopener noreferrer" className="panel panel-hover p-7 h-full block">
                <CardBody kicker={b.kicker} title={b.title} detail={b.detail} />
              </a>
            ) : (
              <Link href={`/research/${b.slug}`} className="panel panel-hover p-7 h-full block">
                <CardBody kicker={b.kicker} title={b.title} detail={b.detail} />
              </Link>
            )}
          </Reveal>
        ))}
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
