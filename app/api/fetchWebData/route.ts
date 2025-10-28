import { NextRequest, NextResponse } from 'next/server';

// Comprehensive web data fetcher for Tier 3 sources
export async function POST(request: NextRequest) {
  try {
    const { name, role, sector } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    // Fetch from multiple Tier 3 sources in parallel
    const [googleData, scholarData, newsData] = await Promise.allSettled([
      fetchGoogleSearchResults(name, role, sector),
      fetchScholarData(name),
      fetchNewsResults(name, sector),
    ]);

    const results: any = {};

    if (googleData.status === 'fulfilled') {
      results.google = googleData.value;
    }

    if (scholarData.status === 'fulfilled') {
      results.scholar = scholarData.value;
    }

    if (newsData.status === 'fulfilled') {
      results.news = newsData.value;
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Web data fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch web data' }, { status: 500 });
  }
}

async function fetchGoogleSearchResults(name: string, role: string, sector: string) {
  try {
    const query = `${name} ${role} ${sector} digital public infrastructure DPI`;
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}`;
    
    // Note: Requires Google Custom Search API key
    if (!process.env.GOOGLE_API_KEY) {
      return null;
    }

    const response = await fetch(searchUrl, { timeout: 5000 });
    if (response.ok) {
      const data = await response.json();
      return {
        results: data.items?.slice(0, 5).map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        })) || [],
      };
    }
  } catch (error) {
    console.error('Google search error:', error);
  }
  return null;
}

async function fetchScholarData(name: string) {
  try {
    const searchQuery = encodeURIComponent(`${name} digital public infrastructure`);
    const scholarUrl = `https://scholar.google.com/scholar?q=${searchQuery}`;
    
    const response = await fetch(scholarUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000,
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      
      // Extract publications
      const pubPattern = /<h3 class="gs_rt[^"]*"><a[^>]*>([^<]+)<\/a><\/h3>/g;
      const publications: string[] = [];
      let match;
      
      while ((match = pubPattern.exec(html)) !== null && publications.length < 5) {
        const title = match[1].trim();
        if (title && title.length > 10) {
          publications.push(title);
        }
      }
      
      // Extract citations
      const citePattern = /<div class="gs_fl[^"]*"><a[^>]*>Cited by (\d+)<\/a><\/div>/g;
      const citations: number[] = [];
      while ((match = citePattern.exec(html)) !== null) {
        citations.push(parseInt(match[1]));
      }
      
      return {
        publications: publications,
        citationCount: citations.length > 0 ? Math.max(...citations) : 0,
      };
    }
  } catch (error) {
    console.error('Scholar fetch error:', error);
  }
  return null;
}

async function fetchNewsResults(name: string, sector: string) {
  try {
    const query = `${name} ${sector} DPI summit`;
    // Using DuckDuckGo as privacy-friendly alternative
    const newsUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(newsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000,
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      
      // Extract recent news items
      const newsPattern = /<a class="result__a[^"]*" href="([^"]+)">([^<]+)<\/a>/g;
      const newsItems: Array<{ title: string; url: string }> = [];
      let match;
      
      while ((match = newsPattern.exec(html)) !== null && newsItems.length < 5) {
        newsItems.push({
          url: match[1],
          title: match[2].trim(),
        });
      }
      
      return { items: newsItems };
    }
  } catch (error) {
    console.error('News fetch error:', error);
  }
  return null;
}

