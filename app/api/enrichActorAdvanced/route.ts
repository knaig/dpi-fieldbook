import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { actor } = await request.json();
    const name = actor?.name || '';
    const role = actor?.contactRole || '';
    const sector = actor?.sector || '';

    // Multi-source intelligence gathering
    const [wikipediaData, googleData, linkedinData] = await Promise.all([
      fetchWikipediaData(name),
      fetchGoogleSearchData(name),
      fetchLinkedInData(name),
    ]);

    // Combine data sources
    const combinedData = {
      ...wikipediaData,
      ...googleData,
      role,
      sector,
    };

    // Extract structured intelligence
    const intelligence = {
      interestTopics: extractInterestTopics(combinedData),
      publications: extractPublications(combinedData),
      eventsAppeared: extractEvents(combinedData),
      roleInEcosystem: generateRoleDescription(name, role, sector, combinedData),
      wantsNeeds: generateWantsNeeds(combinedData),
      engagementStrategy: generateEngagementStrategy(name, combinedData),
      leverageForAI4Inclusion: generateLeverage(combinedData),
      profileImage: await fetchProfileImage(name),
    };

    return NextResponse.json({ success: true, intelligence });
  } catch (error) {
    console.error('Advanced enrichment error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to enrich actor data' 
    }, { status: 500 });
  }
}

async function fetchWikipediaData(name: string) {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { timeout: 3000 }
    );
    if (response.ok) {
      const data = await response.json();
      return {
        bio: data.extract,
        image: data.thumbnail?.source,
        fullUrl: data.content_urls?.desktop?.page,
      };
    }
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
  }
  return {};
}

async function fetchGoogleSearchData(name: string) {
  try {
    // Using DuckDuckGo for privacy-friendly search
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(name + ' DPI digital public infrastructure')}&format=json&no_html=1&skip_disambig=1`,
      { timeout: 3000 }
    );
    if (response.ok) {
      const data = await response.json();
      return {
        relatedTopics: data.RelatedTopics?.map((t: any) => t.Text).slice(0, 5) || [],
        abstract: data.Abstract,
      };
    }
  } catch (error) {
    console.error('Search fetch error:', error);
  }
  return {};
}

async function fetchLinkedInData(name: string) {
  try {
    // Note: LinkedIn API requires authentication
    // For now, return empty - you'd need LinkedIn OAuth setup
    return {};
  } catch (error) {
    console.error('LinkedIn fetch error:', error);
    return {};
  }
}

async function fetchProfileImage(name: string) {
  try {
    // Try to get Wikipedia image
    const wiki = await fetchWikipediaData(name);
    if (wiki.image) return wiki.image;

    // Fallback: Try profile image from a known service
    // You can add more sources here like:
    // - LinkedIn profile (requires API)
    // - Google Images API
    // - Organization profile pages
    
    return null;
  } catch (error) {
    console.error('Image fetch error:', error);
    return null;
  }
}

function extractInterestTopics(data: any): string[] {
  const topics: string[] = [];
  const text = `${data.bio || ''} ${data.abstract || ''} ${data.relatedTopics?.join(' ') || ''}`.toLowerCase();
  
  const keywordMap = {
    'Digital Identity': ['identity', 'authentication', 'verification', 'credential', 'ID system'],
    'Payments & Finance': ['payment', 'financial', 'fintech', 'digital currency', 'banking'],
    'Health & Immunization': ['health', 'vaccination', 'immunization', 'medical', 'public health'],
    'Education': ['education', 'learning', 'teaching', 'student'],
    'AI & Machine Learning': ['AI', 'artificial intelligence', 'machine learning', 'ML'],
    'Multilingual Systems': ['multilingual', 'language', 'translation', 'localization'],
    'Digital Governance': ['governance', 'policy', 'regulation', 'goverance'],
    'Cybersecurity': ['security', 'privacy', 'cybersecurity', 'data protection'],
    'Open Source': ['open source', 'open-source', 'OSS'],
    'Infrastructure': ['infrastructure', 'infrastructure'],
  };

  for (const [topic, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics : ['Digital Public Infrastructure', 'DPI Implementation'];
}

function extractPublications(data: any): string[] {
  const publications: string[] = [];
  const bio = data.bio || '';
  
  // Extract publication-like patterns from bio
  const pubPatterns = [
    /"([^"]+)"/g, // Quoted titles
    /([A-Z][a-z]+ [A-Z][a-z]+ (?:Report|Study|Paper|Book))/g,
  ];

  for (const pattern of pubPatterns) {
    const matches = bio.match(pattern);
    if (matches) {
      publications.push(...matches.slice(0, 3));
    }
  }

  return publications;
}

function extractEvents(data: any): string[] {
  const events: string[] = [];
  const bio = data.bio || '';
  
  // Look for event patterns
  const eventPatterns = [
    /((?:World|Global|International|Africa|India).*(?:Summit|Conference|Forum|Roundtable|Week))/gi,
    /(\d{4}.*(?:Summit|Conference|Forum))/g,
  ];

  for (const pattern of eventPatterns) {
    const matches = bio.match(pattern);
    if (matches) {
      events.push(...matches.slice(0, 5));
    }
  }

  return events;
}

function generateRoleDescription(name: string, role: string, sector: string, data: any): string {
  let description = '';

  if (data.bio) {
    description = data.bio.substring(0, 200);
  } else if (role) {
    description = `${name} serves as ${role}`;
    if (sector) {
      description += ` in the ${sector} sector`;
    }
    description += ', working on digital public infrastructure initiatives.';
  } else {
    description = `${name} is an active participant in the DPI ecosystem.`;
  }

  return description;
}

function generateWantsNeeds(data: any): string {
  const text = `${data.bio || ''} ${data.abstract || ''}`.toLowerCase();

  if (text.includes('government') || text.includes('minister') || text.includes('minister')) {
    return 'Policy support, technical assistance for national DPI programs, alignment with multilateral frameworks, and expert advice on inclusive digital transformation.';
  }
  if (text.includes('foundation') || text.includes('funder') || text.includes('grant')) {
    return 'Portfolio expansion in DPI space, scalable impact models, and opportunities to fund innovative multilingual and inclusive digital solutions.';
  }
  if (text.includes('research') || text.includes('university') || text.includes('institute')) {
    return 'Research partnerships, publication opportunities, access to real-world implementation data, and collaboration on DPI standards and frameworks.';
  }
  if (text.includes('multilateral') || text.includes('UN') || text.includes('bank')) {
    return 'Standards development, technical assistance provision, country-level partnerships, and scaling proven DPI models across regions.';
  }

  return 'Partnerships and collaboration opportunities, visibility in the DPI community, technical support, and access to innovative solutions for inclusive digital infrastructure.';
}

function generateEngagementStrategy(name: string, data: any): string {
  const text = `${data.bio || ''} ${data.abstract || ''}`.toLowerCase();

  if (text.includes('AI') || text.includes('artificial intelligence')) {
    return `Engage with ${name} by positioning AI4Inclusion as complementary to their AI and digital transformation work. Highlight multilingual voice AI capabilities and offer pilot partnership opportunities.`;
  }
  if (text.includes('identity') || text.includes('authentication')) {
    return `Connect with ${name} to explore how multilingual voice AI can enhance identity verification systems, making them more accessible for low-literacy and marginalized populations.`;
  }
  if (text.includes('payment') || text.includes('financial')) {
    return `Partner with ${name} on voice-enabled payment authentication and financial inclusion initiatives. Demonstrate how voice AI can bridge the digital divide in financial services.`;
  }

  return `Position AI4Inclusion as a strategic complement to their DPI work. Emphasize shared values around inclusive technology and offer concrete pilot partnership opportunities.`;
}

function generateLeverage(data: any): string {
  const text = `${data.bio || ''} ${data.abstract || ''}`.toLowerCase();

  if (text.includes('identity')) {
    return 'Leverage their identity platform to pilot multilingual voice-based authentication, making systems more accessible for underserved communities.';
  }
  if (text.includes('payment') || text.includes('fintech')) {
    return 'Integrate voice AI into their payment infrastructure to enable low-literacy users to access digital financial services in their native languages.';
  }
  if (text.includes('health') || text.includes('vaccination')) {
    return 'Utilize their health DPI infrastructure to pilot voice-enabled health information dissemination, vaccine scheduling, and public health communications in local languages.';
  }
  if (text.includes('education') || text.includes('learning')) {
    return 'Partner on voice-powered educational content delivery in multiple languages, leveraging their platform to reach marginalized learner populations.';
  }

  return 'Pilot AI4Inclusion’s multilingual voice AI capabilities within their DPI ecosystem to demonstrate improved accessibility and inclusion outcomes.';
}

