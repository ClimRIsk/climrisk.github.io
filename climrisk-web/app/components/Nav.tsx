"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Platform",   href: "/platform" },
  { label: "Engine",     href: "/engine" },
  { label: "Solutions",  href: "/solutions" },
  { label: "Validation", href: "/validation" },
  { label: "Research",   href: "/research" },
  { label: "Company",    href: "/company" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#060f1e]/95 backdrop-blur-md border-b border-white/6"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 flex items-center h-16 gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-opacity group-hover:opacity-90">
            <circle cx="18" cy="18" r="18" fill="#0d1b2a"/>
            <circle cx="18" cy="18" r="16.2" stroke="#38bdf8" strokeWidth="0.9" fill="none"/>
            <line x1="14" y1="5" x2="14" y2="11" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round"/>
            <rect x="7"  y="21" width="4" height="9"  rx="1.2" fill="#38bdf8" opacity="0.82"/>
            <rect x="13" y="17" width="4" height="13" rx="1.2" fill="#38bdf8" opacity="0.95"/>
            <rect x="19" y="14" width="4" height="16" rx="1.2" fill="#38bdf8" opacity="0.82"/>
            <path d="M5 18 C8 13,12 23,18 18 C24 13,28 20,31 17" stroke="#7dd3fc" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
            <circle cx="25" cy="10" r="4" fill="#f59e0b" opacity="0.96"/>
          </svg>
          <span className="text-white font-bold text-lg tracking-tight">
            Clim<span className="text-green-500">Risk</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-white bg-white/8"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link
            href="/contact"
            className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5"
          >
            Contact
          </Link>
          <Link
            href="https://climrisk.io/app.html"
            target="_blank"
            className="btn-primary text-sm px-4 py-2"
          >
            Access Platform
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden ml-auto text-slate-400 hover:text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0b1f38]/98 border-b border-white/6 px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-white bg-white/8"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/6 mt-2">
            <Link
              href="https://climrisk.io/app.html"
              target="_blank"
              onClick={() => setMenuOpen(false)}
              className="btn-primary w-full justify-center text-sm"
            >
              Access Platform →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
