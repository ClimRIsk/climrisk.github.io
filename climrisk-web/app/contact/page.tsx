import type { Metadata } from "next";
import Reveal from "../components/Reveal";
import EngagementForm from "../components/EngagementForm";

export const metadata: Metadata = {
  title: "See the ClimRisk Engine in Action",
  description:
    "Schedule a tailored walkthrough to see how ClimRisk translates IPCC AR6 physical climate data into audit-ready financial intelligence for your portfolio.",
};

export default function ContactPage() {
  return (
    <div className="pt-40 pb-32 px-6">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-16 items-start">
        {/* Left: value anchor */}
        <Reveal>
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-200 font-mono mb-3">Request Access</p>
            <h1 className="heading-xl grad-text mb-6">See the ClimRisk Engine in Action.</h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-md mb-10">
              Schedule a tailored walkthrough to see how we translate IPCC AR6 physical climate data into
              audit-ready financial intelligence for your portfolio.
            </p>

            <p className="text-xs uppercase tracking-widest text-zinc-600 font-mono mb-4">
              Built for the frameworks you already answer to
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-mono text-zinc-500 mb-10">
              <span>IFRS S2</span>
              <span>TCFD</span>
              <span>CSRD</span>
              <span>SFDR</span>
              <span>EU Taxonomy</span>
              <span>PCAF</span>
              <span>TNFD</span>
              <span>Basel III</span>
            </div>

            <div className="pt-8 border-t border-white/8 text-sm text-zinc-500 space-y-2">
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

        {/* Right: form */}
        <Reveal delayMs={100}>
          <EngagementForm />
        </Reveal>
      </div>
    </div>
  );
}
