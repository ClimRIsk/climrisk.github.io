import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a demo, request platform access, or ask a technical question. shri@climrisk.io",
};

const OPTIONS = [
  {
    label: "Book a demo",
    desc: "30-minute walkthrough using your sector. Live analysis, no data sharing required.",
    action: "Schedule →",
    href: "mailto:shri@climrisk.io?subject=Demo Request",
    accent: true,
  },
  {
    label: "Request platform access",
    desc: "Pilot codes available. Upload up to 50 assets and receive full financial risk outputs.",
    action: "Request →",
    href: "mailto:shri@climrisk.io?subject=Platform Access Request",
    accent: false,
  },
  {
    label: "Technical question",
    desc: "Engine methodology, API integration, NGFS calibration. Response within 24 hours.",
    action: "Email →",
    href: "mailto:shri@climrisk.io?subject=Technical Question",
    accent: false,
  },
  {
    label: "Partnership",
    desc: "Data providers, consultancies, institutional distributors. Tell us what you are building.",
    action: "Get in touch →",
    href: "mailto:shri@climrisk.io?subject=Partnership Enquiry",
    accent: false,
  },
];

export default function ContactPage() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs font-mono text-green-500 tracking-widest mb-4 block">Contact</span>
          <h1 className="heading-xl text-white mb-5 text-balance">
            Let us run<br />your portfolio.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            30-minute demo. Live analysis on your sector.
            No setup. No data sharing required for the demo.
          </p>
          <div className="space-y-3 mb-10 text-sm text-slate-500">
            <div><span className="text-slate-600 font-mono mr-3">Email</span>
              <Link href="mailto:shri@climrisk.io" className="text-white hover:text-green-400 transition-colors font-mono">shri@climrisk.io</Link>
            </div>
            <div><span className="text-slate-600 font-mono mr-3">Response</span> Within 24 hours</div>
            <div><span className="text-slate-600 font-mono mr-3">Location</span> Amsterdam, Netherlands</div>
          </div>
        </div>
        <div className="space-y-3">
          {OPTIONS.map((o) => (
            <Link
              key={o.label}
              href={o.href}
              className={`group flex items-center justify-between rounded-xl border px-5 py-4 transition-all duration-200 ${
                o.accent
                  ? "border-green-500/30 bg-green-500/5 hover:border-green-500/50 hover:bg-green-500/8"
                  : "border-white/7 bg-[#0b1f38]/40 hover:border-white/14 hover:bg-[#0b1f38]"
              }`}
            >
              <div className="flex-1 min-w-0 mr-4">
                <p className={`font-semibold text-sm mb-1 ${o.accent ? "text-white" : "text-slate-200"}`}>{o.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{o.desc}</p>
              </div>
              <span className={`text-sm shrink-0 font-medium transition-colors ${o.accent ? "text-green-400" : "text-slate-600 group-hover:text-white"}`}>
                {o.action}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
