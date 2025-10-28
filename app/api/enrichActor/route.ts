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

  // Also get profile image
  const imageUrl = await fetchProfileImage(name);
  if (imageUrl) intelligence.profileImage = imageUrl;

  return intelligence;
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

      // Try to get image
      const imageUrl = await fetchProfileImage(name);
      if (imageUrl) intelligence.profileImage = imageUrl;

      return intelligence;
    }
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
  }

  return generateIntelligenceFromName(name);
}

async function fetchProfileImage(name: string): Promise<string | null> {
  try {
    // Try Wikipedia first
    const wikiResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { timeout: 3000 }
    );

    if (wikiResponse.ok) {
      const data = await wikiResponse.json();
      if (data.thumbnail?.source) {
        return data.thumbnail.source;
      }
    }
  } catch (error) {
    console.error('Image fetch error:', error);
  }

  return null;
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

