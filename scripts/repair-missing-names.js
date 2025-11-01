const fs = require('fs');
const path = require('path');

// Read the complete scraped attendee data
const COMPLETE_FILE = path.join(__dirname, '../public/dpi-all-attendees-complete.json');
const STORAGE_FILE = path.join(__dirname, '../public/storage.json');

if (!fs.existsSync(COMPLETE_FILE)) {
  console.error('❌ dpi-all-attendees-complete.json not found!');
  process.exit(1);
}

console.log('📖 Reading complete attendee data...');
const completeData = JSON.parse(fs.readFileSync(COMPLETE_FILE, 'utf-8'));
const attendees = Array.isArray(completeData) ? completeData : Object.values(completeData);

console.log(`✅ Found ${attendees.length} attendees in complete file`);

// Create a map by ID for quick lookup
const attendeesById = new Map();
const attendeesByCompanyTitle = new Map();

attendees.forEach(att => {
  if (att.id) {
    attendeesById.set(String(att.id), att);
  }
  // Also index by company+title for fuzzy matching
  if (att.company && att.title) {
    const key = `${att.company}|${att.title}`.toLowerCase();
    attendeesByCompanyTitle.set(key, att);
  }
});

console.log(`📊 Indexed ${attendeesById.size} attendees by ID`);

// Read storage.json
console.log('📖 Reading storage.json...');
const storage = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
const entries = Object.values(storage);

console.log(`📊 Found ${entries.length} entries in storage`);

let repaired = 0;
let created = 0;

// Try to repair existing entries
entries.forEach(entry => {
  if (!entry.id) return;
  
  // Try to find by ID (some IDs might be like "actor-dpi-38488440-0")
  let match = null;
  
  // Extract numeric ID from actor-dpi-XXX format
  const numericIdMatch = entry.id.match(/actor-dpi-(\d+)/);
  if (numericIdMatch) {
    const numericId = numericIdMatch[1];
    match = attendeesById.get(numericId);
  }
  
  // If not found by ID, try by company + role
  if (!match && entry.summitCompany && entry.contactRole) {
    const key = `${entry.summitCompany}|${entry.contactRole}`.toLowerCase();
    match = attendeesByCompanyTitle.get(key);
  }
  
  if (match && match.firstName && match.lastName) {
    const fullName = `${match.firstName} ${match.lastName}`;
    
    // Only update if name is missing or was generated
    if (!entry.name || 
        entry.name.startsWith('Actor ') || 
        entry.name.includes(' at ') ||
        entry.name === entry.summitCompany) {
      entry.name = fullName;
      entry.firstName = match.firstName;
      entry.lastName = match.lastName;
      
      // Also update other missing fields
      if (!entry.summitCompany && match.company) {
        entry.summitCompany = match.company;
      }
      if (!entry.contactRole && match.title) {
        entry.contactRole = match.title;
      }
      if (!entry.summitCountry && match.country) {
        entry.summitCountry = match.country;
        entry.summitCountryCode = match.countryCode;
      }
      if (!entry.summitWeb && match.web) {
        entry.summitWeb = match.web;
      }
      if (!entry.summitIndustry && match.industry) {
        entry.summitIndustry = match.industry;
      }
      if (!entry.profileImage && match.photoUrl) {
        entry.profileImage = match.photoUrl;
      }
      
      repaired++;
    }
  }
});

// Add any missing attendees that weren't imported
const existingIds = new Set(entries.map(e => {
  const match = e.id.match(/actor-dpi-(\d+)/);
  return match ? match[1] : null;
}).filter(Boolean));

attendees.forEach(att => {
  const id = String(att.id);
  if (!existingIds.has(id) && att.firstName && att.lastName) {
    const actorId = `actor-dpi-${id}`;
    
    // Check if this ID already exists with a different format
    const existing = entries.find(e => {
      const match = e.id.match(/actor-dpi-(\d+)/);
      return match && match[1] === id;
    });
    
    if (!existing) {
      const newActor = {
        id: actorId,
        name: `${att.firstName} ${att.lastName}`,
        firstName: att.firstName,
        lastName: att.lastName,
        sector: extractSector(att.company, att.title, att.industry),
        motive: 'Summit Attendee',
        pitch: '',
        inclusionScore: 7,
        followupScore: 8,
        spokenTo: false,
        contactName: `${att.firstName} ${att.lastName}`,
        contactRole: att.title || '',
        notes: `Attendee at Global DPI Summit 2025. Company: ${att.company || 'Unknown'}`,
        nextAction: 'To be determined at Summit',
        buckets: att.country ? [att.country] : [],
        summitContext: 'Attending Global DPI Summit 2025',
        summitSourceTags: ['Summit Attendee', 'Community Page'],
        summitCompany: att.company || '',
        summitIndustry: att.industry || '',
        summitCountry: att.country || '',
        summitCountryCode: att.countryCode || '',
        summitWeb: att.web || '',
        profileImage: att.photoUrl || undefined,
        lastEnriched: undefined
      };
      
      storage[actorId] = newActor;
      created++;
    }
  }
});

// Helper function to extract sector
function extractSector(company, title, industry) {
  const lowerCompany = (company || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  const lowerIndustry = (industry || '').toLowerCase();
  
  if (lowerCompany.includes('government') || lowerCompany.includes('ministry') || 
      lowerCompany.includes('national') || lowerCompany.includes('state') ||
      lowerIndustry.includes('government')) {
    return 'Government';
  }
  if (lowerCompany.includes('un') || lowerCompany.includes('undp') || 
      lowerCompany.includes('world bank') || lowerCompany.includes('african') ||
      lowerCompany.includes('multilateral')) {
    return 'Multilateral';
  }
  if (lowerCompany.includes('foundation') || lowerCompany.includes('non-profit') ||
      lowerCompany.includes('initiative') || lowerCompany.includes('ngo')) {
    return 'Foundation';
  }
  if (lowerCompany.includes('tech') || lowerCompany.includes('software') ||
      lowerTitle.includes('engineer') || lowerTitle.includes('developer')) {
    return 'Technology';
  }
  if (lowerIndustry.includes('research') || lowerTitle.includes('researcher') ||
      lowerTitle.includes('professor')) {
    return 'Research';
  }
  return 'Other';
}

// Write back to storage
console.log('\n💾 Saving repaired storage.json...');
fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));

console.log(`\n✅ Repair complete!`);
console.log(`   - Repaired ${repaired} entries with missing names`);
console.log(`   - Added ${created} new entries`);
console.log(`   - Total entries: ${Object.keys(storage).length}`);
console.log(`\n🎯 The sync will now pick up all ${Object.keys(storage).length} actors with proper names!`);

