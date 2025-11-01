import { NextRequest, NextResponse } from 'next/server';

// Perplexity API configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

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
    console.log(`[ENRICH] Starting enrichment for: ${actorName}, role: ${actorRole}, sector: ${actorSector}`);
    console.log(`[ENRICH] PERPLEXITY_API_KEY exists: ${!!PERPLEXITY_API_KEY}`);
    
    // Try Perplexity first if available
    if (PERPLEXITY_API_KEY) {
      console.log('[ENRICH] Using Perplexity API');
      try {
        const intelligence = await enrichWithPerplexity(
          actorName || '',
          actorRole,
          actorSector,
          actorContext
        );
        console.log(`[ENRICH] Perplexity returned ${Object.keys(intelligence).length} fields`);
        return NextResponse.json(intelligence);
      } catch (perplexityError) {
        console.error('[ENRICH] Perplexity error:', perplexityError);
        console.log('[ENRICH] Falling back to Wikipedia');
      }
    } else {
      console.log('[ENRICH] No Perplexity key found');
    }

    console.log('[ENRICH] No Perplexity key, falling back to Wikipedia');
    // Fallback to Wikipedia + pattern matching
    const intelligence = await enrichWithWikipedia(actorName || '');
    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('[ENRICH] Error:', error);
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

async function enrichWithPerplexity(
  name: string,
  role: string,
  sector: string,
  context: string
): Promise<any> {
  if (!PERPLEXITY_API_KEY) throw new Error('Perplexity API key not configured');

  const query = `You are researching ${name}, who holds the position of ${role} in ${sector}. Context: ${context}.

Please provide a comprehensive analysis of this person. Search the web for current information about their recent work, projects, publications, speaking engagements, initiatives, case studies, impact metrics, and activities related to Digital Public Infrastructure.

CRITICAL: For EACH field below that asks for case studies, projects, or initiatives, provide:
1. The name/title of the case study/project/initiative
2. Measurable impact (numbers, metrics, outcomes)
3. Key stakeholders/organizations involved

IMPORTANT: Return ONLY valid JSON, no other text. Use this exact structure:
{
  "roleInEcosystem": "detailed 2-3 sentence description of their current role and importance in digital public infrastructure",
  "interestTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "recentProjects": ["Project Name: Impact (numbers/metrics) - Key Stakeholders: Org1, Org2"],
  "keyInitiatives": ["Initiative Name: Impact description with metrics - Stakeholders: Org1, Org2, Org3"],
  "caseStudies": [
    {
      "title": "Name of case study/project",
      "description": "Detailed description of what was done",
      "impact": "Specific measurable impact with numbers, metrics, outcomes",
      "stakeholders": ["Organization 1", "Organization 2", "Organization 3"],
      "year": "2024 or most recent year"
    }
  ],
  "potentialPartnershipAreas": ["area of collaboration 1", "area 2", "area 3"],
  "currentFocus": "what they are currently working on or focused on with specific project names (2-3 sentences)",
  "painPoints": "key challenges or problems they are trying to solve with context (2-3 sentences)",
  "expertiseAreas": ["their expertise area 1", "area 2", "area 3"],
  "wantsNeeds": "what they need or want to achieve (2-3 sentences)",
  "engagementStrategy": "specific detailed strategy for engaging this person with concrete talking points (3-4 sentences)",
  "leverageForAI4Inclusion": "how to leverage this relationship for multilingual voice AI in DPIs with specific examples (3-4 sentences)",
  "speakingTopics": ["topic they speak about 1", "topic 2"],
  "recentNewsOrAchievements": "recent news, achievements, or notable work with specific details (2-3 sentences)",
  "relevantQuotes": "any notable quotes or statements from them (1-2 sentences)",
  "networkContext": "who they work with or are connected to, name specific organizations (2-3 sentences)",
  "publications": ["specific publication title 1", "publication 2"],
  "eventsAppeared": ["event name 1 with year", "event name 2 with year"]
}

Search for recent, specific, factual information. Include actual numbers, metrics, and organization names. Be comprehensive and detailed.`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Digital Public Infrastructure (DPI) and ecosystem mapping. You must return ONLY valid JSON with ALL requested fields filled with specific, factual information.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
    temperature: 0.7,
    max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No response from Perplexity');

  console.log('[PERPLEXITY] Raw response length:', content.length);
  console.log('[PERPLEXITY] First 200 chars:', content.substring(0, 200));

  // Try to parse JSON from the response
  let intelligence;
  try {
    intelligence = JSON.parse(content);
    console.log('[PERPLEXITY] Successfully parsed JSON');
  } catch (e) {
    console.log('[PERPLEXITY] Not pure JSON, trying to extract JSON object');
    // If not JSON, extract JSON object from text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      intelligence = JSON.parse(jsonMatch[0]);
      console.log('[PERPLEXITY] Extracted JSON from text');
    } else {
      console.error('[PERPLEXITY] Could not extract JSON. Content:', content);
      throw new Error('Could not extract JSON from Perplexity response');
    }
  }
  
  console.log('[PERPLEXITY] Parsed intelligence has fields:', Object.keys(intelligence));

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
  console.log(`[IMAGE] Fetching profile image for: ${name}`);
  const sources = [
    () => fetchWikipediaImage(name),
    () => fetchGoogleScholarImage(name),
    () => fetchProfessionalHeadshot(name),
  ];

  // Try each source in order
  for (const source of sources) {
    try {
      const image = await source();
      if (image) {
        console.log(`[IMAGE] Found image: ${image}`);
        return image;
      }
    } catch (error) {
      console.error(`[IMAGE] Image source error:`, error);
    }
  }

  console.log(`[IMAGE] No image found for: ${name}`);
  return null;
}

async function fetchWikipediaImage(name: string): Promise<string | null> {
  try {
    // Try exact name first
    let response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
    );

    if (!response.ok && name.includes('.')) {
      // Try with common prefixes/suffixes
      const nameWithPrefix = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s*/i, '');
      if (nameWithPrefix !== name) {
        response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameWithPrefix)}`,
        );
      }
    }

    if (response.ok) {
      const data = await response.json();
      if (data.thumbnail?.source) {
        console.log(`[IMAGE] Wikipedia found: ${data.thumbnail.source}`);
        return data.thumbnail.source;
      }
    }
  } catch (error) {
    console.error('[IMAGE] Wikipedia image error:', error);
  }
  return null;
}

async function fetchGoogleScholarImage(name: string): Promise<string | null> {
  try {
    // Try DuckDuckGo image search for professional headshots
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`"${name}" professional photo headshot`)}`;
    
    const response = await fetch(searchUrl, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const html = await response.text();
      // Look for image URLs in search results (common professional photo hosting)
      const imagePatterns = [
        /src="(https:\/\/[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
        /src='(https:\/\/[^"]*\.(jpg|jpeg|png|webp)[^"]*)'/gi,
      ];
      
      for (const pattern of imagePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && !match[1].includes('logo') && !match[1].includes('icon')) {
          console.log(`[IMAGE] Found via DuckDuckGo: ${match[1]}`);
          return match[1];
        }
      }
    }
  } catch (error) {
    console.error('[IMAGE] Google Scholar/DuckDuckGo image error:', error);
  }
  return null;
}

async function fetchProfessionalHeadshot(name: string): Promise<string | null> {
  // Manual curated images for known actors - add more as needed
  const knownImages: Record<string, string> = {
    'Doreen Bogdan-Martin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/2025_Doreen_Bogdan-Martin_%28cropped%29.jpg/330px-2025_Doreen_Bogdan-Martin_%28cropped%29.jpg',
    'Nandan Nilekani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Nandan_M._Nilekani.jpg/330px-Nandan_M._Nilekani.jpg',
    'Grete Faremo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Grete_Faremo_2016.png/330px-Grete_Faremo_2016.png',
    'Justin Cook': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/AWS_Logo.jpg/330px-AWS_Logo.jpg',
    'Sunil Abraham': 'https://cis-india.org/files/sunil-abraham.jpg',
  };

  // Check if we have a known image
  if (knownImages[name]) {
    return knownImages[name];
  }

  // Try to construct organization-based profile URLs
  const orgProfiles: Record<string, { pattern: string; baseUrl: string }> = {
    'UNICEF': { pattern: 'chris-fabian', baseUrl: 'https://www.unicef.org/staff' },
    'UNDP': { pattern: 'grete-faremo', baseUrl: 'https://www.undp.org/staff' },
    // Add more organizations as needed
  };

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

