import { NextRequest, NextResponse } from 'next/server';

// LinkedIn data fetcher
export async function POST(request: NextRequest) {
  try {
    const { name, role } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    // Try multiple LinkedIn URL patterns
    const linkedinUrls = generateLinkedInUrls(name);
    
    const linkedinData = {
      profileUrl: null as string | null,
      image: null as string | null,
      headline: '',
      location: '',
      recentActivity: [] as string[],
    };

    // Try to find LinkedIn profile
    for (const url of linkedinUrls) {
      try {
        const profile = await fetchLinkedInProfile(url, name);
        if (profile) {
          linkedinData.profileUrl = url;
          linkedinData.headline = profile.headline || role;
          linkedinData.location = profile.location || '';
          linkedinData.image = profile.image || null;
          break;
        }
      } catch (error) {
        console.error(`LinkedIn fetch error for ${url}:`, error);
      }
    }

    // Search for LinkedIn profile via web search
    const searchResults = await searchLinkedInProfile(name);
    if (searchResults && !linkedinData.profileUrl) {
      linkedinData.profileUrl = searchResults;
    }

    return NextResponse.json({ success: true, data: linkedinData });
  } catch (error) {
    console.error('LinkedIn data fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch LinkedIn data',
      data: { profileUrl: null, image: null, headline: '', location: '' }
    });
  }
}

function generateLinkedInUrls(name: string): string[] {
  const cleanName = name.replace(/[.,]/g, '').toLowerCase();
  const parts = cleanName.split(/\s+/);
  
  // Try different URL patterns
  const patterns = [
    `${parts.join('-')}`,
    `${parts[0]}-${parts.slice(1).join('')}`,
    `${parts.join('')}`,
  ];

  if (parts.length > 1) {
    patterns.push(`${parts[parts.length - 1]}-${parts.slice(0, -1).join('')}`);
  }

  return patterns.map(pattern => `https://www.linkedin.com/in/${pattern}`);
}

async function fetchLinkedInProfile(url: string, name: string): Promise<any> {
  try {
    // Note: LinkedIn blocks scraping. This is a framework for future OAuth implementation
    // For now, return profile URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      timeout: 5000,
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok || response.redirected) {
      return {
        profileUrl: url,
        headline: 'View on LinkedIn',
      };
    }
  } catch (error) {
    console.error('LinkedIn profile fetch error:', error);
  }
  return null;
}

async function searchLinkedInProfile(name: string): Promise<string | null> {
  try {
    const searchQuery = `site:linkedin.com/in ${name}`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000,
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      
      // Extract LinkedIn URLs
      const linkedinPattern = /https:\/\/[^"]*linkedin\.com\/in\/[^"]*/g;
      const match = html.match(linkedinPattern);
      
      if (match && match.length > 0) {
        return match[0];
      }
    }
  } catch (error) {
    console.error('LinkedIn search error:', error);
  }
  return null;
}

