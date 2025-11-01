import { NextRequest, NextResponse } from 'next/server';

// X (Twitter) data fetcher
export async function POST(request: NextRequest) {
  try {
    const { name, role, sector } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    // Fetch X/Twitter data
    const xData = await fetchXProfile(name, role, sector);

    return NextResponse.json({ success: true, data: xData });
  } catch (error) {
    console.error('X data fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch X data',
      data: { profileUrl: null, tweets: [], followers: 0 }
    });
  }
}

async function fetchXProfile(name: string, role: string, sector: string) {
  const xData: any = {
    profileUrl: null,
    handle: null,
    tweets: [],
    followers: 0,
    recentDPITweets: [],
  };

  try {
    // Try to find X/Twitter profile
    const profileUrl = await searchXProfile(name);
    xData.profileUrl = profileUrl;

    if (profileUrl) {
      // Extract handle from URL
      const handleMatch = profileUrl.match(/twitter\.com\/([^/?]+)/);
      if (handleMatch) {
        xData.handle = handleMatch[1];

        // Search for DPI-related tweets
        const dpiTweets = await searchDPIOnX(name, sector);
        xData.recentDPITweets = dpiTweets;
      }
    }

    // Search for recent tweets about DPI
    const recentMentions = await searchRecentMentions(name, role);
    xData.tweets = recentMentions;

  } catch (error) {
    console.error('X profile fetch error:', error);
  }

  return xData;
}

async function searchXProfile(name: string): Promise<string | null> {
  try {
    const searchQuery = `site:twitter.com ${name}`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      
      // Extract Twitter/X URLs
      const twitterPattern = /https:\/\/(?:twitter|x)\.com\/[a-zA-Z0-9_]+/g;
      const matches = html.match(twitterPattern);
      
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
  } catch (error) {
    console.error('X profile search error:', error);
  }
  return null;
}

async function searchDPIOnX(name: string, sector: string): Promise<any[]> {
  try {
    const query = `${name} DPI OR "digital public infrastructure" OR digital ID`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)} site:twitter.com OR site:x.com`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      
      // Extract tweet URLs
      const tweetPattern = /https:\/\/(?:twitter|x)\.com\/[^/]+\/status\/\d+/g;
      const matches = html.match(tweetPattern);
      
      if (matches) {
        return matches.slice(0, 5).map(url => ({ url, type: 'DPI-related' }));
      }
    }
  } catch (error) {
    console.error('DPI X search error:', error);
  }
  return [];
}

async function searchRecentMentions(name: string, role: string): Promise<any[]> {
  try {
    const query = `${name} ${role}`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)} site:twitter.com OR site:x.com`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      
      // Extract tweet information
      const tweetPattern = /https:\/\/(?:twitter|x)\.com\/[^/]+\/status\/\d+/g;
      const matches = html.match(tweetPattern);
      
      if (matches) {
        return matches.slice(0, 10).map(url => ({ 
          url, 
          type: 'mention',
          timestamp: new Date().toISOString()
        }));
      }
    }
  } catch (error) {
    console.error('Recent mentions search error:', error);
  }
  return [];
}

