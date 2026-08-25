import type { Metadata } from "next";
import Reveal from "../components/Reveal";
import EngagementForm from "../components/EngagementForm";

export const metadata: Metadata = {
  title: "Engage the Firm",
  description:
    "ClimRisk takes on a limited number of quarterly engagements. Submit inquiry parameters to begin the engagement protocol, or request an NDA.",
};

const PROTOCOL = [
  { n: "01", t: "Inquiry", d: "You submit inquiry parameters below. We review scope, sector, and regulatory driver before responding." },
  { n: "02", t: "NDA & Scoping Call", d: "Qualified inquiries receive an NDA and a scoping call to define the asset universe and deliverable." },
  { n: "03", t: "Engagement Proposal", d: "A fixed-scope proposal — timeline, deliverables, and fee — is issued for sign-off before work begins." },
  { n: "04", t: "Delivery", d: "Engine outputs, audit-ready reports, and a working session to defend the methodology to your stakeholders." },
];

export default function ContactPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      <div className="max-w-4xl mx-auto mb-16">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Engage the Firm</p>
          <h1 className="heading-xl grad-text mb-6">A limited number of engagements, by design.</h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            ClimRisk takes on a limited number of engagements each quarter to preserve the depth of
            our diligence. All engagements begin under NDA. Submit the parameters below to start the
            engagement protocol.
          </p>
        </Reveal>
      </div>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-16">
        <Reveal>
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-6">The Engagement Protocol</p>
            <div className="space-y-5">
              {PROTOCOL.map((s) => (
                <div key={s.n} className="flex gap-5">
                  <span className="text-sm font-mono text-gold-200 shrink-0 pt-0.5">{s.n}</span>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{s.t}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-white/8 text-sm text-zinc-500 space-y-2">
              <p>
                <span className="text-zinc-600 font-mono mr-3">Location</span>Amsterdam, Netherlands
              </p>
              <p>
                For direct media or academic inquiries, please contact our research desk at{" "}
                <a href="mailto:shri@climrisk.io" className="text-white hover:text-gold-200 transition-colors font-mono">
                  shri@climrisk.io
                </a>
                .
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <EngagementForm />
        </Reveal>
      </div>
    </div>
  );
}
