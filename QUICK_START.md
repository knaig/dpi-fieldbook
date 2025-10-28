# Quick Start - DPI Summit Fieldbook

## 🚀 How to Use

### Option 1: Enrich All Actors Automatically (Recommended)

1. **Visit:** http://localhost:3000/enrich-all
2. **Click:** "Start Enriching All Actors"
3. **Wait:** ~90 seconds for all 42 actors
4. **Done:** All profiles enriched with LinkedIn + X + Intelligence

### Option 2: Enrich Individual Actors

1. **Visit:** http://localhost:3000/actors
2. **Click** any actor
3. **Click:** "Enrich / Refresh Profile" button
4. **See** LinkedIn + X profiles populate

## What Gets Enriched

✅ **OpenAI Intelligence**
- Role in ecosystem
- Interest topics
- Engagement strategy
- Leverage for AI4Inclusion

✅ **LinkedIn Profiles**
- Profile URL
- Headline
- Experience
- Education
- Connections

✅ **X/Twitter Profiles**
- Handle (@username)
- Profile URL
- DPI-related posts
- Recent mentions

✅ **Other Sources**
- Wikipedia bio + image
- Google Scholar publications
- Recent news mentions

## System Status

✅ **6 Data Sources Active:**
1. OpenAI (Intelligence)
2. Wikipedia (Bio + Image)
3. Google Scholar (Publications)
4. DuckDuckGo (News)
5. LinkedIn (Profile search)
6. X/Twitter (Profile search)

✅ **All 42 Actors Imported**

✅ **Batch Enrichment Ready**

## App URLs

- **Local:** http://localhost:3000
- **Production:** https://dpi-fieldbook.vercel.app
- **GitHub:** https://github.com/knaig/dpi-fieldbook

## Next Steps

1. Visit `/enrich-all` to start batch enrichment
2. Wait for completion (~90 seconds)
3. Visit `/actors` to see enriched profiles
4. Visit any actor detail page to see LinkedIn + X cards

## Troubleshooting

**If LinkedIn/X not found:**
- Search is web-based, not perfect
- Try manual enrichment for better results
- Use command-line scraper for critical profiles

**If enrichment slow:**
- Rate limiting: 2 sec between requests
- This is intentional to avoid blocking
- Total time: ~90 seconds for 42 actors

## Commands

```bash
# Start dev server
npm run dev

# Manual LinkedIn scraper
npm run scrape-linkedin "Name" "Role"

# Check status
git log --oneline
```

