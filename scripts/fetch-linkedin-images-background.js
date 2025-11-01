const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.join(__dirname, '../public/storage.json');
const OUTPUT_PATH = path.join(__dirname, '../public/storage.json');
const PROGRESS_PATH = path.join(__dirname, '../public/linkedin-images-progress.json');

// Read existing enriched data
function getEnrichedActors() {
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

// Read progress
function getProgress() {
  if (fs.existsSync(PROGRESS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    } catch (e) {
      return { completed: [], failed: [] };
    }
  }
  return { completed: [], failed: [] };
}

// Save progress
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

// Get actors without images but with LinkedIn URLs
function getActorsNeedingImages() {
  const storage = getEnrichedActors();
  const progress = getProgress();
  
  return Object.values(storage).filter(actor => 
    !actor.profileImage || 
    actor.profileImage === '' &&
    actor.linkedinUrl &&
    actor.linkedinUrl !== '' &&
    !progress.completed.includes(actor.name) &&
    !progress.failed.includes(actor.name)
  );
}

// Update storage with image URL
function updateActorImage(name, imageUrl) {
  const storage = getEnrichedActors();
  Object.values(storage).forEach(actor => {
    if (actor.name === name) {
      actor.profileImage = imageUrl;
    }
  });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(storage, null, 2));
}

async function fetchImageForActor(actor) {
  console.log(`\n📸 Fetching image for: ${actor.name}`);
  console.log(`   LinkedIn: ${actor.linkedinUrl}`);
  
  try {
    // This will be called via browser automation
    // For now, we create a list of actors that need images
    return {
      name: actor.name,
      linkedinUrl: actor.linkedinUrl,
    };
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  const actorsNeedingImages = getActorsNeedingImages();
  const progress = getProgress();
  
  console.log(`\n📸 LinkedIn Image Fetcher`);
  console.log(`📊 Actors needing images: ${actorsNeedingImages.length}`);
  console.log(`✅ Already completed: ${progress.completed.length}`);
  
  if (actorsNeedingImages.length === 0) {
    console.log(`\n✅ All actors have images or are being processed!`);
    return;
  }
  
  // Save the list for browser automation
  fs.writeFileSync(
    path.join(__dirname, '../public/linkedin-images-to-fetch.json'),
    JSON.stringify(actorsNeedingImages, null, 2)
  );
  
  console.log(`\n📝 Saved ${actorsNeedingImages.length} actors to fetch`);
  console.log(`📄 File: public/linkedin-images-to-fetch.json`);
  console.log(`\n💡 Next: Use browser automation to fetch images from LinkedIn`);
  console.log(`   Each profile image needs to be extracted from the LinkedIn page`);
}

main().catch(console.error);

