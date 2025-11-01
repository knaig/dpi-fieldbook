'use client';

import { use, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { ArrowLeft, Edit2, Save, RefreshCw, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ActorChatbot from '@/components/ActorChatbot';

export default function ActorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { getActor, updateActor, mergeActorIntelligence, isHydrated } =
    useFieldbookStore();
  const actor = getActor(id);
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(actor?.notes || '');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);

  // Auto-save with debounce
  useEffect(() => {
    if (!isEditing || !localNotes) return;
    
    const timeoutId = setTimeout(() => {
      if (localNotes !== actor?.notes) {
        setIsSaving(true);
        updateActor(id, { notes: localNotes });
        setLastSaved(new Date());
        setIsSaving(false);
        toast.success('Notes auto-saved', { duration: 2000 });
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [localNotes, isEditing, actor?.notes, id, updateActor]);

  const handleEnrich = async () => {
    if (!actor) return;
    setIsEnriching(true);
    try {
      const res = await fetch(
        `/api/enrichActor?id=${actor.id}&name=${encodeURIComponent(actor.name)}&role=${encodeURIComponent(actor.contactRole)}&sector=${encodeURIComponent(actor.sector)}&context=${encodeURIComponent(actor.summitContext || '')}`
      );
      const data = await res.json();
      
      // Log what we got
      console.log('Enrichment result:', data);
      
      // Merge ALL fields including LinkedIn and X
      mergeActorIntelligence(id, data);
      
      toast.success('Profile updated with intelligence + LinkedIn + X');
    } catch (error) {
      console.error('Enrichment error:', error);
      toast.error('Failed to enrich profile');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSaveNotes = () => {
    updateActor(id, { notes: localNotes });
    setIsEditing(false);
    setLastSaved(new Date());
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <Link
        href="/actors"
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 active:text-slate-900 mb-4 sm:mb-6 touch-manipulation"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm sm:text-base">Back to Actors</span>
      </Link>

      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            {actor.profileImage && (
              <img
                src={actor.profileImage}
                alt={actor.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 break-words">{actor.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getSectorColor(actor.sector)}`}
                >
                  {actor.sector}
                </span>
                <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                  Score: {actor.followupScore}
                </span>
                {actor.spokenTo && (
                  <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                    ✓ Spoken
                  </span>
                )}
              </div>
            </div>
          </div>
          {actor.booth && (
            <div className="text-right sm:text-left sm:ml-4">
              <p className="text-xs sm:text-sm text-slate-600">Booth</p>
              <p className="text-base sm:text-lg font-semibold text-slate-900">{actor.booth}</p>
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

      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">My Notes</h2>
            {isEditing && (isSaving || lastSaved) && (
              <p className="text-xs text-slate-500 mt-1">
                {isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
              </p>
            )}
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg touch-manipulation"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 touch-manipulation"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setLocalNotes(actor.notes);
                }}
                className="px-3 sm:px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 touch-manipulation"
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

      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            Intelligence Profile
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowChatbot(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with AI</span>
            </button>
            <button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors touch-manipulation text-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${isEnriching ? 'animate-spin' : ''}`}
              />
              <span>{isEnriching ? 'Enriching...' : 'Enrich / Refresh'}</span>
            </button>
          </div>
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

          {/* Case Studies */}
          {(actor as any).caseStudies && (actor as any).caseStudies.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Recent Case Studies
              </h3>
              <div className="space-y-4">
                {(actor as any).caseStudies.map((study: any, i: number) => (
                  <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-900 mb-2">{study.title}</h4>
                    <p className="text-sm text-slate-700 mb-3">{study.description}</p>
                    {study.impact && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                          🎯 Impact: {study.impact}
                        </span>
                      </div>
                    )}
                    {study.stakeholders && study.stakeholders.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-1">Stakeholders:</p>
                        <div className="flex flex-wrap gap-1">
                          {study.stakeholders.map((stakeholder: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                            >
                              {stakeholder}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {study.year && (
                      <p className="text-xs text-slate-400 mt-2">{study.year}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW FIELDS - Recent Projects */}
          {(actor as any).recentProjects && (actor as any).recentProjects.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Recent Projects
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {(actor as any).recentProjects.map((project: string, i: number) => (
                  <li key={i} className="text-slate-900">
                    {project}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Initiatives */}
          {(actor as any).keyInitiatives && (actor as any).keyInitiatives.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Key Initiatives
              </h3>
              <div className="flex flex-wrap gap-2">
                {(actor as any).keyInitiatives.map((initiative: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    {initiative}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Potential Partnership Areas */}
          {(actor as any).potentialPartnershipAreas && (actor as any).potentialPartnershipAreas.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Potential Partnership Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {(actor as any).potentialPartnershipAreas.map((area: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Focus */}
          {(actor as any).currentFocus && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Current Focus
              </h3>
              <p className="text-slate-900">{(actor as any).currentFocus}</p>
            </div>
          )}

          {/* Pain Points */}
          {(actor as any).painPoints && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Pain Points
              </h3>
              <p className="text-slate-900">{(actor as any).painPoints}</p>
            </div>
          )}

          {/* Expertise Areas */}
          {(actor as any).expertiseAreas && (actor as any).expertiseAreas.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Expertise Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {(actor as any).expertiseAreas.map((area: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Speaking Topics */}
          {(actor as any).speakingTopics && (actor as any).speakingTopics.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Speaking Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {(actor as any).speakingTopics.map((topic: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent News or Achievements */}
          {(actor as any).recentNewsOrAchievements && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Recent News or Achievements
              </h3>
              <p className="text-slate-900">{(actor as any).recentNewsOrAchievements}</p>
            </div>
          )}

          {/* Relevant Quotes */}
          {(actor as any).relevantQuotes && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Relevant Quotes
              </h3>
              <div className="bg-slate-50 border-l-4 border-slate-400 p-4 italic text-slate-700">
                "{(actor as any).relevantQuotes}"
              </div>
            </div>
          )}

          {/* Network Context */}
          {(actor as any).networkContext && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">
                Network Context
              </h3>
              <p className="text-slate-900">{(actor as any).networkContext}</p>
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

      {(actor.linkedinUrl || actor.xProfileUrl) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Social Profiles
          </h2>
          
          <div className="space-y-3">
            {actor.linkedinUrl && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">in</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">LinkedIn</p>
                    {actor.linkedinHeadline && (
                      <p className="text-sm text-slate-600">{actor.linkedinHeadline}</p>
                    )}
                  </div>
                </div>
                <a
                  href={actor.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View →
                </a>
              </div>
            )}

            {actor.xProfileUrl && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">𝕏</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {actor.xHandle ? `@${actor.xHandle}` : 'X/Twitter'}
                    </p>
                    {actor.recentTweets && actor.recentTweets.length > 0 && (
                      <p className="text-sm text-slate-600">
                        {actor.recentTweets.length} recent mentions
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={actor.xProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View →
                </a>
              </div>
            )}

            {actor.dpiTweets && actor.dpiTweets.length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm font-medium text-purple-900 mb-2">
                  DPI-Related Posts ({actor.dpiTweets.length})
                </p>
                <div className="space-y-2">
                  {actor.dpiTweets.slice(0, 3).map((tweet, i) => (
                    <a
                      key={i}
                      href={tweet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-purple-700 hover:text-purple-800"
                    >
                      View post →
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {actor.nextAction && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Next Action</h3>
          <p className="text-blue-800">{actor.nextAction}</p>
        </div>
      )}

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <ActorChatbot actor={actor} onClose={() => setShowChatbot(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

