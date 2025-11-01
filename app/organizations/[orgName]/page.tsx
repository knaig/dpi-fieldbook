'use client';

import { useParams } from 'next/navigation';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { Building2, Users, ArrowLeft, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import COSSPitches from '@/components/COSSPitches';

export default function OrganizationDetailPage() {
  const params = useParams();
  const orgName = decodeURIComponent(params.orgName as string);
  const { actors, isHydrated } = useFieldbookStore();
  const [sortBy, setSortBy] = useState<'name' | 'followup' | 'inclusion'>('followup');
  const [speakersOnly, setSpeakersOnly] = useState(false);

  const orgMembers = useMemo(() => {
    const members = actors
      .filter(actor => (actor as any).summitCompany === orgName)
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'followup') return (Number(b.followupScore) || 0) - (Number(a.followupScore) || 0);
        return (Number(b.inclusionScore) || 0) - (Number(a.inclusionScore) || 0);
      });
    if (speakersOnly) {
      return members.filter(m => {
        const tags: any[] = (((m as any).summitSourceTags) ?? []) as any[];
        if (Array.isArray(tags) && tags.some(t => String(t).toLowerCase() === 'speaker')) return true;
        if ((m as any).isSpeaker === true) return true;
        const role = `${(m as any).contactRole ?? ''} ${(m as any).title ?? ''}`.toLowerCase();
        return role.includes('speaker');
      });
    }
    return members;
  }, [actors, orgName, sortBy, speakersOnly]);

  const stats = useMemo(() => {
    if (orgMembers.length === 0) return null;
    const avgFollowup = orgMembers.reduce((sum, m) => sum + (Number(m.followupScore) || 0), 0) / Math.max(orgMembers.length, 1);
    const avgInclusion = orgMembers.reduce((sum, m) => sum + (Number(m.inclusionScore) || 0), 0) / Math.max(orgMembers.length, 1);
    const sectors = Array.from(new Set(orgMembers.map(m => m.sector)));
    return { avgFollowup, avgInclusion, sectors };
  }, [orgMembers]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      {!isHydrated && (
        <div className="mb-6 text-slate-600">Loading...</div>
      )}
      <Link
        href="/organizations"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizations
      </Link>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{orgName}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{orgMembers.length} member{orgMembers.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500 mb-1">Avg Follow-up Score</p>
              <p className="text-lg font-semibold text-blue-600">{Number.isFinite(stats.avgFollowup) ? stats.avgFollowup.toFixed(1) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Avg Inclusion Score</p>
              <p className="text-lg font-semibold text-green-600">{Number.isFinite(stats.avgInclusion) ? stats.avgInclusion.toFixed(1) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Sectors</p>
              <p className="text-lg font-semibold text-slate-900">{stats.sectors.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Members</p>
              <p className="text-lg font-semibold text-slate-900">{orgMembers.length}</p>
            </div>
          </div>
        )}

        {/* COSS-specific content */}
        {orgName === 'COSS' && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">COSS Pitches</h2>
              <Link href="/coss" className="text-blue-600 hover:underline">Open page →</Link>
            </div>
            <COSSPitches />
            <div className="mt-4">
              <Link href="/decks/coss" className="text-blue-600 hover:underline">View deck →</Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Members</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={speakersOnly} onChange={e => setSpeakersOnly(e.target.checked)} />
            Speakers only
          </label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="followup">Sort by Follow-up</option>
            <option value="inclusion">Sort by Inclusion</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgMembers.map(actor => (
          <Link
            key={actor.id}
            href={`/actors/${actor.id}`}
            className="block bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            {actor.profileImage && (
              <img
                src={actor.profileImage}
                alt={actor.name}
                className="w-16 h-16 rounded-full object-cover mb-3"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <h3 className="font-semibold text-slate-900 mb-1">{actor.name}</h3>
            {actor.contactRole && (
              <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                <Briefcase className="w-3 h-3" />
                <span>{actor.contactRole}</span>
              </div>
            )}
            <div className="flex gap-3 text-sm">
              <span className="text-blue-600 font-semibold">Follow-up: {actor.followupScore}</span>
              <span className="text-green-600 font-semibold">Inclusion: {actor.inclusionScore}</span>
            </div>
          </Link>
        ))}
      </div>

      {orgMembers.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-600">No members found for this organization</p>
        </div>
      )}
    </div>
  );
}

