import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "The Firm",
  description:
    "ClimRisk B.V. — a quantitative climate risk advisory forged in hard-to-abate industry, built on a European regulatory edge. Founded by Shrinivash Dhamodhara Kannan.",
};

export default function CompanyPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      <div className="max-w-4xl mx-auto mb-24">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">The Firm</p>
          <h1 className="heading-xl grad-text mb-6">Built from inside the industries we assess.</h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            ClimRisk is not a software company that learned climate science. It is a climate and
            industrial background that built the software it wished existed.
          </p>
        </Reveal>
      </div>

      <div className="max-w-4xl mx-auto space-y-20">
        <Reveal>
          <div className="grid md:grid-cols-[160px_1fr] gap-10">
            <span className="text-xs font-mono text-zinc-600">01</span>
            <div>
              <h2 className="heading-md text-white mb-4">Forged in Hard-to-Abate Sectors</h2>
              <p className="text-zinc-400 leading-relaxed">
                Our leadership's grounding is operational, not academic. Before building the CRI
                Engine, our team worked as geologists and corporate sustainability leads inside
                heavy manufacturing and cement — one of the hardest-to-abate sectors in the global
                economy. That means the hazard models and abatement curves underneath our advisory
                work are calibrated against what actually happens on a plant floor and a mine site,
                not what a spreadsheet assumes should happen.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="grid md:grid-cols-[160px_1fr] gap-10">
            <span className="text-xs font-mono text-zinc-600">02</span>
            <div>
              <h2 className="heading-md text-white mb-4">The European Regulatory Edge</h2>
              <p className="text-zinc-400 leading-relaxed">
                Our team holds specialized postgraduate degrees from institutions like Erasmus
                University Rotterdam, giving us a native fluency in the European regulatory
                architecture — CSRD, IFRS S2, and the supervisory expectations of the ECB and
                national regulators — before a single client engagement begins. We are not
                translating American software into European compliance language after the fact.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={160}>
          <div className="grid md:grid-cols-[160px_1fr] gap-10">
            <span className="text-xs font-mono text-zinc-600">03</span>
            <div>
              <h2 className="heading-md text-white mb-4">Our Leadership</h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                ClimRisk is led by founder{" "}
                <a
                  href="https://www.linkedin.com/in/shrinivash-dhamodhara-kannan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-2 decoration-zinc-600 hover:decoration-gold-300 transition-colors"
                >
                  Shrinivash Dhamodhara Kannan
                </a>
                , whose background spans geology, corporate sustainability in heavy industry, and
                postgraduate specialization in the European regulatory environment. ClimRisk B.V.
                is based in Amsterdam.
              </p>
              <p className="text-zinc-600 text-sm font-mono">
                ClimRisk B.V. · Amsterdam, Netherlands · KVK 95420134
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="max-w-4xl mx-auto mt-24 pt-16 border-t border-white/8 flex flex-wrap gap-4">
        <Reveal>
          <Link href="/contact" className="btn-primary">Engage the Firm</Link>
          <Link href="mailto:shri@climrisk.io" className="btn-ghost ml-4">shri@climrisk.io</Link>
        </Reveal>
      </div>
    </div>
  );
}
