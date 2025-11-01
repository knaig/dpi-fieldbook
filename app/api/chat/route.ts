import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { actor, messages } = await request.json();

    if (!actor || !messages) {
      return NextResponse.json({ error: 'Actor and messages required' }, { status: 400 });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Build system prompt with actor context
    const actorContext = `
Actor Profile:
- Name: ${actor.name}
- Role: ${actor.contactRole || 'N/A'}
- Sector: ${actor.sector}
- Organization: ${(actor as any).summitCompany || 'N/A'}
- Inclusion Score: ${actor.inclusionScore}/10
- Follow-up Score: ${actor.followupScore}/10
- Role in Ecosystem: ${actor.roleInEcosystem || 'N/A'}
- Current Focus: ${actor.currentFocus || 'N/A'}
- Pain Points: ${actor.painPoints || 'N/A'}
- Expertise Areas: ${actor.expertiseAreas?.join(', ') || 'N/A'}
- Interest Topics: ${actor.interestTopics?.join(', ') || 'N/A'}
- Recent Projects: ${actor.recentProjects?.join('; ') || 'N/A'}
- Key Initiatives: ${actor.keyInitiatives?.join('; ') || 'N/A'}
- Partnership Areas: ${actor.potentialPartnershipAreas?.join(', ') || 'N/A'}
- Leverage for AI4Inclusion: ${actor.leverageForAI4Inclusion || 'N/A'}
- Engagement Strategy: ${actor.engagementStrategy || 'N/A'}
- Case Studies: ${(actor as any).caseStudies?.map((cs: any) => `${cs.title}: ${cs.description}`).join('; ') || 'N/A'}
- Notes: ${actor.notes || 'No notes yet'}
`;

    const systemPrompt = `You are an intelligent assistant helping with relationship management for the Digital Public Infrastructure (DPI) Summit. You have access to detailed information about ${actor.name}.

Your role is to:
1. Answer questions about this person's background, role, and interests
2. Suggest engagement strategies and talking points
3. Identify partnership opportunities
4. Recommend how to leverage this relationship for AI4Inclusion initiatives
5. Help prepare for meetings or conversations

Always be concise, actionable, and based on the provided context. If you don't have information, say so rather than making assumptions.

${actorContext}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

