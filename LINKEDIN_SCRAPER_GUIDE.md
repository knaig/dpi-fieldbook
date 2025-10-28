# LinkedIn Scraper Using Playwright MCP

## Overview
Use Playwright MCP browser tools to scrape LinkedIn profiles while logged in with your Chrome browser.

## Manual Scraping Steps

Since LinkedIn has strong anti-scraping measures, here's how to use the Playwright browser tools:

### Step 1: Navigate to LinkedIn
```
Open browser to https://linkedin.com
(Should be logged in with your Chrome profile)
```

### Step 2: Search for Profile
```
Search for: "Name Role"
e.g., "Pramod Varma Chief Architect"
Click on the correct profile
```

### Step 3: Extract Data with Browser Tools

Use these Playwright MCP commands:
- `browser_snapshot` - Capture current page
- `browser_extract` - Extract structured data from page
- `browser_click` - Click on elements
- `browser_type` - Type in search boxes

### Example Extraction Prompt

For actor: **Pramod Varma**

```typescript
// Use Playwright MCP tools to:
1. Navigate: linkedin.com
2. Search: "Pramod Varma"
3. Click profile
4. Extract with browser_extract:
   - Profile image
   - Headline
   - Location
   - Current role
   - Recent posts about DPI
```

## Automation Script

### Frontend Integration
Create a button that triggers Playwright MCP scraping:

```typescript
async function scrapeLinkedInProfile(name: string) {
  // This would use Playwright MCP browser tools
  
  // 1. Navigate to LinkedIn
  browser_navigate('https://linkedin.com')
  
  // 2. Search
  browser_click('search input')
  browser_type(name)
  browser_press_key('Enter')
  
  // 3. Click profile
  browser_click(`profile for ${name}`)
  
  // 4. Extract data
  const data = await browser_extract({
    instruction: 'Extract profile data',
    schema: {
      name: 'string',
      headline: 'string',
      location: 'string',
      image: 'string',
      connections: 'string',
      experience: 'array',
      education: 'array',
    }
  })
  
  return data
}
```

## Data to Extract

### Profile Card
- Profile image URL
- Full name
- Headline (title)
- Location
- Connection count

### About Section
- Bio/Summary
- Industry focus
- Skills

### Experience
- Current role
- Past positions
- Duration at each role

### Education
- Schools attended
- Degrees
- Years

### Recent Activity
- Posts about DPI
- Engagement with DPI topics
- Shares/reposts of DPI content

## Anti-Scraping Handling

LinkedIn blocks automated scraping, so:

1. **Use Your Browser** - Playwright uses your logged-in Chrome
2. **Rate Limiting** - Don't scrape too fast (1 profile per 30 seconds)
3. **Human-like Behavior** - Add delays, scroll naturally
4. **Detect Rate Limits** - If blocked, wait 24 hours

## Best Practices

1. **Cache Results** - Store scraped data to avoid re-scraping
2. **Batch Processing** - Process multiple actors in one session
3. **Error Handling** - Gracefully handle blocked requests
4. **Legal Compliance** - Respect LinkedIn's Terms of Service

## Alternative: LinkedIn API (Official)

For production use, consider:
- LinkedIn Marketing Developer Platform
- Official OAuth integration
- Respects rate limits and ToS

## Current Status

✅ Framework ready
✅ Playwright MCP integration points defined
⚠️ Needs manual automation setup
⚠️ Rate limiting considerations

## Next Steps

1. Create a Playwright script that runs in browser context
2. Add rate limiting and error handling
3. Create batch processing for all 42 actors
4. Cache results in localStorage

