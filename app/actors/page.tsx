'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { Plus, Filter, X, MapPin, Building2, TrendingUp, MessageCircle, Briefcase, Award, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddActorModal from '@/components/AddActorModal';

type Actor = {
  id: string;
  name: string;
  sector: string;
  inclusionScore: number;
  followupScore: number;
  spokenTo: boolean;
  motive: string;
  pitch: string;
  contactName: string;
  contactRole: string;
  booth?: string;
  notes: string;
  nextAction: string;
  buckets: string[];
  publications?: string[];
  eventsAppeared?: string[];
  interestTopics?: string[];
  roleInEcosystem?: string;
  wantsNeeds?: string;
  engagementStrategy?: string;
  leverageForAI4Inclusion?: string;
  summitContext?: string;
  summitSourceTags?: string[];
  profileImage?: string;
  linkedinUrl?: string;
  xHandle?: string;
  xProfileUrl?: string;
};

export default function ActorsPage() {
  const { actors, isHydrated } = useFieldbookStore();
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filter states
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [minFollowupScore, setMinFollowupScore] = useState(0);
  const [maxFollowupScore, setMaxFollowupScore] = useState(10);
  const [minInclusionScore, setMinInclusionScore] = useState(0);
  const [maxInclusionScore, setMaxInclusionScore] = useState(10);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [hasCaseStudies, setHasCaseStudies] = useState<boolean | null>(null);
  const [hasLinkedInX, setHasLinkedInX] = useState<boolean | null>(null);
  const [spokenStatus, setSpokenStatus] = useState<string>('all'); // all, spoken, not-spoken
  
  // Pagination
  const ACTORS_PER_PAGE = 24;
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique values for filters - ALL HOOKS MUST BE BEFORE EARLY RETURNS
  const sectors = useMemo(() => {
    if (!isHydrated || !actors.length) return [];
    return Array.from(new Set(actors.map(a => a.sector))).sort();
  }, [actors, isHydrated]);

  const allInterests = useMemo(() => {
    if (!isHydrated || !actors.length) return [];
    const interests = new Set<string>();
    actors.forEach(a => {
      a.interestTopics?.forEach(t => interests.add(t));
    });
    return Array.from(interests).sort();
  }, [actors, isHydrated]);

  const allExpertise = useMemo(() => {
    if (!isHydrated || !actors.length) return [];
    const expertise = new Set<string>();
    actors.forEach(a => {
      a.expertiseAreas?.forEach(e => expertise.add(e));
    });
    return Array.from(expertise).sort();
  }, [actors, isHydrated]);

  const countries = useMemo(() => {
    if (!isHydrated || !actors.length) return [];
    const countrySet = new Set<string>();
    actors.forEach(a => {
      const country = (a as any).summitCountry || (a as any).country;
      if (country) countrySet.add(country);
    });
    return Array.from(countrySet).sort();
  }, [actors, isHydrated]);

  const filteredActors = useMemo(() => {
    if (!isHydrated || !actors.length) return [];
    return actors
      .filter(actor => {
        // Sector filter (multiple)
        if (selectedSectors.length > 0 && !selectedSectors.includes(actor.sector)) return false;
        
        // Score ranges
        if (actor.followupScore < minFollowupScore || actor.followupScore > maxFollowupScore) return false;
        if (actor.inclusionScore < minInclusionScore || actor.inclusionScore > maxInclusionScore) return false;
        
        // Interest topics (any match)
        if (selectedInterests.length > 0) {
          const actorInterests = actor.interestTopics || [];
          if (!selectedInterests.some(interest => actorInterests.includes(interest))) return false;
        }
        
        // Expertise areas (any match)
        if (selectedExpertise.length > 0) {
          const actorExpertise = actor.expertiseAreas || [];
          if (!selectedExpertise.some(exp => actorExpertise.includes(exp))) return false;
        }
        
        // Company search
        const company = (actor as any).summitCompany || '';
        if (companySearch && !company.toLowerCase().includes(companySearch.toLowerCase())) return false;
        
        // Country filter
        const country = (actor as any).summitCountry || (actor as any).country;
        if (countryFilter !== 'all' && country !== countryFilter) return false;
        
        // Case studies
        if (hasCaseStudies === true && (!(actor as any).caseStudies || (actor as any).caseStudies.length === 0)) return false;
        if (hasCaseStudies === false && (actor as any).caseStudies && (actor as any).caseStudies.length > 0) return false;
        
        // LinkedIn/X profiles
        if (hasLinkedInX === true && !actor.linkedinUrl && !actor.xProfileUrl) return false;
        if (hasLinkedInX === false && (actor.linkedinUrl || actor.xProfileUrl)) return false;
        
        // Spoken status
        if (spokenStatus === 'spoken' && !actor.spokenTo) return false;
        if (spokenStatus === 'not-spoken' && actor.spokenTo) return false;
        
        return true;
      })
      .filter((actor, index, self) => 
        // Remove duplicates
      index === self.findIndex(a => a.id === actor.id)
    );
  }, [actors, isHydrated, selectedSectors, minFollowupScore, maxFollowupScore, minInclusionScore, maxInclusionScore, selectedInterests, selectedExpertise, companySearch, countryFilter, hasCaseStudies, hasLinkedInX, spokenStatus]);

  const activeFilterCount = useMemo(() => 
    selectedSectors.length + 
    (minFollowupScore > 0 || maxFollowupScore < 10 ? 1 : 0) +
    (minInclusionScore > 0 || maxInclusionScore < 10 ? 1 : 0) +
    selectedInterests.length +
    selectedExpertise.length +
    (companySearch ? 1 : 0) +
    (countryFilter !== 'all' ? 1 : 0) +
    (hasCaseStudies !== null ? 1 : 0) +
    (hasLinkedInX !== null ? 1 : 0) +
    (spokenStatus !== 'all' ? 1 : 0),
    [selectedSectors, minFollowupScore, maxFollowupScore, minInclusionScore, maxInclusionScore, selectedInterests, selectedExpertise, companySearch, countryFilter, hasCaseStudies, hasLinkedInX, spokenStatus]
  );

  // Paginated actors
  const paginatedActors = useMemo(() => {
    const startIndex = (currentPage - 1) * ACTORS_PER_PAGE;
    const endIndex = startIndex + ACTORS_PER_PAGE;
    return filteredActors.slice(startIndex, endIndex);
  }, [filteredActors, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredActors.length / ACTORS_PER_PAGE);
  }, [filteredActors.length]);

  // Reset to page 1 when filters change and current page is beyond total
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const clearFilters = () => {
    setSelectedSectors([]);
    setMinFollowupScore(0);
    setMaxFollowupScore(10);
    setMinInclusionScore(0);
    setMaxInclusionScore(10);
    setSelectedInterests([]);
    setSelectedExpertise([]);
    setCompanySearch('');
    setCountryFilter('all');
    setHasCaseStudies(null);
    setHasLinkedInX(null);
    setSpokenStatus('all');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Early return AFTER all hooks
  if (!isHydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      Government: 'bg-blue-100 text-blue-800',
      Multilateral: 'bg-purple-100 text-purple-800',
      Funder: 'bg-orange-100 text-orange-800',
      Research: 'bg-green-100 text-green-800',
      NGO: 'bg-pink-100 text-pink-800',
      Corporate: 'bg-cyan-100 text-cyan-800',
    };
    return colors[sector] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Actors</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base touch-manipulation w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Actor
        </button>
      </div>

      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full mb-2 touch-manipulation"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </div>
          {showFilters ? (
            <ChevronUp className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* Sectors - Multiple checkboxes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sectors</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {sectors.map(sector => (
                  <label key={sector} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sector)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedSectors([...selectedSectors, sector]);
                        } else {
                          setSelectedSectors(selectedSectors.filter(s => s !== sector));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-600">{sector}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Score Ranges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Follow-up Score: {minFollowupScore} - {maxFollowupScore}
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={minFollowupScore}
                    onChange={e => setMinFollowupScore(Number(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={maxFollowupScore}
                    onChange={e => setMaxFollowupScore(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Inclusion Score: {minInclusionScore} - {maxInclusionScore}
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={minInclusionScore}
                    onChange={e => setMinInclusionScore(Number(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={maxInclusionScore}
                    onChange={e => setMaxInclusionScore(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Interest Topics */}
            {allInterests.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Interest Topics</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allInterests.map(interest => (
                      <label key={interest} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedInterests.includes(interest)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedInterests([...selectedInterests, interest]);
                            } else {
                              setSelectedInterests(selectedInterests.filter(i => i !== interest));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-600">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expertise Areas */}
            {allExpertise.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Expertise Areas</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allExpertise.map(expertise => (
                      <label key={expertise} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedExpertise.includes(expertise)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedExpertise([...selectedExpertise, expertise]);
                            } else {
                              setSelectedExpertise(selectedExpertise.filter(e => e !== expertise));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-600">{expertise}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Company & Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company/Organization</label>
                <input
                  type="text"
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  placeholder="Search by company..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                <select
                  value={countryFilter}
                  onChange={e => setCountryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Boolean Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Case Studies</label>
                <select
                  value={hasCaseStudies === null ? 'all' : hasCaseStudies ? 'yes' : 'no'}
                  onChange={e => {
                    const val = e.target.value;
                    setHasCaseStudies(val === 'all' ? null : val === 'yes');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">Has Case Studies</option>
                  <option value="no">No Case Studies</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn/X Profile</label>
                <select
                  value={hasLinkedInX === null ? 'all' : hasLinkedInX ? 'yes' : 'no'}
                  onChange={e => {
                    const val = e.target.value;
                    setHasLinkedInX(val === 'all' ? null : val === 'yes');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">Has Profile</option>
                  <option value="no">No Profile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Spoken Status</label>
                <select
                  value={spokenStatus}
                  onChange={e => setSpokenStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All</option>
                  <option value="spoken">Spoken To</option>
                  <option value="not-spoken">Not Spoken</option>
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
                Clear All Filters ({activeFilterCount})
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs sm:text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">
              {filteredActors.length > 0 ? (currentPage - 1) * ACTORS_PER_PAGE + 1 : 0}
            </span>
            {' - '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * ACTORS_PER_PAGE, filteredActors.length)}
            </span>
            {' of '}
            <span className="font-semibold text-slate-900">{filteredActors.length}</span> actors
            {filteredActors.length < actors.length && (
              <span className="text-slate-500 hidden sm:inline"> (filtered from {actors.length} total)</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {paginatedActors.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <p className="text-slate-600">
              {actors.length === 0
                ? 'No actors yet. Add your first actor!'
                : 'No actors match your filters.'}
            </p>
          </div>
        ) : (
          paginatedActors.map(actor => (
            <Link
              key={actor.id}
              href={`/actors/${actor.id}`}
              className="block bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-lg active:shadow-md transition-all overflow-hidden touch-manipulation"
            >
              {/* Card Header with Image */}
              <div className="relative h-24 sm:h-32 bg-gradient-to-br from-blue-50 to-purple-50">
                {actor.profileImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={actor.profileImage}
                      alt={actor.name}
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {!actor.profileImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-300 flex items-center justify-center border-2 sm:border-4 border-white shadow-lg">
                      <Users className="w-8 h-8 sm:w-12 sm:h-12 text-slate-500" />
                    </div>
                  </div>
                )}
                {/* Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getSectorColor(actor.sector)}`}
                  >
                    {actor.sector}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 line-clamp-1">
                  {actor.name}
                </h3>
                
                {actor.contactRole && (
                  <p className="text-xs sm:text-sm text-slate-600 mb-2 flex items-center gap-1 line-clamp-1">
                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{actor.contactRole}</span>
                  </p>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-blue-600">{actor.followupScore}</span>
                    <span className="text-slate-500 hidden sm:inline">Follow-up</span>
                    <span className="text-slate-500 sm:hidden">FU</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                    <span className="font-semibold text-green-600">{actor.inclusionScore}</span>
                    <span className="text-slate-500 hidden sm:inline">Inclusion</span>
                    <span className="text-slate-500 sm:hidden">Inc</span>
                  </div>
                </div>

                {/* Key Info */}
                {actor.interestTopics && actor.interestTopics.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">Interest Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {actor.interestTopics.slice(0, 2).map((topic, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {topic}
                        </span>
                      ))}
                    {actor.interestTopics.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded">
                          +{actor.interestTopics.length - 2} more
                        </span>
                      )}
                    </div>
                    {actor.booth && (
                      <p className="text-sm text-slate-600 mb-1">Booth: {actor.booth}</p>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      {actor.linkedinUrl && (
                        <a
                          href={actor.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                          title="LinkedIn Profile"
                        >
                          <span className="font-bold">in</span>
                        </a>
                      )}
                      {actor.xProfileUrl && (
                        <a
                          href={actor.xProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white rounded text-xs hover:bg-slate-700 transition-colors"
                          title={actor.xHandle ? `@${actor.xHandle}` : 'X Profile'}
                        >
                          <span className="font-bold">𝕏</span>
                        </a>
                      )}
                    </div>
                    {actor.notes && (
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {actor.notes}
                      </p>
                    )}
                  </div>
                )}

                {actor.spokenTo && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Spoken
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 7 && currentPage < totalPages - 3 && (
              <>
                <span className="text-slate-400 text-xs sm:text-sm">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 touch-manipulation"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm touch-manipulation"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showModal && <AddActorModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

