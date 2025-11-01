const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '../public/storage.json');

console.log('🔍 Finding and removing remaining duplicates...\n');

const storage = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
const entries = Object.values(storage);

console.log(`📊 Total entries: ${entries.length}`);

// Score function to determine which entry to keep
function getRichnessScore(entry) {
  let score = 0;
  if (entry.name && !entry.name.startsWith('Actor ')) score += 10;
  if (entry.firstName && entry.lastName) score += 5;
  if (entry.summitCompany) score += 3;
  if (entry.contactRole) score += 2;
  if (entry.profileImage) score += 2;
  if (entry.summitCountry) score += 1;
  if (entry.linkedinUrl) score += 3;
  if (entry.publications && entry.publications.length > 0) score += 2;
  if (entry.caseStudies && entry.caseStudies.length > 0) score += 5;
  if (entry.lastEnriched) score += 3;
  if (entry.expertiseAreas && entry.expertiseAreas.length > 0) score += 2;
  if (entry.interestTopics && entry.interestTopics.length > 0) score += 2;
  return score;
}

// Track duplicates by normalized name
const seenByName = new Map();
const duplicates = [];
const entriesToRemove = new Set();

entries.forEach(entry => {
  if (!entry || !entry.name || typeof entry.name !== 'string' || entry.name.trim() === '' || entry.name.startsWith('Actor ')) {
    return;
  }
  
  const normalizedName = entry.name.toLowerCase().trim();
  
  if (seenByName.has(normalizedName)) {
    const existingEntry = seenByName.get(normalizedName);
    duplicates.push({
      name: entry.name,
      entry1: existingEntry,
      entry2: entry
    });
    
    // Decide which to keep based on richness score
    const score1 = getRichnessScore(existingEntry);
    const score2 = getRichnessScore(entry);
    
    if (score1 > score2) {
      entriesToRemove.add(entry.id);
      console.log(`   Removing: ${entry.name} (${entry.id}) - keeping ${existingEntry.id} (score: ${score2} vs ${score1})`);
    } else if (score2 > score1) {
      entriesToRemove.add(existingEntry.id);
      console.log(`   Removing: ${existingEntry.name} (${existingEntry.id}) - keeping ${entry.id} (score: ${score1} vs ${score2})`);
      // Update the map with the better entry
      seenByName.set(normalizedName, entry);
    } else {
      // Same score, prefer the one with DPI ID (more likely to be from scraping)
      if (entry.id.includes('actor-dpi-') && !existingEntry.id.includes('actor-dpi-')) {
        entriesToRemove.add(existingEntry.id);
        seenByName.set(normalizedName, entry);
        console.log(`   Removing: ${existingEntry.name} (${existingEntry.id}) - keeping ${entry.id} (preferring DPI ID)`);
      } else {
        entriesToRemove.add(entry.id);
        console.log(`   Removing: ${entry.name} (${entry.id}) - keeping ${existingEntry.id} (preferring first occurrence)`);
      }
    }
  } else {
    seenByName.set(normalizedName, entry);
  }
});

console.log(`\n🗑️  Will remove ${entriesToRemove.size} duplicate entries\n`);

// Remove duplicates from storage
let removedCount = 0;
Object.keys(storage).forEach(key => {
  if (entriesToRemove.has(storage[key].id)) {
    delete storage[key];
    removedCount++;
  }
});

// Save cleaned storage
fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));

console.log(`✅ Deduplication complete!`);
console.log(`   - Removed: ${removedCount} duplicates`);
console.log(`   - Remaining: ${Object.keys(storage).length} unique entries`);

// Verify no duplicates remain
const finalEntries = Object.values(storage);
const finalByName = new Map();
let finalDupes = 0;
finalEntries.forEach(e => {
  if (e && e.name && e.name.trim() && !e.name.startsWith('Actor ')) {
    const key = e.name.toLowerCase().trim();
    if (finalByName.has(key)) {
      finalDupes++;
    } else {
      finalByName.set(key, e);
    }
  }
});

if (finalDupes === 0) {
  console.log(`\n✅ Verification: No duplicate names remaining!`);
} else {
  console.log(`\n⚠️  Warning: ${finalDupes} duplicate names still found`);
}

console.log(`\n🎯 Storage cleaned and ready to sync!`);

