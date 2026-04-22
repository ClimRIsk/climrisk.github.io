'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/compare', label: 'Compare', icon: '⚖️' },
  { href: '/sensitivity', label: 'Sensitivity', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-green-500">CRI</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Climate Risk Intelligence</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          v1.0 • Climate financial risk modelling engine
        </p>
      </div>
    </aside>
  );
}
