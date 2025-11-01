'use client';

import { useEffect, useMemo, useState } from 'react';
import { Session, topSessionsPerDay } from '@/lib/prioritizeSessions';

type ApiResponse = { sessions?: Session[] };

export default function TopSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sessions', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((data: ApiResponse | null) => {
        if (cancelled) return;
        if (data?.sessions) {
          setSessions(data.sessions);
          const uniq = Array.from(new Set(data.sessions.map(s => s.day).filter(Boolean) as string[])).sort();
          setDays(uniq);
        } else {
          setError('No sessions found');
        }
      })
      .catch(() => !cancelled && setError('Failed to load sessions'));
    return () => { cancelled = true; };
  }, []);

  const topByDay = useMemo(() => {
    const map: Record<string, Session[]> = {};
    days.forEach(day => {
      map[day] = topSessionsPerDay(sessions, day, { topicRelevance: 0.5, speakerOrgFit: 0.3, conflictPenalty: 0.2 });
    });
    return map;
  }, [sessions, days]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Top 3 Sessions per Day (AI4Inclusion)</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4 text-sm">{error}</div>
      )}
      {days.length === 0 && !error && (
        <div className="text-slate-600">Loading sessions...</div>
      )}
      <div className="space-y-6">
        {days.map(day => (
          <div key={day} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">{day}</h2>
            <ol className="list-decimal list-inside space-y-2">
              {(topByDay[day] || []).map(s => (
                <li key={s.id} className="text-slate-900">
                  <div className="font-medium">
                    {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{s.title}</a> : s.title}
                  </div>
                  {s.speakers && s.speakers.length > 0 && (
                    <div className="text-sm text-slate-600">Speakers: {s.speakers.join(', ')}</div>
                  )}
                  {s.organizations && s.organizations.length > 0 && (
                    <div className="text-sm text-slate-600">Orgs: {s.organizations.join(', ')}</div>
                  )}
                  {s.start && (
                    <div className="text-xs text-slate-500">{new Date(s.start).toLocaleString()}</div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}


