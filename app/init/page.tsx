'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useFieldbookStore } from '@/lib/useFieldbookStore';

export default function InitPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { addActor, isHydrated } = useFieldbookStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isComplete && !isImporting) {
      handleImport();
    }
  }, [isHydrated, isComplete, isImporting]);

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
        setIsComplete(true);
        setTimeout(() => router.push('/actors'), 2000);
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

  if (isComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-12">
          <h1 className="text-3xl font-bold text-green-900 mb-4">✓ Import Complete!</h1>
          <p className="text-lg text-green-700 mb-6">42 actors imported successfully</p>
          <p className="text-sm text-slate-600">Redirecting to Actors page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Initialize DPI Summit 2025 Fieldbook
      </h1>
      
      <p className="text-slate-600 mb-8">
        Importing 42 confirmed and likely speakers from the DPI Summit 2025
      </p>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-900">Importing actors...</p>
          <p className="text-sm text-slate-500 mt-2">This will only take a moment</p>
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

