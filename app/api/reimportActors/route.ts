import { NextResponse } from 'next/server';

// This endpoint clears all actors and returns fresh data
export async function POST() {
  try {
    // Import fresh actor data
    const response = await fetch('http://localhost:3000/api/importActors', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Actors ready for import',
      count: data.count,
      actors: data.actors,
      instructions: 'Visit /init to import these actors'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to prepare actors'
    }, { status: 500 });
  }
}

