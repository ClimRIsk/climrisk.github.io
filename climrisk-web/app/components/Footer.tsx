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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center text-white font-black text-xs">
                CR
              </div>
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
