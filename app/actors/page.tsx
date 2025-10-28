'use client';

import { useState } from 'react';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { Plus, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddActorModal from '@/components/AddActorModal';

type Actor = {
  id: string;
  name: string;
  sector: string;
  inclusionScore: number;
  followupScore: number;
  spokenTo: boolean;
  motive: string;
  pitch: string;
  contactName: string;
  contactRole: string;
  booth?: string;
  notes: string;
  nextAction: string;
  buckets: string[];
  publications?: string[];
  eventsAppeared?: string[];
  interestTopics?: string[];
  roleInEcosystem?: string;
  wantsNeeds?: string;
  engagementStrategy?: string;
  leverageForAI4Inclusion?: string;
  summitContext?: string;
  summitSourceTags?: string[];
};

export default function ActorsPage() {
  const { actors, isHydrated } = useFieldbookStore();
  const [showModal, setShowModal] = useState(false);
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [minFollowupScore, setMinFollowupScore] = useState(0);
  const [showNotSpokenOnly, setShowNotSpokenOnly] = useState(false);

  if (!isHydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const sectors = Array.from(new Set(actors.map(a => a.sector)));

  const filteredActors = actors.filter(actor => {
    if (sectorFilter !== 'all' && actor.sector !== sectorFilter) return false;
    if (actor.followupScore < minFollowupScore) return false;
    if (showNotSpokenOnly && actor.spokenTo) return false;
    return true;
  });

  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      Government: 'bg-blue-100 text-blue-800',
      Multilateral: 'bg-purple-100 text-purple-800',
      Funder: 'bg-orange-100 text-orange-800',
      Research: 'bg-green-100 text-green-800',
      NGO: 'bg-pink-100 text-pink-800',
      Corporate: 'bg-cyan-100 text-cyan-800',
    };
    return colors[sector] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Actors</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Actor
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">Sector</label>
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sectors</option>
              {sectors.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">
              Min Follow-up Score: {minFollowupScore}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={minFollowupScore}
              onChange={e => setMinFollowupScore(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notSpoken"
              checked={showNotSpokenOnly}
              onChange={e => setShowNotSpokenOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="notSpoken" className="text-sm text-slate-600">
              Not spoken yet
            </label>
          </div>
        </div>

        {(sectorFilter !== 'all' || minFollowupScore > 0 || showNotSpokenOnly) && (
          <button
            onClick={() => {
              setSectorFilter('all');
              setMinFollowupScore(0);
              setShowNotSpokenOnly(false);
            }}
            className="mt-4 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredActors.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <p className="text-slate-600">
              {actors.length === 0
                ? 'No actors yet. Add your first actor!'
                : 'No actors match your filters.'}
            </p>
          </div>
        ) : (
          filteredActors.map(actor => (
            <Link
              key={actor.id}
              href={`/actors/${actor.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3 flex-1">
                  {actor.profileImage && (
                    <img
                      src={actor.profileImage}
                      alt={actor.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {actor.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSectorColor(actor.sector)}`}
                      >
                        {actor.sector}
                      </span>
                      {actor.spokenTo && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          ✓ Spoken
                        </span>
                      )}
                    </div>
                    {actor.booth && (
                      <p className="text-sm text-slate-600 mb-1">Booth: {actor.booth}</p>
                    )}
                    {actor.notes && (
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {actor.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-blue-600">
                    {actor.followupScore}
                  </div>
                  <div className="text-sm text-slate-500">Follow-up</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {showModal && <AddActorModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

