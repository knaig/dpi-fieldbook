'use client';

import { use } from 'react';
import { useParams } from 'next/navigation';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { ArrowLeft, Edit2, Save, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ActorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { getActor, updateActor, mergeActorIntelligence, isHydrated } =
    useFieldbookStore();
  const actor = getActor(id);
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(actor?.notes || '');
  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrich = async () => {
    if (!actor) return;
    setIsEnriching(true);
    try {
      const res = await fetch(`/api/enrichActor?id=${actor.id}`);
      const data = await res.json();
      mergeActorIntelligence(id, data);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to enrich profile');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSaveNotes = () => {
    updateActor(id, { notes: localNotes });
    setIsEditing(false);
    toast.success('Notes saved');
  };

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-600 mb-4">Actor not found</p>
          <Link
            href="/actors"
            className="text-blue-600 hover:underline"
          >
            Back to Actors
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/actors"
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Actors
      </Link>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{actor.name}</h1>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getSectorColor(actor.sector)}`}
              >
                {actor.sector}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Score: {actor.followupScore}
              </span>
              {actor.spokenTo && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Spoken
                </span>
              )}
            </div>
          </div>
          {actor.booth && (
            <div className="text-right">
              <p className="text-sm text-slate-600">Booth</p>
              <p className="text-lg font-semibold text-slate-900">{actor.booth}</p>
            </div>
          )}
        </div>

        {actor.summitContext && (
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-1">Summit Context</p>
            <p className="text-slate-900">{actor.summitContext}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">My Notes</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setLocalNotes(actor.notes);
                }}
                className="px-3 py-1 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={localNotes}
            onChange={e => setLocalNotes(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="text-slate-700 whitespace-pre-wrap min-h-[200px]">
            {actor.notes || 'No notes yet. Click Edit to add notes.'}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Intelligence Profile
          </h2>
          <button
            onClick={handleEnrich}
            disabled={isEnriching}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isEnriching ? 'animate-spin' : ''}`}
            />
            {isEnriching ? 'Enriching...' : 'Enrich / Refresh Profile'}
          </button>
        </div>

        <div className="space-y-4">
          {actor.roleInEcosystem && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Role in Ecosystem
              </h3>
              <p className="text-slate-900">{actor.roleInEcosystem}</p>
            </div>
          )}

          {actor.wantsNeeds && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Wants & Needs
              </h3>
              <p className="text-slate-900">{actor.wantsNeeds}</p>
            </div>
          )}

          {actor.engagementStrategy && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Engagement Strategy
              </h3>
              <p className="text-slate-900">{actor.engagementStrategy}</p>
            </div>
          )}

          {actor.leverageForAI4Inclusion && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Leverage for AI4Inclusion
              </h3>
              <p className="text-slate-900">{actor.leverageForAI4Inclusion}</p>
            </div>
          )}

          {actor.interestTopics && actor.interestTopics.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Interest Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {actor.interestTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {actor.publications && actor.publications.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Publications
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {actor.publications.map((pub, i) => (
                  <li key={i} className="text-slate-900">
                    {pub}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actor.eventsAppeared && actor.eventsAppeared.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Events Appeared
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {actor.eventsAppeared.map((event, i) => (
                  <li key={i} className="text-slate-900">
                    {event}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(!actor.roleInEcosystem &&
            !actor.wantsNeeds &&
            !actor.engagementStrategy &&
            !actor.leverageForAI4Inclusion) && (
            <p className="text-slate-500 text-center py-8">
              No intelligence data yet. Click "Enrich / Refresh Profile" to fetch data.
            </p>
          )}
        </div>
      </div>

      {actor.nextAction && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Next Action</h3>
          <p className="text-blue-800">{actor.nextAction}</p>
        </div>
      )}
    </div>
  );
}

