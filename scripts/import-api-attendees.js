const fs = require('fs');
const path = require('path');

// Read extracted attendees
const attendeesPath = path.join(__dirname, '../public/dpi-all-attendees-complete.json');

if (!fs.existsSync(attendeesPath)) {
  console.error('❌ dpi-all-attendees-complete.json not found!');
  console.error('   Please run scrape-with-network-intercept.js first');
  process.exit(1);
}

const attendees = JSON.parse(fs.readFileSync(attendeesPath, 'utf-8'));

console.log(`📊 Processing ${attendees.length} attendees from network-intercept...\n`);

// Helper function to extract sector from company/title/industry
function extractSector(company, title, industry) {
  const lowerCompany = (company || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  const lowerIndustry = (industry || '').toLowerCase();
  
  if (lowerCompany.includes('government') || lowerCompany.includes('ministry') || 
      lowerCompany.includes('national') || lowerCompany.includes('state') ||
      lowerCompany.includes('department') || lowerCompany.includes('ministry') ||
      lowerIndustry.includes('government')) {
    return 'Government';
  }
  if (lowerCompany.includes('un ') || lowerCompany.includes('undp') || 
      lowerCompany.includes('world bank') || lowerCompany.includes('african') ||
      lowerCompany.includes('itu') || lowerCompany.includes('unicef') ||
      lowerCompany.includes('world health') || lowerIndustry.includes('multilateral')) {
    return 'Multilateral';
  }
  if (lowerCompany.includes('foundation') || lowerCompany.includes('non-profit') ||
      lowerCompany.includes('initiative') || lowerCompany.includes('ngo') ||
      lowerIndustry.includes('foundation') || lowerIndustry.includes('non-profit')) {
    return 'Foundation';
  }
  if (lowerCompany.includes('tech') || lowerCompany.includes('software') ||
      lowerTitle.includes('engineer') || lowerTitle.includes('developer') ||
      lowerCompany.includes('digital') || lowerIndustry.includes('technology')) {
    return 'Technology';
  }
  if (lowerCompany.includes('university') || lowerCompany.includes('institute') ||
      lowerCompany.includes('research') || lowerIndustry.includes('academic')) {
    return 'Research';
  }
  if (lowerIndustry.includes('corporate') || lowerIndustry.includes('private sector') ||
      lowerCompany.includes('corp') || lowerCompany.includes('inc') ||
      lowerCompany.includes('ltd') || lowerCompany.includes('llc')) {
    return 'Corporate';
  }
  return 'Other';
}

// Transform attendees into Actor objects
const actors = attendees.map((att, index) => {
  // Generate unique ID
  const id = `actor-dpi-${att.id || Date.now()}-${index}`;
  
  return {
    id,
    name: att.name,
    sector: extractSector(att.company, att.title, att.industry),
    motive: 'Summit Attendee',
    pitch: '',
    inclusionScore: 7,
    followupScore: 8,
    spokenTo: false,
    contactName: att.name,
    contactRole: att.title || '',
    notes: att.summary || att.oneLiner || `Attending Global DPI Summit 2025`,
    nextAction: 'To be determined at Summit',
    buckets: att.country ? [att.country] : [],
    summitContext: `Attending Global DPI Summit 2025${att.summary ? ': ' + att.summary : ''}`,
    summitSourceTags: ['Summit Attendee', 'Community Page'],
    profileImage: att.photoUrl || undefined,
    summitCompany: att.company,
    summitIndustry: att.industry,
    summitSummary: att.summary || att.oneLiner,
    summitCountry: att.country,
    summitCountryCode: att.countryCode,
    summitWeb: att.web,
    lastEnriched: undefined
  };
});

console.log(`✅ Transformed ${actors.length} attendees into Actor objects\n`);

// Read existing storage
const STORAGE_PATH = path.join(__dirname, '../public/storage.json');
let existingActors = {};
if (fs.existsSync(STORAGE_PATH)) {
  existingActors = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
  console.log(`📚 Existing actors in storage: ${Object.keys(existingActors).length}`);
}

// Check for duplicates and add new actors
let added = 0;
let duplicates = 0;
const duplicateDetails = [];

actors.forEach(actor => {
  // Check if this actor already exists by name and company
  const exists = Object.values(existingActors).some(existingActor => 
    existingActor.name === actor.name && 
    existingActor.summitCompany === actor.summitCompany
  );
  
  if (!exists) {
    existingActors[actor.id] = actor;
    added++;
  } else {
    duplicates++;
    duplicateDetails.push(`${actor.name} (${actor.summitCompany})`);
  }
});

// Save to storage
fs.writeFileSync(STORAGE_PATH, JSON.stringify(existingActors, null, 2));

console.log(`\n✅ Import complete!`);
console.log(`   Added: ${added} new attendees`);
console.log(`   Duplicates skipped: ${duplicates}`);
console.log(`   Total actors in storage: ${Object.keys(existingActors).length}`);

if (duplicateDetails.length > 0 && duplicateDetails.length <= 10) {
  console.log(`\n   Duplicate examples:`);
  duplicateDetails.slice(0, 5).forEach(d => console.log(`      - ${d}`));
}

// Check for Shankar Maruwada
const allActors = Object.values(existingActors);
const shankar = allActors.find(a => 
  a.name && (a.name.toLowerCase().includes('shankar') || 
  a.name.toLowerCase().includes('maruwada'))
);

if (shankar) {
  console.log(`\n✅ Found Shankar Maruwada in database:`, {
    name: shankar.name,
    company: shankar.summitCompany,
    title: shankar.contactRole
  });
} else {
  console.log(`\n❌ Shankar Maruwada not found in database`);
  const ekstep = allActors.filter(a => 
    a.summitCompany && a.summitCompany.toLowerCase().includes('ekstep')
  );
  if (ekstep.length > 0) {
    console.log(`Ekstep attendees (${ekstep.length}):`);
    ekstep.forEach(e => console.log(`   - ${e.name} (${e.summitCompany}) - ${e.contactRole}`));
  }
}

