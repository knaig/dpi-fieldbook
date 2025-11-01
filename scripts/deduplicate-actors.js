const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '../public/storage.json');

console.log('🔍 Starting deduplication analysis...\n');

const storage = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
const entries = Object.values(storage);

console.log(`📊 Total entries: ${entries.length}`);

// Track duplicates by various criteria
const seenById = new Map();
const seenByName = new Map();
const seenByFirstNameLastName = new Map();
const seenByCompanyRole = new Map();

const duplicateIds = [];
const duplicateNames = [];
const duplicateFullNames = [];
const duplicateCompanyRoles = [];

entries.forEach((entry, index) => {
  // Check for duplicate IDs
  if (entry.id) {
    if (seenById.has(entry.id)) {
      duplicateIds.push({ id: entry.id, entry1: seenById.get(entry.id), entry2: entry });
    } else {
      seenById.set(entry.id, entry);
    }
  }

  // Check for duplicate names (normalized)
  if (entry.name && typeof entry.name === 'string' && entry.name.trim() && !entry.name.startsWith('Actor ')) {
    const normalizedName = entry.name.toLowerCase().trim();
    if (seenByName.has(normalizedName)) {
      duplicateNames.push({ name: entry.name, entry1: seenByName.get(normalizedName), entry2: entry });
    } else {
      seenByName.set(normalizedName, entry);
    }
  }

  // Check for duplicate firstName + lastName
  if (entry.firstName && entry.lastName) {
    const fullNameKey = `${entry.firstName.toLowerCase()}-${entry.lastName.toLowerCase()}`;
    if (seenByFirstNameLastName.has(fullNameKey)) {
      duplicateFullNames.push({ 
        name: `${entry.firstName} ${entry.lastName}`, 
        entry1: seenByFirstNameLastName.get(fullNameKey), 
        entry2: entry 
      });
    } else {
      seenByFirstNameLastName.set(fullNameKey, entry);
    }
  }

  // Check for duplicate company + role (potential same person, different entry)
  const company = (entry.summitCompany || entry.sector || '').toLowerCase().trim();
  const role = (entry.contactRole || '').toLowerCase().trim();
  if (company && role && company !== 'other' && role !== '') {
    const key = `${company}|${role}`;
    if (seenByCompanyRole.has(key)) {
      duplicateCompanyRoles.push({ 
        company: entry.summitCompany || entry.sector, 
        role: entry.contactRole,
        entry1: seenByCompanyRole.get(key), 
        entry2: entry 
      });
    } else {
      seenByCompanyRole.set(key, entry);
    }
  }
});

console.log('📈 Duplicate Detection Results:');
console.log(`   - Duplicate IDs: ${duplicateIds.length}`);
console.log(`   - Duplicate names: ${duplicateNames.length}`);
console.log(`   - Duplicate firstName+lastName: ${duplicateFullNames.length}`);
console.log(`   - Duplicate company+role: ${duplicateCompanyRoles.length}\n`);

// Decide which entries to keep and which to remove
const entriesToRemove = new Set();
const entriesToKeep = new Set();

// Strategy: Keep the entry with the most data (most fields populated)
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
  return score;
}

// Handle duplicates by name
duplicateNames.forEach(({ name, entry1, entry2 }) => {
  const score1 = getRichnessScore(entry1);
  const score2 = getRichnessScore(entry2);
  
  if (score1 > score2) {
    entriesToRemove.add(entry2.id);
    entriesToKeep.add(entry1.id);
  } else if (score2 > score1) {
    entriesToRemove.add(entry1.id);
    entriesToKeep.add(entry2.id);
  } else {
    // Same richness, keep the first one
    entriesToRemove.add(entry2.id);
    entriesToKeep.add(entry1.id);
  }
});

// Handle duplicates by firstName+lastName
duplicateFullNames.forEach(({ name, entry1, entry2 }) => {
  if (entriesToRemove.has(entry1.id) || entriesToRemove.has(entry2.id)) return; // Already handled
  
  const score1 = getRichnessScore(entry1);
  const score2 = getRichnessScore(entry2);
  
  if (score1 > score2) {
    entriesToRemove.add(entry2.id);
    entriesToKeep.add(entry1.id);
  } else if (score2 > score1) {
    entriesToRemove.add(entry1.id);
    entriesToKeep.add(entry2.id);
  } else {
    entriesToRemove.add(entry2.id);
    entriesToKeep.add(entry1.id);
  }
});

// Handle duplicates by company+role (more conservative - might be different people)
duplicateCompanyRoles.forEach(({ company, role, entry1, entry2 }) => {
  if (entriesToRemove.has(entry1.id) || entriesToRemove.has(entry2.id)) return; // Already handled
  
  // Only remove if they have the same name too
  const name1 = (entry1.name || '').toLowerCase().trim();
  const name2 = (entry2.name || '').toLowerCase().trim();
  const firstName1 = (entry1.firstName || '').toLowerCase().trim();
  const lastName1 = (entry1.lastName || '').toLowerCase().trim();
  const firstName2 = (entry2.firstName || '').toLowerCase().trim();
  const lastName2 = (entry2.lastName || '').toLowerCase().trim();
  
  if (name1 === name2 || (firstName1 === firstName2 && lastName1 === lastName2 && firstName1)) {
    const score1 = getRichnessScore(entry1);
    const score2 = getRichnessScore(entry2);
    
    if (score1 > score2) {
      entriesToRemove.add(entry2.id);
      entriesToKeep.add(entry1.id);
    } else if (score2 > score1) {
      entriesToRemove.add(entry1.id);
      entriesToKeep.add(entry2.id);
    } else {
      entriesToRemove.add(entry2.id);
      entriesToKeep.add(entry1.id);
    }
  }
});

console.log(`🗑️  Planning to remove ${entriesToRemove.size} duplicate entries`);
console.log(`✅ Planning to keep ${entriesToKeep.size} entries\n`);

// Show what will be removed
if (entriesToRemove.size > 0) {
  console.log('📋 Sample entries to be removed (first 10):');
  let count = 0;
  for (const entry of entries) {
    if (entriesToRemove.has(entry.id)) {
      console.log(`   - ID: ${entry.id}, Name: ${entry.name || 'N/A'}, Company: ${entry.summitCompany || 'N/A'}`);
      count++;
      if (count >= 10) break;
    }
  }
  console.log('');
}

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`\n❓ Remove ${entriesToRemove.size} duplicates? (yes/no): `, (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    // Remove duplicates
    Object.keys(storage).forEach(key => {
      if (entriesToRemove.has(storage[key].id)) {
        delete storage[key];
      }
    });

    // Save cleaned storage
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));

    console.log(`\n✅ Deduplication complete!`);
    console.log(`   - Removed: ${entriesToRemove.size} duplicates`);
    console.log(`   - Remaining: ${Object.keys(storage).length} unique entries`);
    console.log(`\n🎯 Storage cleaned and ready to sync!`);
  } else {
    console.log('\n⏭️  Deduplication cancelled. No changes made.');
  }
  
  rl.close();
});

