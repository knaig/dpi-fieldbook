'use client';

import Link from 'next/link';

export default function COSSDeckPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">COSS Deck</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="aspect-[16/9] w-full">
          <iframe
            src="/decks/coss/index.html"
            className="w-full h-full rounded-xl"
            title="COSS Deck"
          />
        </div>
        <div className="p-4 text-sm text-slate-600">
          If the deck doesn't load, place the converted HTML at <code>/public/decks/coss/index.html</code>.
        </div>
      </div>
      <div className="mt-4">
        <Link href="/coss" className="text-blue-600 hover:underline">← Back to COSS page</Link>
      </div>
    </div>
  );
}


