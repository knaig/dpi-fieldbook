'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Lightbulb, Download, Import as ImportIcon, RefreshCw } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/actors', label: 'Actors', icon: Users },
  { href: '/reflect', label: 'Reflect', icon: Lightbulb },
  { href: '/import', label: 'Import', icon: ImportIcon },
  { href: '/enrich-all', label: 'Enrich All', icon: RefreshCw },
  { href: '/export', label: 'Export', icon: Download },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors"
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
                />
                <span
                  className={`text-xs ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

