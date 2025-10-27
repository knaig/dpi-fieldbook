import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const actorId = searchParams.get('id');
  const actorName = searchParams.get('name');

  if (!actorId) {
    return NextResponse.json({ error: 'Actor ID required' }, { status: 400 });
  }

  try {
    // Use web search to find real data about the actor
    // This is a simplified version - you can enhance with OpenAI API or Claude for better extraction
    
    const searchTerm = actorName || 'DPI Summit speaker';
    const searchResults = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actorName || '')}`
    );

    let intelligence: any = {};

    if (searchResults.ok) {
      const data = await searchResults.json();
      
      intelligence = {
        roleInEcosystem: data.extract || `${actorName} is a participant in the DPI ecosystem working on digital public infrastructure.`,
        publications: [], // Would need to parse from Wikipedia or other sources
        eventsAppeared: [],
        interestTopics: extractTopicsFromText(data.extract || ''),
        wantsNeeds: inferNeedsFromRole(actorName || '', data.extract || ''),
        engagementStrategy: generateEngagementStrategy(actorName || '', data.extract || ''),
        leverageForAI4Inclusion: generateLeverageFromContext(actorName || '', data.extract || ''),
      };
    } else {
      // Fallback to intelligent generation based on name and any context
      intelligence = generateIntelligenceFromName(actorName || '');
    }

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('Enrichment error:', error);
    // Return mock data as fallback
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

