'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Lightbulb, Download, Import as ImportIcon, RefreshCw, Trash2, ShieldCheck, Search, Building2, BookOpen, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/actors', label: 'Actors', icon: Users },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/organizations', label: 'Orgs', icon: Building2 },
  { href: '/collaboration-wall', label: 'Collab Wall', icon: Sparkles },
  { href: '/visitor-book', label: 'Visitor Book', icon: BookOpen },
  { href: '/validate', label: 'Validate', icon: ShieldCheck },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Top Search Bar - Hidden on mobile, shown on tablet+ */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 hidden sm:block">
        <div className="max-w-6xl mx-auto px-4 py-2 sm:py-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actors by name, role, company..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Navigation - Mobile optimized */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-inset-bottom">
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="flex justify-around items-center h-14 sm:h-16">
            {navItems.map(({ href, label, icon: Icon }) => {
              // Avoid hydration mismatches: render neutral state until mounted
              const isActive = mounted && (pathname === href || (href === '/search' && pathname?.startsWith('/search')));
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-lg transition-colors active:bg-slate-800 touch-manipulation min-w-[60px] sm:min-w-0"
                >
                  <Icon
                    className={`w-5 h-5 sm:w-5 sm:h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
                  />
                  <span
                    className={`text-[10px] sm:text-xs ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

