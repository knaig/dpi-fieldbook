'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useFieldbookStore } from '@/lib/useFieldbookStore';

export default function ClearAndImportPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const { addActor, isHydrated } = useFieldbookStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !hasRun && !isImporting) {
      setHasRun(true);
      handleClearAndImport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const handleClearAndImport = async () => {
    if (isImporting) return;
    setIsImporting(true);
    
    try {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dpi-fieldbook-actors');
        console.log('✓ Cleared localStorage');
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load all actors from storage.json
      const storageRes = await fetch('/storage.json');
      const storageData = await storageRes.json();
      
      const allActors = Object.values(storageData);
      
      const data = {
        success: true,
        actors: allActors,
        count: allActors.length
      };
      
      if (data.success && data.actors) {
        console.log(`Importing ${data.actors.length} actors...`);
        
        // Add each actor to the store
        for (const actor of data.actors as any[]) {
          addActor({
            id: actor.id,
            name: actor.name,
            sector: actor.sector,
            motive: actor.motive || '',
            pitch: actor.pitch || '',
            inclusionScore: actor.inclusionScore,
            followupScore: actor.followupScore,
            spokenTo: false,
            contactName: actor.contactName,
            contactRole: actor.contactRole,
            notes: actor.notes || '',
            nextAction: actor.nextAction || '',
            buckets: actor.buckets || [],
            summitContext: actor.summitContext,
            summitSourceTags: actor.summitSourceTags || [],
          });
        }
        
        toast.success(`✓ Imported ${data.count} actors successfully!`);
        setTimeout(() => router.push('/actors'), 1500);
      } else {
        toast.error('Failed to import actors');
        setIsImporting(false);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import actors');
      setIsImporting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Clear & Re-import Actors
      </h1>
      
      <p className="text-slate-600 mb-8">
        This will clear all current actors and import fresh data for all DPI Summit attendees (140+ actors).
      </p>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <button
          onClick={handleClearAndImport}
          disabled={isImporting}
          className="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-lg font-semibold transition-colors"
        >
          {isImporting ? 'Clearing & Importing...' : 'Clear All & Import Fresh'}
        </button>
      </div>

      <div className="mt-6 text-sm text-slate-500">
        <p>⚠️ This will replace all current actors with fresh data</p>
      </div>
    </div>
  );
}

