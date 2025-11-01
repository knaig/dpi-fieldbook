'use client';

import { useEffect, useState } from 'react';

type Pitches = {
  pitch10?: string;
  pitch30?: string;
  pitch60?: string;
};

export default function COSSPitches() {
  const [pitches, setPitches] = useState<Pitches | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/decks/coss/pitches.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) setPitches(data);
      })
      .catch(() => {
        if (!cancelled) setError('');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!pitches) {
    return (
      <div className="text-slate-600 text-sm">
        Upload pitches at <code className="text-xs">public/decks/coss/pitches.json</code> to display 10/30/60 sec summaries.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pitches.pitch10 && (
        <div>
          <p className="text-xs text-slate-500 mb-1">10-second pitch</p>
          <p className="text-slate-900">{pitches.pitch10}</p>
        </div>
      )}
      {pitches.pitch30 && (
        <div>
          <p className="text-xs text-slate-500 mb-1">30-second pitch</p>
          <p className="text-slate-900">{pitches.pitch30}</p>
        </div>
      )}
      {pitches.pitch60 && (
        <div>
          <p className="text-xs text-slate-500 mb-1">60-second pitch</p>
          <p className="text-slate-900">{pitches.pitch60}</p>
        </div>
      )}
    </div>
  );
}


