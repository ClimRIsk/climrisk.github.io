import Link from "next/link";

const LINKS = {
  Advisory: [
    { label: "Carbon Auditing & Data Assurance",         href: "/capabilities#carbon-auditing" },
    { label: "Dynamic Life Cycle Assessments",            href: "/capabilities#lca" },
    { label: "Regulatory Transition & Stress Testing",    href: "/capabilities#stress-testing" },
  ],
  Engine: [
    { label: "Geospatial Pipeline",       href: "/engine#pipeline" },
    { label: "Financial Translation",     href: "/engine#financial-translation" },
    { label: "Methodological Transparency", href: "/engine#transparency" },
  ],
  Frameworks: [
    { label: "IFRS S2",   href: "/frameworks#ifrs-s2" },
    { label: "TCFD",      href: "/frameworks#tcfd" },
    { label: "CSRD",      href: "/frameworks#csrd" },
    { label: "SEBI/BRSR", href: "/frameworks#brsr" },
  ],
  Firm: [
    { label: "The Firm",              href: "/company" },
    { label: "Intelligence & Research", href: "/research" },
    { label: "Engage the Firm",       href: "/contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/8 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-mark.png" width="28" height="28" alt="ClimRisk" style={{ objectFit: "contain" }} />
              <span className="text-white font-bold">
                Clim<span className="text-gold-300">Risk</span>
              </span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              A quantitative advisory firm translating climate science into financial exposure.
            </p>
            <p className="text-zinc-600 text-xs">
              ClimRisk B.V.<br />
              Amsterdam, Netherlands<br />
              KVK 95420134
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                {category}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">
            © 2026 ClimRisk B.V. · climrisk.io · shri@climrisk.io
          </p>
          <div className="flex items-center gap-6 text-xs text-zinc-600 font-mono">
            <span>CRI ENGINE v0.5</span>
            <span>NGFS PHASE 4</span>
            <span>IPCC AR6</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
