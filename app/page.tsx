'use client';

import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { Target, Users, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { actors, isHydrated } = useFieldbookStore();

  if (!isHydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const topActors = [...actors]
    .sort((a, b) => b.followupScore - a.followupScore)
    .slice(0, 3);

  const spokenCount = actors.filter(a => a.spokenTo).length;
  const avgInclusion =
    actors.length > 0
      ? actors.reduce((sum, a) => sum + a.inclusionScore, 0) / actors.length
      : 0;

  const unanswered = actors.filter(
    a => !a.spokenTo && !a.notes && a.followupScore > 0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm text-slate-600">Total Actors</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{actors.length}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-green-500" />
            <h3 className="text-sm text-slate-600">Spoken To</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{spokenCount}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm text-slate-600">Avg Inclusion Score</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {avgInclusion.toFixed(1)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm text-slate-600">To Follow Up</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{unanswered.length}</p>
        </div>
      </div>

      {topActors.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            🎯 Top 3 Priority Actors
          </h2>
          <div className="space-y-3">
            {topActors.map(actor => (
              <Link
                key={actor.id}
                href={`/actors/${actor.id}`}
                className="block p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{actor.name}</p>
                    <p className="text-sm text-slate-600">{actor.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      Score: {actor.followupScore}
                    </p>
                    {actor.spokenTo && (
                      <p className="text-xs text-green-600">✓ Spoken</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {unanswered.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            💭 Unanswered Questions
          </h2>
          <div className="space-y-2">
            {unanswered.slice(0, 5).map(actor => (
              <div
                key={actor.id}
                className="flex items-center gap-3 text-sm text-slate-600"
              >
                <Target className="w-4 h-4 text-orange-500" />
                <span>{actor.name}</span>
              </div>
            ))}
            {unanswered.length > 5 && (
              <p className="text-sm text-slate-500 mt-2">
                +{unanswered.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {actors.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No actors yet
          </h3>
          <p className="text-slate-600 mb-4">
            Start by importing actors from the DPI Summit site or adding them manually.
          </p>
          <Link
            href="/import"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import Actors
          </Link>
        </div>
      )}
    </div>
  );
}
