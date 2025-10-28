# Perplexity API Setup

## Get Your API Key

1. Visit: https://www.perplexity.ai/
2. Sign up or log in
3. Go to: https://www.perplexity.ai/settings/api
4. Generate a new API key
5. Copy the key

## Add to .env.local

```bash
cd /Users/karthiknaig/DPI_Summit/dpi-fieldbook

# Edit the file
nano .env.local
```

Add this line:
```
PERPLEXITY_API_KEY=your_actual_api_key_here
```

## Restart the Server

```bash
# Kill existing server
pkill -f "next dev"

# Restart
npm run dev
```

## Test

Visit http://localhost:3000/enrich-all and click "Start Enriching All Actors"

## What Changed

- Replaced OpenAI with Perplexity API
- Using `llama-3.1-sonar-small-128k-online` model
- Better for research and real-time web data
- Still includes Tier 3 sources (LinkedIn, X, Google Scholar)

## Benefits

✅ Real-time web search (Perplexity's strength)
✅ Better for finding recent information
✅ More cost-effective than OpenAI
✅ Still works with fallback when API key is missing

