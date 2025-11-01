#!/usr/bin/env node

/**
 * Batch enrichment script for all actors
 * Enriches all 42 actors sequentially via API calls
 */

const fs = require('fs');
const path = require('path');

// Read the actors from the API route that generates them
const actors = [
  { name: 'H.E. Mr. Solly Malatsi', sector: 'Government', role: 'Minister', context: 'Summit Speaker, Government Track' },
  { name: 'Halima Letamo', sector: 'Multilateral', role: 'Panel Moderator', context: 'Panel Moderator - Cities Reimagined' },
  { name: 'David Hutchison', sector: 'Multilateral', role: 'Digital Development', context: 'Digital Development' },
  { name: 'Michelle Ringuette', sector: 'Multilateral', role: 'Country DPI Programs', context: 'Country DPI Programs' },
  { name: 'Srikanth Nadhamuni', sector: 'Research', role: 'Open-source DPI', context: 'Open-source DPI, Technical Architecture' },
  { name: 'Tarun Wadhwa', sector: 'Research', role: 'DPI Policy', context: 'DPI Policy, Ecosystem Building' },
  { name: 'Doreen Bogdan-Martin', sector: 'Multilateral', role: 'Global Standards', context: 'Global Standards, Digital Divide' },
  { name: 'Cosmas Zavazava', sector: 'Multilateral', role: 'Development', context: 'Development, Capacity Building' },
  { name: 'Stefan Schweinfest', sector: 'Multilateral', role: 'Data Infrastructure', context: 'Data Infrastructure, SDGs' },
  { name: 'Robert Opp', sector: 'Multilateral', role: 'Digital Transformation', context: 'Digital Transformation, Country Support' },
  { name: 'Pramod Varma', sector: 'Government', role: 'Former UIDAI', context: 'Former UIDAI, India Stack Design' },
  { name: 'R S Sharma', sector: 'Government', role: 'Former Chairman TRAI', context: 'Former Chairman TRAI, Health DPIs' },
  { name: 'Nandan Nilekani', sector: 'Corporate', role: 'Digital Identity', context: 'Digital Identity, Financial Inclusion' },
  { name: 'Karrie Karu', sector: 'Government', role: 'e-Governance', context: 'e-Governance, Digital Identity' },
  { name: 'Marten Kaevats', sector: 'Government', role: 'Digital Transformation', context: 'Digital Transformation, X-road' },
  { name: 'Anir Chowdhury', sector: 'Government', role: 'Citizen Services', context: 'Citizen Services, Digital Innovation' },
  { name: 'Julian Kyula', sector: 'Government', role: 'Financial Inclusion', context: 'Financial Inclusion, Digital Payments' },
  { name: 'Denis Villorente', sector: 'Government', role: 'National ID', context: 'National ID, Digital Government' },
  { name: 'Brian Ngo', sector: 'Multilateral', role: 'Immunization Data', context: 'Immunization Data Systems' },
  { name: 'Tiago Cravo Oliveira Hashiguchi', sector: 'Multilateral', role: 'Health Information', context: 'Health Information Systems' },
  { name: 'Chris Fabian', sector: 'Multilateral', role: 'Digital Public Goods', context: 'Digital Public Goods, AI for Children' },
  { name: 'Dennis Weller', sector: 'Funder', role: 'DPI Financing', context: 'DPI Financing, Health Systems' },
  { name: 'Elizabeth White', sector: 'Funder', role: 'Financial Inclusion', context: 'Financial Inclusion, Payment Systems' },
  { name: 'Zia Khan', sector: 'Funder', role: 'Digital Inclusion', context: 'Digital Inclusion, Climate + DPI' },
  { name: 'Sarah Hubbard', sector: 'Funder', role: 'Digital Rights', context: 'Digital Rights, Inclusive Tech' },
  { name: 'Alan Gelb', sector: 'Research', role: 'DPI Economics', context: 'DPI Economics, ID Systems' },
  { name: 'Grete Faremo', sector: 'Research', role: 'Best Practices', context: 'Best Practices, Digital Development' },
  { name: 'Rajagopalan Rajesh', sector: 'Research', role: 'Open-source Identity', context: 'Open-source Identity Platform' },
  { name: 'Anindita Dasgupta', sector: 'Research', role: 'Digital Identity', context: 'Digital Identity, Privacy by Design' },
  { name: 'Sujith Narayanan', sector: 'Research', role: 'Open Commerce Protocols', context: 'Open Commerce Protocols, DPIs' },
  { name: 'Andrew Shikiar', sector: 'Research', role: 'Passwordless Authentication', context: 'Passwordless Authentication, Digital Identity' },
  { name: 'Carol L Stimmel', sector: 'Corporate', role: 'Cloud for Government', context: 'Cloud for Government' },
  { name: 'Justin Cook', sector: 'Corporate', role: 'Government Cloud', context: 'Government Cloud Solutions' },
  { name: 'Dorothea Klein', sector: 'Corporate', role: 'Digital Skills', context: 'Digital Skills, AI for Social Good' },
  { name: 'Benjamin Adams', sector: 'Corporate', role: 'Affordable Devices', context: 'Affordable Devices, Digital Inclusion' },
  { name: 'Salah Goss', sector: 'Corporate', role: 'Financial Inclusion', context: 'Financial Inclusion, Digital Payments' },
  { name: 'Estelle Massé', sector: 'NGO', role: 'Privacy', context: 'Privacy, Surveillance, Digital Rights' },
  { name: 'Laura O\'Brien', sector: 'NGO', role: 'Human Rights', context: 'Human Rights, DPI Governance' },
  { name: 'Sunil Abraham', sector: 'Research', role: 'Digital Rights', context: 'Digital Rights, Privacy' },
  { name: 'Nicole Anand', sector: 'Research', role: 'Data Governance', context: 'Data Governance, Responsible Tech' },
  { name: 'Rajesh Aggarwal', sector: 'Research', role: 'Identity Systems', context: 'Identity Systems, Privacy' },
  { name: 'Amir Alexander Hasson', sector: 'Research', role: 'DPI Implementation', context: 'DPI Implementation' },
];

const API_BASE = 'http://localhost:3000';
const STORAGE_PATH = path.join(__dirname, '../public/storage.json');
const PROGRESS_PATH = path.join(__dirname, '../public/enrichment-progress.json');
const CONCURRENT_REQUESTS = 5; // Process 5 actors in parallel
const FORCE_REENRICH = process.argv.includes('--force'); // Allow forcing re-enrichment

// Read existing storage if it exists
function getActorsFromStorage() {
  if (fs.existsSync(STORAGE_PATH)) {
    try {
      const data = fs.readFileSync(STORAGE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading storage:', e.message);
      return {};
    }
  }
  return {};
}

// Read progress checkpoint
function getProgress() {
  if (fs.existsSync(PROGRESS_PATH)) {
    try {
      const data = fs.readFileSync(PROGRESS_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return { enriched: [], startTime: Date.now() };
    }
  }
  return { enriched: [], startTime: Date.now() };
}

// Save progress checkpoint
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

// Check if actor was already enriched (has all required fields)
function isActorEnriched(name, storage) {
  if (FORCE_REENRICH) return false; // Force re-enrichment if flag is set
  
  const entry = Object.values(storage).find(a => a.name === name);
  if (!entry) return false;
  
  // Check if we have substantial enrichment data including case studies
  const hasRequiredFields = entry.roleInEcosystem && 
                           entry.interestTopics && 
                           entry.interestTopics.length > 0 &&
                           entry.wantsNeeds &&
                           entry.engagementStrategy &&
                           entry.caseStudies && 
                           entry.caseStudies.length > 0; // Require case studies
  
  return hasRequiredFields;
}

// Write enriched data to storage
function saveEnrichedActor(actorId, data) {
  const storage = getActorsFromStorage();
  storage[actorId] = {
    ...storage[actorId],
    ...data,
    lastEnriched: new Date().toISOString()
  };
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(storage, null, 2));
  console.log(`✓ Saved ${data.name} to storage`);
}

async function enrichActor(actor, index) {
  console.log(`\n[${index + 1}/${actors.length}] Enriching: ${actor.name}`);
  
  try {
    // Generate unique ID
    const actorId = `actor-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Call enrichment API
    const response = await fetch(
      `${API_BASE}/api/enrichActor?id=${encodeURIComponent(actorId)}&name=${encodeURIComponent(actor.name)}&role=${encodeURIComponent(actor.role)}&sector=${encodeURIComponent(actor.sector)}&context=${encodeURIComponent(actor.context)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const enrichedData = await response.json();
    
    // Save to storage
    saveEnrichedActor(actorId, {
      id: actorId,
      name: actor.name,
      sector: actor.sector,
      role: actor.role,
      summitContext: actor.context,
      ...enrichedData
    });
    
    return enrichedData;
  } catch (error) {
    console.error(`✗ Error enriching ${actor.name}:`, error.message);
    return null;
  }
}

// Process actors in batches with controlled concurrency
async function processBatch(actors, batchSize, startIndex) {
  const batch = [];
  
  for (let i = 0; i < batchSize && startIndex + i < actors.length; i++) {
    batch.push(enrichActor(actors[startIndex + i], startIndex + i));
  }
  
  return Promise.allSettled(batch);
}

async function main() {
  const progress = getProgress();
  const storage = getActorsFromStorage();
  
  console.log('🚀 Starting batch enrichment for all actors');
  console.log(`📊 Total actors: ${actors.length}`);
  console.log(`🔄 Concurrency: ${CONCURRENT_REQUESTS} parallel requests\n`);
  
  // Show already enriched actors
  const alreadyEnriched = actors.filter(a => isActorEnriched(a.name, storage));
  if (alreadyEnriched.length > 0) {
    console.log(`✅ Already enriched: ${alreadyEnriched.length}/${actors.length}`);
  }
  
  const remaining = actors.filter(a => !isActorEnriched(a.name, storage));
  console.log(`🔄 Remaining: ${remaining.length} actors to enrich`);
  console.log(`⏱️  Estimated time: ${Math.ceil(remaining.length * 30 / 60 / CONCURRENT_REQUESTS)} minutes (with ${CONCURRENT_REQUESTS}x parallelization)\n`);
  
  const startTime = progress.startTime || Date.now();
  let successCount = alreadyEnriched.length;
  let failCount = 0;
  let skipCount = 0;
  let currentIndex = 0;
  
  while (currentIndex < actors.length) {
    const actor = actors[currentIndex];
    
    // Skip if already enriched
    if (isActorEnriched(actor.name, storage)) {
      skipCount++;
      currentIndex++;
      continue;
    }
    
    // Process batch of actors in parallel
    const batch = [];
    let batchSize = 0;
    
    while (batchSize < CONCURRENT_REQUESTS && currentIndex < actors.length) {
      const currentActor = actors[currentIndex];
      if (!isActorEnriched(currentActor.name, storage)) {
        batch.push(enrichActor(currentActor, currentIndex));
        batchSize++;
      }
      currentIndex++;
    }
    
    if (batch.length === 0) continue;
    
    console.log(`\n📦 Processing batch of ${batch.length} actors...\n`);
    
    const results = await Promise.allSettled(batch);
    
    // Process results and update progress
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
        const actorName = result.value.name || 'Unknown';
        progress.enriched.push(actorName);
        progress.lastUpdated = new Date().toISOString();
        saveProgress(progress);
      } else {
        failCount++;
      }
    }
    
    // Short delay between batches
    if (currentIndex < actors.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  console.log(`\n\n✅ Batch enrichment complete!`);
  console.log(`📈 Success: ${successCount}/${actors.length}`);
  console.log(`⏭️  Skipped (already done): ${skipCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏱️  Total duration: ${duration} minutes`);
  console.log(`\n💾 Data saved to: ${STORAGE_PATH}`);
  
  // Clean up progress file on successful completion
  if (failCount === 0 && remaining.length === successCount - alreadyEnriched.length) {
    if (fs.existsSync(PROGRESS_PATH)) {
      fs.unlinkSync(PROGRESS_PATH);
      console.log('🗑️  Cleaned up progress file');
    }
  }
}

main().catch(console.error);

