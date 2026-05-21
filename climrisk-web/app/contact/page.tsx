import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a demo, request platform access, or ask a technical question. ClimRisk is based in Amsterdam and works with banks, asset managers, and industrial companies globally.",
};

const CONTACT_OPTIONS = [
  {
    label: "Book a demo",
    tag: "Most popular",
    desc: "30-minute walkthrough of the platform using your sector. See CRI scores, scenario outputs, and disclosure reports generated live.",
    action: "Schedule call",
    href: "mailto:shri@climrisk.io?subject=Demo Request: ClimRisk Platform",
    accent: true,
  },
  {
    label: "Request platform access",
    tag: "Pilot programme",
    desc: "Pilot access codes are available for a limited number of clients. Upload up to 50 assets and receive full financial risk outputs.",
    action: "Request access code",
    href: "mailto:shri@climrisk.io?subject=Platform Access Request",
    accent: false,
  },
  {
    label: "Technical question",
    tag: "Methodology / API",
    desc: "Questions about the engine methodology, NGFS scenario calibration, API integration, or data sources. We respond within one business day.",
    action: "Send question",
    href: "mailto:shri@climrisk.io?subject=Technical Question",
    accent: false,
  },
  {
    label: "Partnership",
    tag: "Data / distribution",
    desc: "Data providers, climate consultancies, and institutional distributors. Let us know what you are building and how ClimRisk fits.",
    action: "Get in touch",
    href: "mailto:shri@climrisk.io?subject=Partnership Enquiry",
    accent: false,
  },
];

const QUICK_FACTS = [
  { label: "Response time", value: "< 24h" },
  { label: "Pilot assets", value: "Up to 50" },
  { label: "Demo length", value: "30 min" },
  { label: "Setup required", value: "None" },
];

export default function ContactPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 border-b border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/4 mb-6">
            <span className="text-xs text-slate-500 font-mono">Contact</span>
          </div>
          <h1 className="heading-xl text-white mb-5 max-w-3xl text-balance">
            Let us run your portfolio.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">
            Book a demo and see financial risk scores generated for your assets in 30 minutes.
            No setup. No data sharing required for the demo.
          </p>
          <div className="flex flex-wrap gap-8">
            {QUICK_FACTS.map((f) => (
              <div key={f.label}>
                <div className="text-2xl font-black text-green-400 font-mono">{f.value}</div>
                <div className="text-xs text-slate-600">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact options */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5 mb-16">
            {CONTACT_OPTIONS.map((opt) => (
              <Link
                key={opt.label}
                href={opt.href}
                className={`group block rounded-2xl border p-7 transition-all duration-200 ${
                  opt.accent
                    ? "border-green-500/30 bg-green-500/5 hover:border-green-500/50 hover:bg-green-500/8"
                    : "border-white/7 bg-[#0b1f38]/50 hover:border-white/14 hover:bg-[#0b1f38]"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                      opt.accent
                        ? "border-green-500/40 text-green-400 bg-green-500/10"
                        : "border-white/10 text-slate-500 bg-white/4"
                    }`}
                  >
                    {opt.tag}
                  </span>
                  <svg
                    className="text-slate-600 group-hover:text-green-500 transition-colors mt-0.5"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <h2 className={`text-lg font-bold mb-3 ${opt.accent ? "text-white" : "text-slate-200"}`}>
                  {opt.label}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{opt.desc}</p>
                <span
                  className={`text-sm font-medium ${
                    opt.accent ? "text-green-400" : "text-slate-400 group-hover:text-white"
                  } transition-colors`}
                >
                  {opt.action} →
                </span>
              </Link>
            ))}
          </div>

          {/* Contact info panel */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Email */}
            <div className="rounded-xl border border-white/7 bg-[#0b1f38]/40 p-6">
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-500">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Email</p>
              <Link
                href="mailto:shri@climrisk.io"
                className="text-white font-mono text-sm hover:text-green-400 transition-colors"
              >
                shri@climrisk.io
              </Link>
              <p className="text-xs text-slate-600 mt-2">Response within 24 hours</p>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-white/7 bg-[#0b1f38]/40 p-6">
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-500">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Location</p>
              <p className="text-white text-sm">Amsterdam, Netherlands</p>
              <p className="text-xs text-slate-600 mt-2">ClimRisk B.V. · KVK 95420134</p>
            </div>

            {/* Platform */}
            <div className="rounded-xl border border-white/7 bg-[#0b1f38]/40 p-6">
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-500">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Platform</p>
              <Link
                href="https://climrisk.io/app.html"
                target="_blank"
                className="text-white font-mono text-sm hover:text-green-400 transition-colors"
              >
                climrisk.io/app
              </Link>
              <p className="text-xs text-slate-600 mt-2">Access by code only · pilot programme</p>
            </div>
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="px-6 pb-24 border-t border-white/6 pt-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="heading-md text-white mb-3 text-center">What happens in a demo.</h2>
          <p className="text-slate-500 text-center mb-12">30 minutes. No slides. Live data.</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "You tell us your sector",
                desc: "Banks, asset managers, manufacturing, real estate. We frame the demo around your portfolio type.",
              },
              {
                step: "02",
                title: "We upload a sample portfolio",
                desc: "5 to 10 representative assets. Coordinates resolved automatically via geocoding.",
              },
              {
                step: "03",
                title: "Engine runs live",
                desc: "Full analysis in under 3 minutes. Physical loss, carbon cost, WACC uplift, EV at risk. Asset by asset.",
              },
              {
                step: "04",
                title: "Disclosure report generated",
                desc: "CSRD Article 29a, IFRS S2, TCFD. One click. You leave with a sample PDF.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-white/7 bg-[#0b1f38]/40 p-6">
                <div className="text-xs font-mono text-green-500 tracking-widest mb-3">{item.step}</div>
                <h3 className="text-white font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
