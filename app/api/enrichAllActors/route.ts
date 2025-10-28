import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Batch enrichment for all actors
 * Calls enrichActor for each actor in the initial list
 */
const initialActors = [
  "H.E. Mr. Solly Malatsi",
  "Halima Letamo",
  "David Hutchison",
  "Michelle Ringuette",
  "Srikanth Nadhamuni",
  "Tarun Wadhwa",
  "Doreen Bogdan-Martin",
  "Cosmas Zavazava",
  "Stefan Schweinfest",
  "Robert Opp",
  "Pramod Varma",
  "R S Sharma",
  "Nandan Nilekani",
  "Karrie Karu",
  "Marten Kaevats",
  "Anir Chowdhury",
  "Julian Kyula",
  "Denis Villorente",
  "Brian Ngo",
  "Tiago Cravo Oliveira Hashiguchi",
  "Chris Fabian",
  "Dennis Weller",
  "Elizabeth White",
  "Zia Khan",
  "Sarah Hubbard",
  "Alan Gelb",
  "Grete Faremo",
  "Rajagopalan Rajesh",
  "Anindita Dasgupta",
  "Sujith Narayanan",
  "Andrew Shikiar",
  "Carol L Stimmel",
  "Justin Cook",
  "Dorothea Klein",
  "Benjamin Adams",
  "Salah Goss",
  "Estelle Massé",
  "Laura O'Brien",
  "Sunil Abraham",
  "Nicole Anand",
  "Rajesh Aggarwal",
  "Amir Alexander Hasson",
];

export async function POST(request: NextRequest) {
  try {
    const results = [];
    
    // Enrich each actor
    for (const actorName of initialActors) {
      try {
        console.log(`Enriching: ${actorName}`);
        
        // Call the enrich endpoint for this actor
        // Note: This assumes actors are already imported
        const response = await fetch(
          `http://localhost:3000/api/enrichActor?name=${encodeURIComponent(actorName)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            name: actorName,
            success: true,
            data: Object.keys(data).length + ' fields enriched',
          });
        } else {
          results.push({
            name: actorName,
            success: false,
            error: 'Failed to enrich',
          });
        }
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        results.push({
          name: actorName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      total: initialActors.length,
      successful: results.filter(r => r.success).length,
      results,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Batch enrichment failed',
    }, { status: 500 });
  }
}

