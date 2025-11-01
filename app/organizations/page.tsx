'use client';

import { useState, useMemo } from 'react';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { Building2, Users, TrendingUp, Award, MapPin, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Organization name normalization and alias mapping
function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map(w => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
function canonicalizeOrgName(raw: string): string {
  const cleaned = titleCase(normalizeWhitespace(raw || ''));
  const key = cleaned.toLowerCase();
  // COSS aliases
  const cossAliases = new Set([
    'coss',
    'center for open societal systems',
    'centre for open societal systems',
    'coss - center for open societal systems',
    'coss center for open societal systems',
  ]);
  if (cossAliases.has(key)) return 'COSS';
  return cleaned || 'Unknown Organization';
}

type OrganizationData = {
  name: string;
  members: any[];
  avgFollowupScore: number;
  avgInclusionScore: number;
  sectors: string[];
  countries: string[];
};

function isSpeakerMember(m: any): boolean {
  const tags: string[] = (m?.summitSourceTags ?? []) as any;
  if (Array.isArray(tags) && tags.some(t => String(t).toLowerCase() === 'speaker')) return true;
  if (m?.isSpeaker === true) return true;
  // Heuristic in role/title
  const role = `${m?.contactRole ?? ''} ${m?.title ?? ''}`.toLowerCase();
  return role.includes('speaker');
}

export default function OrganizationsPage() {
  const { actors, isHydrated } = useFieldbookStore();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'avgFollowup' | 'avgInclusion'>('members');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [speakersOnly, setSpeakersOnly] = useState(false);

  // Group actors by organization - ALL HOOKS MUST BE BEFORE EARLY RETURNS
  const organizations = useMemo(() => {
    if (!isHydrated || !actors.length) return [] as OrganizationData[];

    const orgMap = new Map<string, any[]>();

    actors.forEach(actor => {
      const rawName = (actor as any).summitCompany || 'Unknown Organization';
      const orgName = canonicalizeOrgName(String(rawName));
      if (!orgMap.has(orgName)) {
        orgMap.set(orgName, []);
      }
      orgMap.get(orgName)!.push(actor);
    });

    const orgData: OrganizationData[] = Array.from(orgMap.entries()).map(([name, members]) => {
      const avgFollowup = members.reduce((sum, m) => sum + (Number(m.followupScore) || 0), 0) / Math.max(members.length, 1);
      const avgInclusion = members.reduce((sum, m) => sum + (Number(m.inclusionScore) || 0), 0) / Math.max(members.length, 1);
      const sectors = Array.from(new Set(members.map(m => m.sector)));
      const countries = Array.from(
        new Set(members.map(m => (m as any).summitCountry || (m as any).country).filter(Boolean))
      );

      return {
        name,
        members,
        avgFollowupScore: Number.isFinite(avgFollowup) ? Math.round(avgFollowup * 10) / 10 : 0,
        avgInclusionScore: Number.isFinite(avgInclusion) ? Math.round(avgInclusion * 10) / 10 : 0,
        sectors,
        countries,
      };
    });

    return orgData;
  }, [actors, isHydrated]);

  // Filter organizations
  const filteredOrgs = useMemo(() => {
    let filtered = organizations;

    // Search (match on canonicalized name too)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(org => {
        const nameMatch = org.name.toLowerCase().includes(q);
        const aliasMatch =
          (org.name === 'COSS' && ['coss', 'center for open societal systems', 'centre for open societal systems'].some(a => a.includes(q))) ||
          false;
        return nameMatch || aliasMatch;
      });
    }

    // Speakers-only filter
    if (speakersOnly) {
      filtered = filtered.filter(org => org.members.some(m => isSpeakerMember(m)));
    }

    // Sector filter
    if (sectorFilter !== 'all') {
      filtered = filtered.filter(org => org.sectors.includes(sectorFilter));
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'members':
          comparison = a.members.length - b.members.length;
          break;
        case 'avgFollowup':
          comparison = a.avgFollowupScore - b.avgFollowupScore;
          break;
        case 'avgInclusion':
          comparison = a.avgInclusionScore - b.avgInclusionScore;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [organizations, searchQuery, sectorFilter, sortBy, sortOrder, speakersOnly]);

  const sectors = useMemo(() => {
    if (!organizations.length) return [] as string[];
    const sectorSet = new Set<string>();
    organizations.forEach(org => org.sectors.forEach(s => sectorSet.add(s)));
    return Array.from(sectorSet).sort();
  }, [organizations]);

  const handleOrgClick = (orgName: string) => {
    router.push(`/organizations/${encodeURIComponent(orgName)}`);
  };

  // Early return AFTER all hooks
  if (!isHydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-20 sm:pb-24">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Organizations</h1>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search organizations..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sector</label>
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Sectors</option>
              {sectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="members">Member Count</option>
                <option value="name">Name</option>
                <option value="avgFollowup">Avg Follow-up</option>
                <option value="avgInclusion">Avg Inclusion</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Speakers</label>
            <div className="flex items-center gap-2 h-[38px]">
              <input id="speakersOnly" type="checkbox" checked={speakersOnly} onChange={e => setSpeakersOnly(e.target.checked)} />
              <label htmlFor="speakersOnly" className="text-sm text-slate-700">Speakers only</label>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold">{filteredOrgs.length}</span> of{' '}
          <span className="font-semibold">{organizations.length}</span> organizations
        </p>
      </div>

      {/* Organization Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredOrgs.map(org => (
          <button
            key={org.name}
            onClick={() => handleOrgClick(org.name)}
            className="text-left bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-lg active:shadow-md transition-all touch-manipulation"
          >
            <div className="flex items-start gap-3 mb-3">
              <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{org.name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>{org.members.length} member{org.members.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-slate-600">Follow-up:</span>
                <span className="font-semibold text-blue-600">{org.avgFollowupScore}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-slate-600">Inclusion:</span>
                <span className="font-semibold text-green-600">{org.avgInclusionScore}</span>
              </div>
            </div>

            {org.sectors.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {org.sectors.slice(0, 2).map(sector => (
                    <span
                      key={sector}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                    >
                      {sector}
                    </span>
                  ))}
                  {org.sectors.length > 2 && (
                    <span className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded">
                      +{org.sectors.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}

            {org.countries.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{org.countries.slice(0, 2).join(', ')}</span>
                {org.countries.length > 2 && <span>+{org.countries.length - 2}</span>}
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredOrgs.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No organizations found</p>
        </div>
      )}
    </div>
  );
}

