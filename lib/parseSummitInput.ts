import type { CandidateActor } from '@/types/actor';

const SECTOR_KEYWORDS: Record<string, string> = {
  un: 'Multilateral',
  undp: 'Multilateral',
  worldbank: 'Multilateral',
  government: 'Government',
  ministry: 'Government',
  gavi: 'Funder',
  gates: 'Funder',
  foundation: 'Funder',
  university: 'Research',
  research: 'Research',
  institute: 'Research',
  ngo: 'NGO',
  corporate: 'Corporate',
  bank: 'Corporate',
};

const SOURCE_TAGS = {
  speaker: 'Speaker',
  partner: 'Partner',
  panel: 'Panelist',
  sponsor: 'Sponsor',
  organizer: 'Organizer',
};

export function parseSummitInput(rawText: string): CandidateActor[] {
  // Split by lines and filter empty
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 2);

  const candidates: CandidateActor[] = [];

  for (const line of lines) {
    // Skip HTML tags but keep content
    const cleanLine = line.replace(/<[^>]*>/g, ' ').trim();

    if (!cleanLine || cleanLine.length < 3) continue;

    // Detect if this looks like an organization name
    // (typically title case, 2-5 words)
    const words = cleanLine.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 1 || words.length > 8) continue;

    // Try to detect sector from keywords
    const lowerLine = cleanLine.toLowerCase();
    let sector = 'Other';
    for (const [keyword, detectedSector] of Object.entries(SECTOR_KEYWORDS)) {
      if (lowerLine.includes(keyword)) {
        sector = detectedSector;
        break;
      }
    }

    // Detect source tags from context
    const summitContext =
      lowerLine.includes('speaker') || lowerLine.includes('presenter')
        ? 'Summit Speaker'
        : lowerLine.includes('partner')
          ? 'Summit Partner'
          : lowerLine.includes('panel')
            ? 'Panel Member'
            : lowerLine.includes('sponsor')
              ? 'Sponsor'
              : 'Summit Attendee';

    const summitSourceTags: string[] = [];
    if (lowerLine.includes('speaker')) summitSourceTags.push('Speaker');
    if (lowerLine.includes('partner')) summitSourceTags.push('Partner');
    if (lowerLine.includes('panel')) summitSourceTags.push('Panelist');
    if (lowerLine.includes('sponsor')) summitSourceTags.push('Sponsor');

    candidates.push({
      name: cleanLine,
      sector,
      summitContext,
      summitSourceTags,
    });
  }

  // Deduplicate by name
  const unique = new Map<string, CandidateActor>();
  for (const candidate of candidates) {
    if (!unique.has(candidate.name)) {
      unique.set(candidate.name, candidate);
    }
  }

  return Array.from(unique.values());
}

