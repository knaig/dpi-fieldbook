'use client';

import { useParams } from 'next/navigation';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { useMemo } from 'react';
import Link from 'next/link';
import { Lightbulb, Building2, TrendingUp, RefreshCw, Users, Award } from 'lucide-react';

export default function SmartSortViewPage() {
  const params = useParams();
  const viewType = params.viewType as string;
  const { actors, isHydrated } = useFieldbookStore();

  const sortedActors = useMemo(() => {
    if (!isHydrated) return [];

    let sorted = [...actors];

    switch (viewType) {
      case 'ai4inclusion':
        // Sort by AI4Inclusion relevance + inclusion score
        sorted = sorted
          .filter(actor => actor.leverageForAI4Inclusion)
          .sort((a, b) => {
            // Check for AI4Inclusion keywords
            const aiKeywords = ['ai', 'artificial intelligence', 'ml', 'machine learning', 'voice', 'multilingual', 'inclusion', 'digital divide'];
            const aText = `${a.leverageForAI4Inclusion} ${a.interestTopics?.join(' ') || ''} ${a.expertiseAreas?.join(' ') || ''}`.toLowerCase();
            const bText = `${b.leverageForAI4Inclusion} ${b.interestTopics?.join(' ') || ''} ${b.expertiseAreas?.join(' ') || ''}`.toLowerCase();
            
            const aScore = aiKeywords.filter(kw => aText.includes(kw)).length + a.inclusionScore;
            const bScore = aiKeywords.filter(kw => bText.includes(kw)).length + b.inclusionScore;
            
            return bScore - aScore;
          });
        break;

      case 'followup-priority':
        // Sort by follow-up score + recency
        sorted = sorted.sort((a, b) => {
          const aScore = a.followupScore + (a.lastEnriched ? 0.5 : 0);
          const bScore = b.followupScore + (b.lastEnriched ? 0.5 : 0);
          return bScore - aScore;
        });
        break;

      case 'recent-enrichment':
        // Sort by last enriched date
        sorted = sorted
          .filter(actor => actor.lastEnriched)
          .sort((a, b) => {
            const aDate = a.lastEnriched ? new Date(a.lastEnriched).getTime() : 0;
            const bDate = b.lastEnriched ? new Date(b.lastEnriched).getTime() : 0;
            return bDate - aDate;
          });
        break;

      case 'organizations':
        // Group by organization, sort by member count
        const orgMap = new Map<string, any[]>();
        sorted.forEach(actor => {
          const org = (actor as any).summitCompany || 'Unknown';
          if (!orgMap.has(org)) orgMap.set(org, []);
          orgMap.get(org)!.push(actor);
        });
        
        const orgsBySize = Array.from(orgMap.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .flatMap(([org, members]) => members.map(m => ({ ...m, orgName: org })));
        
        sorted = orgsBySize as any;
        break;

      default:
        sorted = sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted.filter((actor, index, self) =>
      index === self.findIndex(a => a.id === actor.id)
    );
  }, [actors, viewType, isHydrated]);

  const getViewTitle = () => {
    switch (viewType) {
      case 'ai4inclusion':
        return 'AI4Inclusion Top Candidates';
      case 'followup-priority':
        return 'Top Follow-up Priority';
      case 'recent-enrichment':
        return 'Recently Enriched';
      case 'organizations':
        return 'By Organization';
      default:
        return 'Smart View';
    }
  };

  const getViewIcon = () => {
    switch (viewType) {
      case 'ai4inclusion':
        return <Lightbulb className="w-6 h-6 text-yellow-600" />;
      case 'followup-priority':
        return <TrendingUp className="w-6 h-6 text-blue-600" />;
      case 'recent-enrichment':
        return <RefreshCw className="w-6 h-6 text-green-600" />;
      case 'organizations':
        return <Building2 className="w-6 h-6 text-purple-600" />;
      default:
        return <Users className="w-6 h-6 text-slate-600" />;
    }
  };

  if (!isHydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        {getViewIcon()}
        <h1 className="text-2xl font-bold text-slate-900">{getViewTitle()}</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {sortedActors.length} actors
        </span>
      </div>

      {viewType === 'ai4inclusion' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>AI4Inclusion Relevance:</strong> Actors sorted by relevance to AI for Inclusion,
            considering their leverage points, interest topics, and inclusion scores.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedActors.map((actor: any) => (
          <Link
            key={actor.id}
            href={`/actors/${actor.id}`}
            className="block bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            {actor.profileImage && (
              <img
                src={actor.profileImage}
                alt={actor.name}
                className="w-16 h-16 rounded-full object-cover mb-3"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <h3 className="font-semibold text-slate-900 mb-1">{actor.name}</h3>
            {actor.contactRole && (
              <p className="text-sm text-slate-600 mb-2">{actor.contactRole}</p>
            )}
            {(actor as any).summitCompany && (
              <p className="text-xs text-slate-500 mb-2">{(actor as any).summitCompany}</p>
            )}
            <div className="flex gap-3 text-sm mb-2">
              <span className="text-blue-600 font-semibold">F: {actor.followupScore}</span>
              <span className="text-green-600 font-semibold">I: {actor.inclusionScore}</span>
            </div>
            {actor.leverageForAI4Inclusion && viewType === 'ai4inclusion' && (
              <p className="text-xs text-slate-600 line-clamp-2 mt-2">
                {actor.leverageForAI4Inclusion.substring(0, 100)}...
              </p>
            )}
          </Link>
        ))}
      </div>

      {sortedActors.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-600">No actors match this view</p>
        </div>
      )}
    </div>
  );
}

