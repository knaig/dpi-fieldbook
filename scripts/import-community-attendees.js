const fs = require('fs');
const path = require('path');

// Read extracted attendees
const attendees = JSON.parse(fs.readFileSync('public/dpi-community-attendees.json', 'utf-8'));

console.log(`📊 Processing ${attendees.length} attendees from community page...`);

// Transform attendees into Actor objects
const actors = attendees.map((att, index) => ({
  id: `actor-community-${Date.now()}-${index}`,
  name: att.name,
  sector: extractSector(att.company, att.title, att.industry),
  motive: 'Summit Attendee',
  pitch: '',
  inclusionScore: 7,
  followupScore: 8,
  spokenTo: false,
  contactName: att.name,
  contactRole: att.title || '',
  notes: `${att.summary || ''} Company: ${att.company}`.trim(),
  nextAction: 'To be determined at Summit',
  buckets: [att.country],
  summitContext: `Attending Global DPI Summit 2025`,
  summitSourceTags: ['Summit Attendee'],
  profileImage: att.photoUrl || undefined,
  summitCompany: att.company,
  summitIndustry: att.industry,
  summitSummary: att.summary,
  lastEnriched: undefined
}));

// Helper function to extract sector from company/title/industry
function extractSector(company, title, industry) {
  const lowerCompany = (company || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  const lowerIndustry = (industry || '').toLowerCase();
  
  if (lowerCompany.includes('government') || lowerCompany.includes('ministry') || 
      lowerCompany.includes('national') || lowerCompany.includes('state') ||
      lowerCompany.includes('department') || lowerIndustry.includes('government')) {
    return 'Government';
  }
  if (lowerCompany.includes('un') || lowerCompany.includes('undp') || 
      lowerCompany.includes('world bank') || lowerCompany.includes('african') ||
      lowerCompany.includes('itu') || lowerCompany.includes('unicef') ||
      lowerIndustry.includes('multilateral')) {
    return 'Multilateral';
  }
  if (lowerCompany.includes('foundation') || lowerCompany.includes('non-profit') ||
      lowerCompany.includes('initiative') || lowerIndustry.includes('foundation') ||
      lowerIndustry.includes('non-profit')) {
    return 'Foundation';
  }
  if (lowerCompany.includes('tech') || lowerCompany.includes('software') ||
      lowerTitle.includes('engineer') || lowerTitle.includes('developer') ||
      lowerIndustry.includes('technology')) {
    return 'Technology';
  }
  if (lowerCompany.includes('university') || lowerCompany.includes('institute') ||
      lowerIndustry.includes('academic')) {
    return 'Research';
  }
  if (lowerIndustry.includes('corporate') || lowerIndustry.includes('private sector')) {
    return 'Corporate';
  }
  return 'Other';
}

// Read existing storage
const STORAGE_PATH = path.join(__dirname, '../public/storage.json');
let existingActors = {};
if (fs.existsSync(STORAGE_PATH)) {
  existingActors = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
}

// Check for duplicates and add new actors
let added = 0;
let duplicates = 0;

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
  }
});

// Save to storage
fs.writeFileSync(STORAGE_PATH, JSON.stringify(existingActors, null, 2));

console.log(`\n✅ Import complete!`);
console.log(`   Added: ${added} new attendees`);
console.log(`   Duplicates: ${duplicates}`);
console.log(`   Total actors in storage: ${Object.keys(existingActors).length}`);

