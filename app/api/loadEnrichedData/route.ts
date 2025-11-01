import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'public', 'storage.json');

export async function GET(request: NextRequest) {
  try {
    // Read enriched data from storage.json
    if (!fs.existsSync(STORAGE_PATH)) {
      return NextResponse.json({ 
        success: true, 
        enrichedActors: {},
        message: 'No enriched data found' 
      });
    }

    const enrichedData = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
    
    // Return enriched data keyed by actor name for easy lookup
    const enrichedByName: Record<string, any> = {};
    Object.values(enrichedData).forEach((actor: any) => {
      if (actor.name) {
        enrichedByName[actor.name] = actor;
      }
    });

    return NextResponse.json({ 
      success: true, 
      enrichedActors: enrichedByName,
      count: Object.keys(enrichedByName).length
    });

  } catch (error) {
    console.error('Error reading enriched data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to read enriched data' 
    }, { status: 500 });
  }
}

