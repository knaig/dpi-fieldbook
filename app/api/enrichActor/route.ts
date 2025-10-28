import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI - uses OPENAI_API_KEY from env
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const actorId = searchParams.get('id');
  const actorName = searchParams.get('name');
  const actorRole = searchParams.get('role') || '';
  const actorSector = searchParams.get('sector') || '';
  const actorContext = searchParams.get('context') || '';

  if (!actorId) {
    return NextResponse.json({ error: 'Actor ID required' }, { status: 400 });
  }

  try {
    // Try OpenAI first if available
    if (openai) {
      const intelligence = await enrichWithOpenAI(
        actorName || '',
        actorRole,
        actorSector,
        actorContext
      );
      return NextResponse.json(intelligence);
    }

    // Fallback to Wikipedia + pattern matching
    const intelligence = await enrichWithWikipedia(actorName || '');
    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('Enrichment error:', error);
    // Return fallback data
    return NextResponse.json({
      interestTopics: ['Digital Inclusion', 'Voice AI', 'Public Infrastructure'],
      publications: [],
      eventsAppeared: [],
      roleInEcosystem: `${actorName} is working on digital public infrastructure.`,
      wantsNeeds: 'Engagement and collaboration opportunities in DPI space.',
      engagementStrategy: 'Position AI4Inclusion as complementary to their work.',
      leverageForAI4Inclusion: 'Potential partnership on multilingual DPI systems.',
    });
  }
}

async function enrichWithOpenAI(
  name: string,
  role: string,
  sector: string,
  context: string
): Promise<any> {
  if (!openai) throw new Error('OpenAI not initialized');

  const prompt = `You are an expert in Digital Public Infrastructure (DPI) and ecosystem mapping for the AI4Inclusion initiative at CIVIC: Data4Good.

Analyze this actor at the DPI Summit 2025 and provide intelligence:

Name: ${name}
Role: ${role}
Sector: ${sector}
Context: ${context}

Extract and return ONLY a JSON object with these exact fields:
{
  "roleInEcosystem": "One sentence describing their role in DPI ecosystem",
  "interestTopics": ["topic1", "topic2", "topic3"],
  "publications": ["publication1", "publication2"],
  "eventsAppeared": ["event1", "event2"],
  "wantsNeeds": "What they likely want or need - funding, partnerships, technical support, etc.",
  "engagementStrategy": "Specific strategy for how AI4Inclusion should engage with them",
  "leverageForAI4Inclusion": "How AI4Inclusion can leverage this relationship for multilingual voice AI in DPIs"
}

Focus on: Digital inclusion, multilingual systems, voice AI, and how it relates to DPI implementation.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cost-effective
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('No response from OpenAI');

  const intelligence = JSON.parse(content);

  // Enhance with Tier 3 data sources
  const [imageUrl, scholarPublications, linkedinData, xData] = await Promise.allSettled([
    fetchProfileImage(name),
    fetchPublicationsFromScholar(name),
    fetchLinkedInProfile(name, role),
    fetchXProfileData(name, role, sector),
  ]);

  if (imageUrl.status === 'fulfilled' && imageUrl.value) {
    intelligence.profileImage = imageUrl.value;
  }

  if (scholarPublications.status === 'fulfilled' && scholarPublications.value.length > 0) {
    if (!intelligence.publications || intelligence.publications.length === 0) {
      intelligence.publications = scholarPublications.value;
    }
  }

  // Add LinkedIn data
  if (linkedinData.status === 'fulfilled' && linkedinData.value) {
    intelligence.linkedinUrl = linkedinData.value.profileUrl;
    intelligence.linkedinHeadline = linkedinData.value.headline || role;
    intelligence.linkedinLocation = linkedinData.value.location;
    intelligence.linkedinConnections = linkedinData.value.connections;
    intelligence.linkedinExperience = linkedinData.value.experience || [];
    intelligence.linkedinEducation = linkedinData.value.education || [];
    if (linkedinData.value.image && !intelligence.profileImage) {
      intelligence.profileImage = linkedinData.value.image;
    }
  }

  // Add X/Twitter data
  if (xData.status === 'fulfilled' && xData.value) {
    intelligence.xHandle = xData.value.handle;
    intelligence.xProfileUrl = xData.value.profileUrl;
    intelligence.recentTweets = xData.value.tweets || [];
    intelligence.dpiTweets = xData.value.recentDPITweets || [];
  }

  // Add timestamp
  intelligence.lastEnriched = new Date().toISOString();

  return intelligence;
}

async function fetchLinkedInProfile(name: string, role: string): Promise<any> {
  try {
    // Search for LinkedIn profile using web search
    const searchUrl = await searchLinkedInProfile(name);
    if (searchUrl) {
      return { 
        profileUrl: searchUrl, 
        headline: role,
        found: true 
      };
    }
    
    // Try common LinkedIn URL patterns
    const cleanName = name.replace(/[.,]/g, '').toLowerCase().replace(/\s+/g, '-');
    const commonPatterns = [
      `https://linkedin.com/in/${cleanName}`,
      `https://www.linkedin.com/in/${cleanName}`,
    ];
    
    for (const url of commonPatterns) {
      try {
        const testResponse = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          timeout: 2000,
          signal: AbortSignal.timeout(2000)
        });
        
        // If we get redirected or 200, profile exists
        if (testResponse.ok || testResponse.redirected || testResponse.status < 400) {
          return { profileUrl: url, headline: role, found: true };
        }
      } catch (e) {
        continue;
      }
    }
    
  } catch (error) {
    console.error('LinkedIn fetch error:', error);
  }
  return null;
}

async function fetchXProfileData(name: string, role: string, sector: string): Promise<any> {
  try {
    const profileUrl = await searchXProfile(name);
    if (profileUrl) {
      const handleMatch = profileUrl.match(/twitter\.com\/([^/?]+)/);
      return {
        profileUrl,
        handle: handleMatch ? handleMatch[1] : null,
        tweets: [],
        dpiTweets: [],
      };
    }
  } catch (error) {
    console.error('X fetch error:', error);
  }
  return null;
}

function generateLinkedInUrls(name: string): string[] {
  const cleanName = name.replace(/[.,]/g, '').toLowerCase();
  const parts = cleanName.split(/\s+/);
  
  return [
    `${parts.join('-')}`,
    `${parts[0]}-${parts.slice(1).join('')}`,
    `${parts.join('')}`,
  ];
}

async function searchLinkedInProfile(name: string): Promise<string | null> {
  try {
    // Try multiple search strategies
    const searchQueries = [
      `"${name}" linkedin.com/in`,
      `site:linkedin.com/in "${name}"`,
      `${name} linkedin profile`,
    ];
    
    for (const query of searchQueries) {
      try {
        // Try DuckDuckGo search
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        
        const response = await fetch(searchUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html'
          },
          timeout: 5000,
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const html = await response.text();
          
          // Look for LinkedIn URLs in the HTML
          const patterns = [
            /https:\/\/[^"]*linkedin\.com\/in\/[a-zA-Z0-9-]+/g,
            /linkedin\.com\/in\/[a-zA-Z0-9-]+/g,
          ];
          
          for (const pattern of patterns) {
            const matches = html.match(pattern);
            if (matches && matches.length > 0) {
              // Get the first valid LinkedIn URL
              for (const match of matches) {
                if (match.startsWith('http')) {
                  return match;
                } else if (match.startsWith('linkedin')) {
                  return `https://${match}`;
                }
              }
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('LinkedIn search error:', error);
  }
  return null;
}

async function searchXProfile(name: string): Promise<string | null> {
  try {
    // Try multiple search strategies for X/Twitter
    const searchQueries = [
      `"${name}" site:twitter.com`,
      `"${name}" site:x.com`,
      `${name} twitter profile`,
      `${name} x.com profile`,
    ];
    
    for (const query of searchQueries) {
      try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        
        const response = await fetch(searchUrl, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html'
          },
          timeout: 5000,
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const html = await response.text();
          
          // Look for Twitter/X URLs
          const patterns = [
            /https:\/\/(?:twitter|x)\.com\/[a-zA-Z0-9_]+/g,
            /(?:twitter|x)\.com\/[a-zA-Z0-9_]+/g,
          ];
          
          for (const pattern of patterns) {
            const matches = html.match(pattern);
            if (matches && matches.length > 0) {
              for (const match of matches) {
                if (match.startsWith('http')) {
                  return match;
                } else if (match.includes('twitter.com') || match.includes('x.com')) {
                  return `https://${match}`;
                }
              }
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('X search error:', error);
  }
  return null;
}

async function enrichWithWikipedia(name: string): Promise<any> {
  try {
    const searchResults = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { timeout: 3000 }
    );

    if (searchResults.ok) {
      const data = await searchResults.json();

      const intelligence: any = {
        roleInEcosystem: data.extract || `${name} is a participant in the DPI ecosystem working on digital public infrastructure.`,
        publications: [],
        eventsAppeared: [],
        interestTopics: extractTopicsFromText(data.extract || ''),
        wantsNeeds: inferNeedsFromRole(name, data.extract || ''),
        engagementStrategy: generateEngagementStrategy(name, data.extract || ''),
        leverageForAI4Inclusion: generateLeverageFromContext(name, data.extract || ''),
      };

      // Enhance with Tier 3 data sources
      const imageUrl = await fetchProfileImage(name);
      if (imageUrl) intelligence.profileImage = imageUrl;

      // Fetch publications from Google Scholar
      const scholarPublications = await fetchPublicationsFromScholar(name);
      if (scholarPublications.length > 0 && intelligence.publications.length === 0) {
        intelligence.publications = scholarPublications;
      }

      return intelligence;
    }
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
  }

  return generateIntelligenceFromName(name);
}

async function fetchProfileImage(name: string): Promise<string | null> {
  const sources = [
    () => fetchWikipediaImage(name),
    () => fetchGoogleScholarImage(name),
    () => fetchProfessionalHeadshot(name),
  ];

  // Try each source in order
  for (const source of sources) {
    try {
      const image = await source();
      if (image) return image;
    } catch (error) {
      console.error('Image source error:', error);
    }
  }

  return null;
}

async function fetchWikipediaImage(name: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { timeout: 3000, signal: AbortSignal.timeout(3000) }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.thumbnail?.source) {
        return data.thumbnail.source;
      }
    }
  } catch (error) {
    console.error('Wikipedia image error:', error);
  }
  return null;
}

async function fetchGoogleScholarImage(name: string): Promise<string | null> {
  try {
    // Google Scholar profile images are embedded in pages
    // We'll fetch the scholar page and look for profile images
    const searchUrl = `https://scholar.google.com/citations?mauthors=${encodeURIComponent(name)}&view_op=search_authors&hl=en&oi=ao`;
    
    const response = await fetch(searchUrl, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000,
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      // Look for profile image patterns in Google Scholar HTML
      const imageMatch = html.match(/src="([^"]+scholar.*jpg)"/i);
      if (imageMatch && imageMatch[1]) {
        return imageMatch[1].startsWith('http') ? imageMatch[1] : `https://scholar.google.com${imageMatch[1]}`;
      }
    }
  } catch (error) {
    console.error('Google Scholar image error:', error);
  }
  return null;
}

async function fetchProfessionalHeadshot(name: string): Promise<string | null> {
  try {
    // Try to construct professional headshot URLs from name patterns
    // Many organizations maintain standard photo URLs
    
    // LinkedIn-style pattern (won't work without auth, but good template)
    const patterns = [
      `https://www.linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
      // Add more patterns as needed
    ];
    
    // For now, return null - LinkedIn requires OAuth
    return null;
  } catch (error) {
    console.error('Professional headshot error:', error);
  }
  return null;
}

// Enhanced function to fetch publications from Google Scholar
async function fetchPublicationsFromScholar(name: string): Promise<string[]> {
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
      
      // Extract publication titles from Google Scholar results
      const pubPattern = /<h3 class="gs_rt[^"]*"><a[^>]*>([^<]+)<\/a><\/h3>/g;
      const publications: string[] = [];
      let match;
      
      while ((match = pubPattern.exec(html)) !== null && publications.length < 5) {
        const title = match[1].trim();
        if (title && title.length > 10) {
          publications.push(title);
        }
      }
      
      return publications;
    }
  } catch (error) {
    console.error('Google Scholar publications error:', error);
  }
  return [];
}

function extractTopicsFromText(text: string): string[] {
  const topics: string[] = [];
  const keywords = {
    'Digital Identity': ['identity', 'authentication', 'ID system'],
    'Payments': ['payment', 'finance', 'digital currency'],
    'Health': ['health', 'vaccination', 'medical'],
    'Education': ['education', 'learning', 'teaching'],
    'AI': ['artificial intelligence', 'machine learning', 'AI'],
    'Multilingual': ['multilingual', 'language', 'translation'],
  };

  const lowerText = text.toLowerCase();
  for (const [topic, keywords_arr] of Object.entries(keywords)) {
    if (keywords_arr.some(kw => lowerText.includes(kw.toLowerCase()))) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics : ['Digital Infrastructure', 'DPI Implementation'];
}

function inferNeedsFromRole(name: string, description: string): string {
  if (description.toLowerCase().includes('government') || description.toLowerCase().includes('minister')) {
    return 'Policy support, technical assistance in implementing DPI at national level, alignment with multilateral frameworks.';
  }
  if (description.toLowerCase().includes('foundation') || description.toLowerCase().includes('funder')) {
    return 'Portfolio expansion in DPI space, impact measurement frameworks, scalable models.';
  }
  if (description.toLowerCase().includes('research') || description.toLowerCase().includes('university')) {
    return 'Research partnerships, publication opportunities, access to real-world implementation data.';
  }
  return 'Partnership opportunities, visibility in DPI community, technical support.';
}

function generateEngagementStrategy(name: string, context: string): string {
  return `Connect with ${name} by highlighting complementary work in digital inclusion and AI. Share insights on multilingual DPI systems and offer to collaborate on pilot programs.`;
}

function generateLeverageFromContext(name: string, context: string): string {
  if (context.toLowerCase().includes('identity')) {
    return 'Explore integration of multilingual voice AI into identity verification systems for improved accessibility.';
  }
  if (context.toLowerCase().includes('payment')) {
    return 'Pilot voice-based payment authentication for low-literacy users in digital financial systems.';
  }
  if (context.toLowerCase().includes('health')) {
    return 'Leverage health DPI infrastructure for voice-enabled health information dissemination in local languages.';
  }
  return 'Partner on multilingual AI integration for DPI systems to ensure inclusive access across language barriers.';
}

function generateIntelligenceFromName(name: string): any {
  // Infer sector from name patterns
  const isGovernment = name.includes('Minister') || name.includes('Secretary') || name.includes('Government');
  const isMultilateral = name.includes('Bank') || name.includes('UN') || name.includes('ITU') || name.includes('WHO');
  const isFunder = name.includes('Foundation') || name.includes('Gates') || name.includes('Rockefeller');
  
  let role = 'Active participant in DPI ecosystem';
  let leverage = 'Explore AI4Inclusion integration opportunities';
  
  if (isGovernment) {
    role = 'Government leader in digital transformation and DPI implementation';
    leverage = 'Offer AI4Inclusion pilot opportunities in national DPI programs, especially for multilingual access.';
  } else if (isMultilateral) {
    role = 'International organization leader in digital development and infrastructure';
    leverage = 'Position AI4Inclusion as complementary to multilateral DPI standards and frameworks.';
  } else if (isFunder) {
    role = 'Philanthropic leader in technology and social impact';
    leverage = 'Engage as a potential funder or partner in scaling multilingual AI for DPIs.';
  }

  return {
    roleInEcosystem: role,
    wantsNeeds: 'Partnerships and scaling opportunities in DPI space',
    engagementStrategy: `Connect with ${name} by highlighting complementary initiatives and potential collaboration opportunities.`,
    leverageForAI4Inclusion: leverage,
    interestTopics: ['Digital Inclusion', 'DPI Implementation'],
    publications: [],
    eventsAppeared: [],
  };
}

