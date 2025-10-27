# Actor Enrichment Strategy - Getting Real Data

## Current Status
✅ Basic enrichment working (Wikipedia API integration)  
✅ Enhanced enrichment created (multi-source with images)  
⚠️ Needs API keys for best results

## Recommended Approach: Multi-Tier Strategy

### Tier 1: Free & Immediate (Currently Implemented)
**Data Sources:**
- Wikipedia API - Basic bio and photos
- DuckDuckGo - General web search
- Pattern matching - Infer interests from text

**Pros:** Free, no API keys, works immediately  
**Cons:** Limited to public data, less DPI-specific context

### Tier 2: Enhanced with LLM (Recommended)
**Best Option:** OpenAI GPT-4 or Claude 3.5

**Implementation:**
```typescript
// Add to .env.local:
OPENAI_API_KEY=your-key-here

// Enhanced enrichment:
const prompt = `Analyze ${actor.name} (${actor.role}) in the context of Digital Public Infrastructure (DPI).
Extract:
1. Their specific role in DPI ecosystem
2. Relevant publications
3. Recent speaking engagements
4. Interests in digital inclusion, AI, multilingual systems
5. How AI4Inclusion can engage with them
6. Leverage points for partnership

Context: ${actor.summitContext || ''}`;

const intelligence = await openai.chat.completions.create({
  model: "gpt-4o-mini", // Cost-effective
  messages: [{ role: "user", content: prompt }],
});
```

**Cost:** ~$0.01 per actor enrichment  
**Quality:** High, contextual, DPI-focused

### Tier 3: Premium Data Sources

#### A. LinkedIn Scraping (for professional context)
- Professional photos
- Current role & experience  
- Network connections
- Posts on DPI topics

**Tools:**
- LinkedIn API (requires OAuth)
- Apify LinkedIn scraper
- Proxy services like ScraperAPI

#### B. Google Images (for profile photos)
```typescript
const imageUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${name}&searchType=image&imgType=face`;
```

#### C. Google Scholar (for publications)
```typescript
const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(name + ' digital public infrastructure')}`;
// Parse publications from results
```

#### D. X (Twitter) API (for recent activity)
```typescript
// Track mentions, retweets, posts about DPI
const tweets = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${name} DPI`);
```

## Recommended Implementation Order

### Phase 1: Current (Free tier)
✅ Basic Wikipedia integration ✅  
✅ Pattern-based intelligence extraction ✅

### Phase 2: Add OpenAI (HIGHEST IMPACT)
Add OpenAI API key to `.env.local`:
```bash
OPENAI_API_KEY=sk-...
```

Update `app/api/enrichActor/route.ts` to call GPT-4:
- More accurate role descriptions
- Better interest topic extraction
- Contextual engagement strategies
- Leverage point recommendations

**Estimated cost:** $0.50-$1.00 to enrich all 42 actors

### Phase 3: Add Images
Update Actor type to include `profileImage`:
```typescript
export type Actor = {
  // ... existing fields
  profileImage?: string;
};
```

Add image fetcher in enrichment API.

### Phase 4: Real-time Data (Optional)
- LinkedIn integration for recent activity
- X (Twitter) tracking for DPI mentions
- Google Scholar for latest publications

## Quick Win: OpenAI Integration (Recommended Next Step)

**File to modify:** `app/api/enrichActor/route.ts`

Add OpenAI at the top:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

Replace mock intelligence with:
```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{
    role: "system",
    content: "You are an expert in Digital Public Infrastructure and ecosystem mapping."
  }, {
    role: "user", 
    content: generateEnrichmentPrompt(actorName, actorRole, actorContext)
  }],
});

const intelligence = parseLLMResponse(completion.choices[0].message.content);
```

## Cost Estimates

| Approach | Cost per Actor | Total (42 actors) | Quality |
|----------|---------------|-------------------|---------|
| Wikipedia only | $0 | $0 | Low |
| OpenAI GPT-4o-mini | ~$0.01 | ~$0.42 | High |
| OpenAI GPT-4o | ~$0.05 | ~$2.10 | Very High |
| Claude 3.5 Sonnet | ~$0.01 | ~$0.42 | Very High |

## Next Steps

1. **Immediate:** Visit http://localhost:3000/init to import all 42 actors
2. **Quick Win:** Add OpenAI API key to `.env.local` and enhance enrichment
3. **Visual:** Add profile images display to actor cards
4. **Real-time:** Consider LinkedIn/X integration for ongoing intelligence

## Installation for OpenAI

```bash
cd /Users/karthiknaig/DPI_Summit/dpi-fieldbook
npm install openai
```

Add to `.env.local`:
```
OPENAI_API_KEY=your-key-here
```

I can help you implement any of these approaches!

