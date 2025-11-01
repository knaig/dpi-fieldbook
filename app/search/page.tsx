'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import Fuse from 'fuse.js';
import Link from 'next/link';
import { Search, Building2, Briefcase, Users } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { actors, isHydrated } = useFieldbookStore();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Configure Fuse.js for fuzzy search
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'contactRole', weight: 0.3 },
      { name: 'summitCompany', weight: 0.5 },
      { name: 'sector', weight: 0.2 },
    ],
    threshold: 0.3, // 0 = exact match, 1 = match anything
    includeScore: true,
  };

  const fuse = useMemo(() => new Fuse(actors, fuseOptions), [actors]);

  const results = useMemo(() => {
    if (!query.trim() || !isHydrated) return [];
    return fuse.search(query).map(result => result.item);
  }, [query, fuse, isHydrated]);

  const handleSearch = (value: string) => {
    setQuery(value);
    router.push(`/search?q=${encodeURIComponent(value)}`, { scroll: false });
  };

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-20 sm:pb-24">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Search Actors</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, role, company..."
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm sm:text-base"
            autoFocus
          />
        </div>
        {query && (
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {query && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
              <p className="text-slate-600">No actors found matching "{query}"</p>
              <p className="text-sm text-slate-500 mt-2">Try a different search term</p>
            </div>
          ) : (
            results.map(actor => (
              <Link
                key={actor.id}
                href={`/actors/${actor.id}`}
                className="block bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-lg active:shadow-md transition-all touch-manipulation"
              >
                <div className="flex items-start gap-4">
                  {actor.profileImage ? (
                    <img
                      src={actor.profileImage}
                      alt={actor.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {actor.name}
                    </h3>
                    {actor.contactRole && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{actor.contactRole}</span>
                      </div>
                    )}
                    {(actor as any).summitCompany && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-4 h-4" />
                        <span>{(actor as any).summitCompany}</span>
                      </div>
                    )}
                    {actor.interestTopics && actor.interestTopics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {actor.interestTopics.slice(0, 3).map((topic, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {!query && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Enter a name, role, or company to search</p>
          <p className="text-sm text-slate-500 mt-2">
            Searching across {actors.length} actors
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8"><p className="text-slate-600">Loading...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}

