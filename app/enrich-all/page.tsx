'use client';

import { useState } from 'react';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';

export default function EnrichAllPage() {
  const { actors, isHydrated, mergeActorIntelligence } = useFieldbookStore();
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleEnrichAll = async () => {
    if (!actors || actors.length === 0) {
      toast.error('No actors to enrich');
      return;
    }

    setIsEnriching(true);
    setProgress({ current: 0, total: actors.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      setProgress({ current: i + 1, total: actors.length });

      try {
        console.log(`Enriching ${i + 1}/${actors.length}: ${actor.name}`);
        
        const response = await fetch(
          `/api/enrichActor?name=${encodeURIComponent(actor.name)}&role=${encodeURIComponent(actor.contactRole)}&sector=${encodeURIComponent(actor.sector)}&context=${encodeURIComponent(actor.summitContext || '')}`
        );

        if (response.ok) {
          const intelligence = await response.json();
          mergeActorIntelligence(actor.id, intelligence);
          successCount++;
          console.log(`✓ Enriched: ${actor.name}`);
        } else {
          failCount++;
          console.error(`✗ Failed: ${actor.name}`);
        }
      } catch (error) {
        failCount++;
        console.error(`Error enriching ${actor.name}:`, error);
      }

      // Rate limiting - wait 2 seconds between enrichments
      if (i < actors.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsEnriching(false);
    toast.success(`Enrichment complete: ${successCount} successful, ${failCount} failed`);
  };

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Enrich All Actors
      </h1>
      
      <p className="text-slate-600 mb-8">
        Pull LinkedIn and X profiles, publications, and images for all {actors.length} actors.
        This will take approximately {Math.ceil(actors.length * 2)} seconds.
      </p>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        {isEnriching ? (
          <div className="text-center">
            <RefreshCw className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-lg font-semibold text-slate-900 mb-2">
              Enriching actors...
            </p>
            <p className="text-sm text-slate-600 mb-4">
              {progress.current} / {progress.total} complete
            </p>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Enriching {actors[progress.current - 1]?.name}...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-slate-700 mb-6">
              Ready to enrich {actors.length} actors with:
            </p>
            <ul className="text-left space-y-2 mb-8 max-w-md mx-auto">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>OpenAI intelligence extraction</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>LinkedIn profile data</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>X/Twitter profile links</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Profile images</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Publications from Google Scholar</span>
              </li>
            </ul>
            
            <button
              onClick={handleEnrichAll}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold transition-colors"
            >
              Start Enriching All Actors
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">What gets enriched:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Intelligence:</p>
            <ul className="space-y-1 text-slate-600">
              <li>• Role in ecosystem</li>
              <li>• Interest topics</li>
              <li>• Wants & needs</li>
              <li>• Engagement strategy</li>
              <li>• Leverage for AI4Inclusion</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-900 mb-2">Social:</p>
            <ul className="space-y-1 text-slate-600">
              <li>• LinkedIn profile URL</li>
              <li>• X/Twitter handle</li>
              <li>• DPI-related posts</li>
              <li>• Recent activity</li>
              <li>• Profile images</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

