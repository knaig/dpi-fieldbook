import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const storagePath = path.join(process.cwd(), 'public', 'storage.json');
    
    if (!fs.existsSync(storagePath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'storage.json not found' 
      }, { status: 404 });
    }

    const storageData = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    const allEntries = Object.values(storageData) as any[];
    
    // Filter valid actors (must have id, and name OR at least one identifying field)
    const validActors = allEntries.filter(actor => {
      if (!actor || typeof actor !== 'object' || !actor.id || typeof actor.id !== 'string' || actor.id.trim() === '') {
        return false;
      }
      
      // Must have at least a name, or contactName, or summitCompany (for organizations)
      const hasName = actor.name && typeof actor.name === 'string' && actor.name.trim() !== '';
      const hasContactName = actor.contactName && typeof actor.contactName === 'string' && actor.contactName.trim() !== '';
      const hasCompany = actor.summitCompany && typeof actor.summitCompany === 'string' && actor.summitCompany.trim() !== '';
      
      return hasName || hasContactName || hasCompany;
    }).map(actor => {
      // Ensure name field exists - prefer firstName+lastName, then contactName, then generate
      // Also fix names that start with "Actor " or are just company names
      const needsName = !actor.name || 
                       typeof actor.name !== 'string' || 
                       actor.name.trim() === '' ||
                       actor.name.startsWith('Actor ') ||
                       (actor.summitCompany && actor.name === actor.summitCompany && actor.firstName);
      
      if (needsName) {
        // First try firstName + lastName (most accurate from scraping)
        if (actor.firstName && actor.lastName && 
            typeof actor.firstName === 'string' && typeof actor.lastName === 'string') {
          actor.name = `${actor.firstName.trim()} ${actor.lastName.trim()}`;
        } else if (actor.contactName && typeof actor.contactName === 'string' && actor.contactName.trim() !== '') {
          actor.name = actor.contactName.trim();
        } else if (actor.summitCompany && actor.contactRole) {
          actor.name = `${actor.contactRole} at ${actor.summitCompany}`;
        } else if (actor.summitCompany) {
          actor.name = actor.summitCompany;
        } else {
          // Extract numeric ID from actor-dpi-XXX format
          const idMatch = actor.id.match(/actor-dpi-(\d+)/);
          if (idMatch) {
            actor.name = `Actor ${idMatch[1]}`;
          } else {
            actor.name = `Actor ${actor.id}`;
          }
        }
      }
      
      return actor;
    });

    // Remove duplicates by ID
    const uniqueActors = new Map<string, any>();
    validActors.forEach(actor => {
      if (!uniqueActors.has(actor.id)) {
        uniqueActors.set(actor.id, actor);
      }
    });

    const actorsArray = Array.from(uniqueActors.values());

    return NextResponse.json({
      success: true,
      actors: actorsArray,
      count: actorsArray.length,
      message: `Found ${actorsArray.length} valid actors out of ${allEntries.length} total entries`,
    });
  } catch (error: any) {
    console.error('Error syncing actors:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to sync actors' 
    }, { status: 500 });
  }
}

