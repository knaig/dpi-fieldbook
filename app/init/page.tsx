'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useFieldbookStore } from '@/lib/useFieldbookStore';

export default function InitPage() {
  const [isImporting, setIsImporting] = useState(false);
  const { addActor } = useFieldbookStore();
  const router = useRouter();

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await fetch('/api/importActors');
      const data = await res.json();
      
      if (data.success && data.actors) {
        // Add each actor to the store
        for (const actor of data.actors) {
          addActor({
            name: actor.name,
            sector: actor.sector,
            motive: actor.summitContext || '',
            pitch: '',
            inclusionScore: actor.inclusionScore,
            followupScore: actor.followupScore,
            spokenTo: false,
            contactName: actor.contactName,
            contactRole: actor.contactRole,
            notes: actor.notes,
            nextAction: actor.nextAction,
            buckets: actor.buckets,
            summitContext: actor.summitContext,
            summitSourceTags: actor.summitSourceTags,
          });
        }
        
        toast.success(`Imported ${data.count} actors successfully!`);
        router.push('/actors');
      } else {
        toast.error('Failed to import actors');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import actors');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Initialize DPI Summit 2025 Fieldbook
      </h1>
      
      <p className="text-slate-600 mb-8">
        Import 42 confirmed and likely speakers from the DPI Summit 2025
      </p>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Actors to Import
          </h2>
          <ul className="text-left text-sm text-slate-600 space-y-2 mb-6 max-h-96 overflow-y-auto">
            <li>H.E. Mr. Solly Malatsi (Government)</li>
            <li>Halima Letamo (Multilateral)</li>
            <li>Pramod Varma (Government)</li>
            <li>Nandan Nilekani (Corporate)</li>
            <li>David Hutchison (Multilateral)</li>
            <li>... and 37 more</li>
          </ul>
        </div>

        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-lg font-semibold transition-colors"
        >
          {isImporting ? 'Importing...' : 'Import All 42 Actors'}
        </button>
      </div>

      <div className="mt-6 text-sm text-slate-500">
        <p>This will populate your fieldbook with DPI Summit 2025 attendees including:</p>
        <p className="mt-2">Governments • Multilaterals • Funders • Technology • Researchers</p>
      </div>
    </div>
  );
}

