import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "../../components/Reveal";
import { BRIEFS } from "../data";

// Only briefs without an external (e.g. Substack) href get a page here —
// those already link straight out to the published piece.
const INTERNAL_BRIEFS = BRIEFS.filter((b) => !b.href);

export function generateStaticParams() {
  return INTERNAL_BRIEFS.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const brief = INTERNAL_BRIEFS.find((b) => b.slug === params.slug);
  if (!brief) return {};
  return {
    title: brief.title,
    description: brief.detail,
  };
}

export default function ResearchBriefPage({ params }: { params: { slug: string } }) {
  const brief = INTERNAL_BRIEFS.find((b) => b.slug === params.slug);
  if (!brief) notFound();

  return (
    <div className="pt-40 pb-32 px-6">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <Link href="/research" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 7 7 17M7 7v10h10"/>
            </svg>
            Back to Research
          </Link>

          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-4">{brief.kicker}</p>
          <h1 className="heading-xl grad-text mb-8">{brief.title}</h1>
          <p className="text-lg text-zinc-400 leading-relaxed mb-12">{brief.detail}</p>

          <div className="panel p-8">
            <p className="text-sm text-zinc-400 leading-relaxed">
              The full brief is being finalized for publication. In the meantime, the research desk
              is happy to walk you through the underlying data and methodology directly — reach out
              at{" "}
              <a href="mailto:shri@climrisk.io" className="text-white hover:text-gold-200 transition-colors font-mono">
                shri@climrisk.io
              </a>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
