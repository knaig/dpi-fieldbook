export type Session = {
  id: string;
  title: string;
  description?: string;
  speakers?: string[];
  organizations?: string[];
  start?: string; // ISO
  end?: string;   // ISO
  day?: string;   // YYYY-MM-DD
  tags?: string[];
  url?: string;
};

export type Weights = {
  topicRelevance: number; // default 0.5
  speakerOrgFit: number;  // default 0.3
  conflictPenalty: number;// default 0.2
};

const LANGUAGE_KEYWORDS = [
  'language', 'multilingual', 'translation', 'localization', 'nlp', 'speech', 'voice', 'masakhane', 'llm', 'ai'
];

const TARGET_ORGS = [
  'masakhane', 'ai4inclusion', 'coss', 'mozilla', 'mozilla foundation'
];

export function scoreSession(session: Session, sessionsOnDay: Session[], weights?: Partial<Weights>): number {
  const w: Weights = {
    topicRelevance: weights?.topicRelevance ?? 0.5,
    speakerOrgFit: weights?.speakerOrgFit ?? 0.3,
    conflictPenalty: weights?.conflictPenalty ?? 0.2,
  };

  const text = `${session.title} ${session.description ?? ''} ${(session.tags ?? []).join(' ')}`.toLowerCase();
  const topicHits = LANGUAGE_KEYWORDS.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
  const topicScore = Math.min(topicHits / 3, 1); // saturate

  const orgs = (session.organizations ?? []).map(o => o.toLowerCase());
  const speakers = (session.speakers ?? []).map(s => s.toLowerCase());
  const orgFit = orgs.some(o => TARGET_ORGS.some(t => o.includes(t))) ? 1 : 0;
  const speakerFit = speakers.some(s => TARGET_ORGS.some(t => s.includes(t))) ? 1 : 0;
  const fitScore = Math.max(orgFit, speakerFit);

  // conflict: if overlaps with higher-scoring sessions, penalize slightly later in selection
  // here we approximate: longer than 90 minutes gets a small penalty
  let conflict = 0;
  if (session.start && session.end) {
    const dur = new Date(session.end).getTime() - new Date(session.start).getTime();
    if (dur > 90 * 60 * 1000) conflict = 0.3;
  }

  const score = w.topicRelevance * topicScore + w.speakerOrgFit * fitScore - w.conflictPenalty * conflict;
  return score;
}

export function topSessionsPerDay(sessions: Session[], day: string, weights?: Partial<Weights>): Session[] {
  const daySessions = sessions.filter(s => (s.day ?? '').startsWith(day));
  const scored = daySessions
    .map(s => ({ s, score: scoreSession(s, daySessions, weights) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.s);
  return scored;
}


