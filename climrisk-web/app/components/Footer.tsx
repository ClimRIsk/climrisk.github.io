import Link from "next/link";

const LINKS = {
  Product: [
    { label: "Platform",   href: "/platform" },
    { label: "Engine",     href: "/engine" },
    { label: "Validation", href: "/validation" },
    { label: "Pricing",    href: "/contact" },
  ],
  Solutions: [
    { label: "Banks",           href: "/solutions#banks" },
    { label: "Asset Managers",  href: "/solutions#asset-managers" },
    { label: "Manufacturing",   href: "/solutions#manufacturing" },
    { label: "Real Estate",     href: "/solutions#real-estate" },
  ],
  Frameworks: [
    { label: "IFRS S2",   href: "/frameworks#ifrs-s2" },
    { label: "TCFD",      href: "/frameworks#tcfd" },
    { label: "CSRD",      href: "/frameworks#csrd" },
    { label: "SEBI/BRSR", href: "/frameworks#brsr" },
  ],
  Company: [
    { label: "Mission",    href: "/company" },
    { label: "Research",   href: "/research" },
    { label: "Cases",      href: "/cases" },
    { label: "Contact",    href: "/contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/6 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="18" fill="#0d1b2a"/>
                <circle cx="18" cy="18" r="16.2" stroke="#38bdf8" strokeWidth="0.9" fill="none"/>
                <line x1="14" y1="5" x2="14" y2="11" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round"/>
                <rect x="7"  y="21" width="4" height="9"  rx="1.2" fill="#38bdf8" opacity="0.82"/>
                <rect x="13" y="17" width="4" height="13" rx="1.2" fill="#38bdf8" opacity="0.95"/>
                <rect x="19" y="14" width="4" height="16" rx="1.2" fill="#38bdf8" opacity="0.82"/>
                <path d="M5 18 C8 13,12 23,18 18 C24 13,28 20,31 17" stroke="#7dd3fc" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                <circle cx="25" cy="10" r="4" fill="#f59e0b" opacity="0.96"/>
              </svg>
              <span className="text-white font-bold">
                Clim<span className="text-green-500">Risk</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Climate financial risk intelligence for capital decisions.
            </p>
            <p className="text-slate-600 text-xs">
              ClimRisk B.V.<br />
              Amsterdam, Netherlands<br />
              KVK 95420134
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                {category}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/6 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            © 2026 ClimRisk B.V. · climrisk.io · shri@climrisk.io
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <span>CRI Engine v0.4</span>
            <span>NGFS Phase 4</span>
            <span>IPCC AR6</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
