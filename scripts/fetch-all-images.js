const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';
const STORAGE_PATH = path.join(__dirname, '../public/storage.json');
const PROGRESS_PATH = path.join(__dirname, '../public/linkedin-images-progress.json');

// Read existing enriched data
function getEnrichedActors() {
  if (fs.existsSync(STORAGE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

// Read progress
function getProgress() {
  if (fs.existsSync(PROGRESS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    } catch (e) {
      return { processed: [], failed: [] };
    }
  }
  return { processed: [], failed: [] };
}

// Save progress
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

// Update actor image in storage
function updateActorImage(name, imageUrl) {
  const storage = getEnrichedActors();
  let updated = false;
  
  Object.values(storage).forEach(actor => {
    if (actor.name === name) {
      actor.profileImage = imageUrl;
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(storage, null, 2));
  }
  
  return updated;
}

async function fetchImageForActor(actor) {
  console.log(`\n📸 [${actor.name}] Fetching image...`);
  console.log(`   LinkedIn: ${actor.linkedinUrl}`);
  
  try {
    const response = await fetch(`${API_BASE}/api/fetchLinkedInImage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: actor.name, linkedinUrl: actor.linkedinUrl })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.imageUrl) {
      updateActorImage(actor.name, data.imageUrl);
      console.log(`   ✓ Image found: ${data.imageUrl.substring(0, 80)}...`);
      return true;
    } else {
      console.log(`   ✗ No image found`);
      return false;
    }
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const storage = getEnrichedActors();
  const progress = getProgress();
  
  // Get actors that need images (have LinkedIn URL but no image)
  const actorsNeedingImages = Object.values(storage).filter(actor => 
    actor.linkedinUrl && 
    actor.linkedinUrl !== '' &&
    (!actor.profileImage || actor.profileImage === '') &&
    !progress.processed.includes(actor.name) &&
    !progress.failed.includes(actor.name)
  );
  
  console.log(`\n📸 LinkedIn Image Fetcher`);
  console.log(`📊 Actors needing images: ${actorsNeedingImages.length}`);
  console.log(`✅ Already processed: ${progress.processed.length}`);
  
  if (actorsNeedingImages.length === 0) {
    console.log(`\n✅ All actors have images or are being processed!`);
    return;
  }
  
  // Process each actor with delay to respect rate limits
  const DELAY_MS = 5000; // 5 seconds between requests
  
  for (let i = 0; i < actorsNeedingImages.length; i++) {
    const actor = actorsNeedingImages[i];
    console.log(`\n[${i + 1}/${actorsNeedingImages.length}] Processing: ${actor.name}`);
    
    const success = await fetchImageForActor(actor);
    
    if (success) {
      progress.processed.push(actor.name);
    } else {
      progress.failed.push(actor.name);
    }
    
    saveProgress(progress);
    
    // Delay between requests (except for the last one)
    if (i < actorsNeedingImages.length - 1) {
      console.log(`   ⏳ Waiting ${DELAY_MS/1000}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  console.log(`\n\n✅ LinkedIn image fetching complete!`);
  console.log(`📈 Processed: ${progress.processed.length}`);
  console.log(`❌ Failed: ${progress.failed.length}`);
  console.log(`\n💾 Progress saved to: ${PROGRESS_PATH}`);
  console.log(`💾 Storage updated: ${STORAGE_PATH}`);
}

main().catch(console.error);
