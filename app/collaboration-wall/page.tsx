'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  Clock3,
  Landmark,
  Mic2,
  School,
  Sparkles,
  Users,
  UserCircle,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useVisitorBookStore } from '@/lib/useVisitorBookStore';
import { useFieldbookStore } from '@/lib/useFieldbookStore';

type ThemeDefinition = {
  id: string;
  label: string;
  keywords: string[];
  gradient: string;
  icon: LucideIcon;
};

type EnrichedMessage = {
  id: string;
  name: string;
  email?: string;
  message: string;
  timestamp: string;
  themeIds: string[];
};

const THEMES: ThemeDefinition[] = [
  {
    id: 'governance',
    label: 'Governance',
    keywords: [
      'governance',
      'policy',
      'regulation',
      'public sector',
      'civic',
      'accountability',
      'government',
      'compliance',
    ],
    gradient: 'from-blue-500/90 via-blue-500/80 to-blue-600/90',
    icon: Landmark,
  },
  {
    id: 'voice-tech',
    label: 'Voice Tech',
    keywords: [
      'voice',
      'speech',
      'audio',
      'ivr',
      'call center',
      'assistant',
      'telephony',
      'listening',
      'conversation',
    ],
    gradient: 'from-purple-500/90 via-purple-500/80 to-indigo-500/90',
    icon: Mic2,
  },
  {
    id: 'education',
    label: 'Education',
    keywords: [
      'education',
      'school',
      'learning',
      'training',
      'curriculum',
      'student',
      'teacher',
      'academy',
      'skills',
    ],
    gradient: 'from-emerald-500/90 via-emerald-500/80 to-teal-500/90',
    icon: School,
  },
];

const FALLBACK_THEME: ThemeDefinition = {
  id: 'emerging',
  label: 'Emerging Themes',
  gradient: 'from-slate-500/80 via-slate-500/70 to-slate-600/80',
  icon: Sparkles,
};

const PEOPLE_COLORS = [
  'bg-sky-500/20 text-sky-600',
  'bg-purple-500/20 text-purple-600',
  'bg-emerald-500/20 text-emerald-600',
  'bg-amber-500/20 text-amber-600',
  'bg-rose-500/20 text-rose-600',
];

function formatRelativeTime(timestamp: string) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return 'just now';

  const diff = now - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'just now';
  if (diff < hour) {
    const minutes = Math.round(diff / minute);
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }
  if (diff < day) {
    const hours = Math.round(diff / hour);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.round(diff / day);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(part => part.charAt(0).toUpperCase()).join('') || '??';
}

function detectThemes(text: string) {
  const lower = text.toLowerCase();
  const matches = THEMES.filter(theme =>
    theme.keywords.some(keyword => lower.includes(keyword))
  );
  return matches.length > 0 ? matches.map(theme => theme.id) : [FALLBACK_THEME.id];
}

export default function CollaborationWallPage() {
  const {
    messages,
    isHydrated: isVisitorHydrated,
  } = useVisitorBookStore();
  const {
    actors,
    isHydrated: isActorsHydrated,
  } = useFieldbookStore();

  const ready = isVisitorHydrated && isActorsHydrated;

  const enrichedMessages: EnrichedMessage[] = useMemo(() => {
    return messages.map(message => ({
      ...message,
      themeIds: detectThemes(`${message.message} ${message.name ?? ''}`),
    }));
  }, [messages]);

  const themeStats = useMemo(() => {
    const totalMentions = enrichedMessages.reduce((acc, msg) => acc + msg.themeIds.length, 0);
    const base = new Map<string, { count: number; sample: EnrichedMessage[] }>();

    [...THEMES.map(theme => theme.id), FALLBACK_THEME.id].forEach(id => {
      base.set(id, { count: 0, sample: [] });
    });

    enrichedMessages.forEach(msg => {
      msg.themeIds.forEach(id => {
        const bucket = base.get(id);
        if (!bucket) return;
        bucket.count += 1;
        if (bucket.sample.length < 3) {
          bucket.sample.push(msg);
        }
      });
    });

    return {
      total: totalMentions,
      buckets: base,
    };
  }, [enrichedMessages]);

  const communityStats = useMemo(() => {
    const totalVisitors = messages.length;
    const uniqueVisitors = new Set(
      messages.map(msg => (msg.email ? msg.email.toLowerCase() : msg.name.trim().toLowerCase()))
    ).size;

    const spokenTo = actors.filter(actor => actor.spokenTo).length;

    const now = Date.now();
    const last24h = messages.filter(msg => {
      const ts = new Date(msg.timestamp).getTime();
      return !Number.isNaN(ts) && now - ts <= 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalVisitors,
      uniqueVisitors,
      spokenTo,
      last24h,
    };
  }, [messages, actors]);

  const timeline = useMemo(() => {
    const bucketCount = 12;
    const now = new Date();
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const start = new Date(now.getTime() - (bucketCount - index) * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const count = enrichedMessages.filter(msg => {
        const ts = new Date(msg.timestamp).getTime();
        if (Number.isNaN(ts)) return false;
        return ts >= start.getTime() && ts < end.getTime();
      }).length;
      return {
        label: end.toLocaleTimeString(undefined, { hour: 'numeric' }),
        count,
        isCurrent: index === bucketCount - 1,
      };
    });

    const maxCount = Math.max(...buckets.map(bucket => bucket.count), 1);

    return {
      buckets,
      maxCount,
    };
  }, [enrichedMessages]);

  const activeVoices = useMemo(() => enrichedMessages.slice(0, 12), [enrichedMessages]);

  const connectors = useMemo(() => {
    const sorted = [...actors]
      .filter(actor => actor.spokenTo)
      .sort((a, b) => b.followupScore - a.followupScore)
      .slice(0, 6);
    return sorted;
  }, [actors]);

  if (!ready) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 font-medium">Spinning up the live collaboration wall…</p>
          <p className="text-slate-400 text-sm mt-2">We are loading recent visitors and theme signals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-24">
      <header className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm font-medium uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Live Collaboration Wall
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              Mapping the community in real time
            </h1>
            <p className="text-white/70 text-base sm:text-lg">
              See who has stopped by, spot the themes heating up, and watch the DPI ecosystem co-create as visitors share what matters most to them.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1">
                <Users className="w-4 h-4" />
                <span>{communityStats.totalVisitors} total drop-ins</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1">
                <Activity className="w-4 h-4" />
                <span>{communityStats.last24h} in the last 24 hours</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>{communityStats.spokenTo} actors engaged</span>
              </div>
            </div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-6 flex-1">
            <h2 className="text-sm uppercase tracking-widest text-white/60 font-semibold mb-4">Theme Pulse</h2>
            <div className="space-y-3">
              {THEMES.map(theme => {
                const bucket = themeStats.buckets.get(theme.id);
                const count = bucket?.count ?? 0;
                const share = themeStats.total > 0 ? Math.round((count / themeStats.total) * 100) : 0;
                const ThemeIcon = theme.icon;
                return (
                  <div key={theme.id} className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${theme.gradient} text-white shadow`}>
                      <ThemeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-white/80 mb-1">
                        <span className="font-semibold">{theme.label}</span>
                        <span>{share}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-white/80"
                          style={{ width: `${Math.max(share, count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-white/60 font-medium w-10 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Live Visitor Stream
            </h2>
            <span className="text-sm text-slate-500">Updated in real time</span>
          </div>
          {activeVoices.length === 0 ? (
            <div className="text-center py-16">
              <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No signatures yet</p>
              <p className="text-slate-500 text-sm mt-1">Invite collaborators to sign the visitor book to light up the wall.</p>
              <Link
                href="/visitor-book"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition"
              >
                Open visitor book
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
              {activeVoices.map((msg, index) => (
                <div
                  key={msg.id}
                  className="border border-slate-200 rounded-2xl p-4 hover:border-blue-200 transition-colors bg-slate-50/60"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${PEOPLE_COLORS[index % PEOPLE_COLORS.length]}`}>
                      {getInitials(msg.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{msg.name}</p>
                          {msg.email && (
                            <p className="text-xs text-slate-500">{msg.email}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          {formatRelativeTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {msg.themeIds.map(themeId => {
                          const theme = THEMES.find(t => t.id === themeId);
                          if (theme) {
                            const ThemeIcon = theme.icon;
                            return (
                              <span
                                key={themeId}
                                className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r ${theme.gradient} text-white shadow-sm`}
                              >
                                <ThemeIcon className="w-3 h-3" />
                                {theme.label}
                              </span>
                            );
                          }
                          return (
                            <span
                              key={themeId}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r ${FALLBACK_THEME.gradient} text-white shadow-sm`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {FALLBACK_THEME.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Momentum Timeline
            </h2>
            <p className="text-sm text-slate-500 mt-1">Signals from the last 12 hours</p>
            <div className="mt-6">
              <div className="flex items-end gap-2 h-48">
                {timeline.buckets.map(bucket => (
                  <div key={bucket.label} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t-xl bg-gradient-to-t from-blue-500/70 to-blue-500/40 transition-all ${bucket.isCurrent ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white' : ''}`}
                      style={{
                        height: `${(bucket.count / Math.max(timeline.maxCount, 1)) * 100}%`,
                        minHeight: bucket.count > 0 ? '12%' : '4px',
                      }}
                    />
                    <span className="text-[10px] text-slate-400 mt-2">{bucket.label}</span>
                    <span className="text-xs text-slate-500 font-medium">{bucket.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Community Stats</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Unique voices</p>
                <p className="text-xl font-semibold text-slate-900">{communityStats.uniqueVisitors}</p>
              </div>
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Actors engaged</p>
                <p className="text-xl font-semibold text-slate-900">{communityStats.spokenTo}</p>
              </div>
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Signatures</p>
                <p className="text-xl font-semibold text-slate-900">{communityStats.totalVisitors}</p>
              </div>
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Last 24h</p>
                <p className="text-xl font-semibold text-emerald-600">+{communityStats.last24h}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Theme Spotlights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...THEMES, FALLBACK_THEME].map(theme => {
            const bucket = themeStats.buckets.get(theme.id) ?? { count: 0, sample: [] };
            const share = themeStats.total > 0 ? Math.round((bucket.count / themeStats.total) * 100) : 0;
            const ThemeIcon = theme.icon;

            return (
              <div
                key={theme.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow`}>
                    <ThemeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{theme.label}</p>
                    <p className="text-xs text-slate-500">{share}% of live reflections</p>
                  </div>
                </div>
                <div className="mt-4">
                  {bucket.sample.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No mentions yet — invite the community to weigh in.</p>
                  ) : (
                    <ul className="space-y-3">
                      {bucket.sample.map(sample => (
                        <li key={sample.id} className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                          <p className="text-xs text-slate-500 mb-1">{sample.name}</p>
                          <p className="text-sm text-slate-700">{sample.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Connectors in Motion
          </h2>
          <Link
            href="/actors"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all actors
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        {connectors.length === 0 ? (
          <p className="text-sm text-slate-500">No actor engagements recorded yet — start conversations to surface connectors.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map(actor => (
              <Link
                key={actor.id}
                href={`/actors/${actor.id}`}
                className="border border-slate-200 rounded-3xl p-4 hover:border-blue-300 hover:shadow-sm transition-colors bg-slate-50/50"
              >
                <p className="text-sm font-semibold text-slate-900">{actor.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {actor.summitCompany || actor.sector || 'Independent'}
                </p>
                <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    <Activity className="w-3 h-3" />
                    Score {actor.followupScore}
                  </span>
                  {actor.buckets?.length ? (
                    <span className="truncate max-w-[160px]">{actor.buckets.slice(0, 2).join(', ')}</span>
                  ) : actor.summitIndustry ? (
                    <span>{actor.summitIndustry}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Keep the wall alive</h2>
            <p className="text-white/70 text-sm max-w-xl">
              Each signature in the visitor book adds another signal. Invite collaborators to drop in, mention their themes, and watch the DPI story unfold together.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/visitor-book"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-full font-semibold hover:bg-slate-100 transition"
            >
              Sign the visitor book
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/export"
              className="inline-flex items-center gap-2 px-5 py-3 border border-white/40 text-white rounded-full font-semibold hover:bg-white/10 transition"
            >
              Export insights
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

