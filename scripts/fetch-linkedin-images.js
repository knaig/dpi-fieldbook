const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.join(__dirname, '../public/storage.json');
const OUTPUT_PATH = path.join(__dirname, '../public/storage.json');

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

// Save enriched data
function saveEnrichedActor(name, imageUrl) {
  const storage = getEnrichedActors();
  const actor = Object.values(storage).find(a => a.name === name);
  if (actor) {
    actor.profileImage = imageUrl;
    actor.lastEnriched = new Date().toISOString();
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(storage, null, 2));
    console.log(`✓ Updated ${name} with image: ${imageUrl}`);
    return true;
  }
  return false;
}

function getActorsWithoutImages() {
  const storage = getEnrichedActors();
  return Object.values(storage).filter(actor => !actor.profileImage || actor.profileImage === '');
}

async function fetchLinkedInImage(name, role, sector) {
  // This will be called from the browser context
  // For now, return the instructions
  console.log(`\nInstructions for fetching LinkedIn image for: ${name}`);
  console.log(`Role: ${role}, Sector: ${sector}`);
  console.log(`\nPlease navigate to LinkedIn and search for this person in the Playwright browser.`);
  console.log(`Then manually copy their profile image URL and provide it.`);
}

async function main() {
  const actorsWithoutImages = getActorsWithoutImages();
  
  console.log(`\n📸 Found ${actorsWithoutImages.length} actors without profile images`);
  console.log(`\nActors needing images:`);
  actorsWithoutImages.forEach((actor, i) => {
    console.log(`${i + 1}. ${actor.name} (${actor.role})`);
  });
  
  console.log(`\n📝 Next steps:`);
  console.log(`1. I'll help you fetch LinkedIn images using Playwright browser`);
  console.log(`2. Search for each actor on LinkedIn`);
  console.log(`3. Extract their profile image URL`);
  console.log(`4. Automatically save it to storage.json`);
  
  console.log(`\n✨ Starting LinkedIn image fetch...`);
  
  // Export data for Playwright to use
  fs.writeFileSync(
    path.join(__dirname, '../public/linkedin-fetch-list.json'),
    JSON.stringify(actorsWithoutImages.map(a => ({
      name: a.name,
      role: a.role,
      sector: a.sector,
    })), null, 2)
  );
  
  console.log(`\n✅ Prepared ${actorsWithoutImages.length} actors for image fetching`);
  console.log(`📄 List saved to: public/linkedin-fetch-list.json`);
}

main().catch(console.error);

