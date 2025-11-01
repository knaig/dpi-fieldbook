import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'public', 'storage.json');

export async function POST(request: NextRequest) {
  try {
    // Read enriched data from storage.json
    if (!fs.existsSync(STORAGE_PATH)) {
      return NextResponse.json({ 
        success: true, 
        synced: 0,
        message: 'No enriched data found. Run enrichment first.' 
      });
    }

    const enrichedData = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
    
    // Extract the enriched intelligence data
    const enrichedIntelligence: Record<string, any> = {};
    Object.values(enrichedData).forEach((actor: any) => {
      if (actor.name) {
        enrichedIntelligence[actor.name] = {
          roleInEcosystem: actor.roleInEcosystem,
          interestTopics: actor.interestTopics,
          recentProjects: actor.recentProjects,
          keyInitiatives: actor.keyInitiatives,
          potentialPartnershipAreas: actor.potentialPartnershipAreas,
          currentFocus: actor.currentFocus,
          painPoints: actor.painPoints,
          expertiseAreas: actor.expertiseAreas,
          wantsNeeds: actor.wantsNeeds,
          engagementStrategy: actor.engagementStrategy,
          leverageForAI4Inclusion: actor.leverageForAI4Inclusion,
          speakingTopics: actor.speakingTopics,
          recentNewsOrAchievements: actor.recentNewsOrAchievements,
          relevantQuotes: actor.relevantQuotes,
          networkContext: actor.networkContext,
          publications: actor.publications,
          eventsAppeared: actor.eventsAppeared,
          profileImage: actor.profileImage,
          linkedinUrl: actor.linkedinUrl,
          linkedinHeadline: actor.linkedinHeadline,
          linkedinLocation: actor.linkedinLocation,
          linkedinConnections: actor.linkedinConnections,
          linkedinExperience: actor.linkedinExperience,
          linkedinEducation: actor.linkedinEducation,
          xHandle: actor.xHandle,
          xProfileUrl: actor.xProfileUrl,
          recentTweets: actor.recentTweets,
          dpiTweets: actor.dpiTweets,
          lastEnriched: actor.lastEnriched,
        };
      }
    });

    return NextResponse.json({ 
      success: true, 
      synced: Object.keys(enrichedIntelligence).length,
      enrichedIntelligence
    });

  } catch (error) {
    console.error('Error reading enriched data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to read enriched data' 
    }, { status: 500 });
  }
}

