'use client';

import COSSPitches from '@/components/COSSPitches';
import Link from 'next/link';

export default function COSSPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">COSS — Center for Open Societal Systems</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Pitches</h2>
        <COSSPitches />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Deck</h2>
        <p className="text-slate-700 mb-3">View the COSS deck converted from PPTX:</p>
        <div className="flex gap-3">
          <Link href="/decks/coss" className="text-blue-600 hover:underline">Open HTML deck →</Link>
          <a href="/251021_COSS%20What%20We%20Do;%20and%20How.pptx" className="text-slate-600 hover:underline">Download PPTX</a>
        </div>
      </div>
    </div>
  );
}


