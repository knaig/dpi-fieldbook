const fs = require('fs');
const path = require('path');

// Read extracted attendees
const attendees = JSON.parse(fs.readFileSync('public/dpi-attendees-extracted.json', 'utf-8'));

// Transform attendees into Actor objects
const actors = attendees.map((att, index) => ({
  id: `actor-dpi-${Date.now()}-${index}`,
  name: att.name,
  sector: extractSector(att.company, att.title),
  motive: 'Summit Attendee',
  pitch: '',
  inclusionScore: 7,
  followupScore: 8,
  spokenTo: false,
  contactName: att.name,
  contactRole: att.title,
  notes: `Attendee at Global DPI Summit 2025. Company: ${att.company}`,
  nextAction: 'To be determined at Summit',
  buckets: [att.country],
  summitContext: `Attending Global DPI Summit 2025`,
  summitSourceTags: ['Summit Attendee'],
  profileImage: att.photoUrl || undefined,
  lastEnriched: undefined
}));

// Helper function to extract sector from company/title
function extractSector(company, title) {
  const lowerCompany = (company || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  
  if (lowerCompany.includes('government') || lowerCompany.includes('ministry') || 
      lowerCompany.includes('national') || lowerCompany.includes('state')) {
    return 'Government';
  }
  if (lowerCompany.includes('un') || lowerCompany.includes('undp') || 
      lowerCompany.includes('world bank') || lowerCompany.includes('african')) {
    return 'Multilateral';
  }
  if (lowerCompany.includes('foundation') || lowerCompany.includes('non-profit') ||
      lowerCompany.includes('initiative')) {
    return 'Foundation';
  }
  if (lowerCompany.includes('tech') || lowerCompany.includes('software') ||
      lowerTitle.includes('engineer') || lowerTitle.includes('developer')) {
    return 'Technology';
  }
  return 'Other';
}

// Read existing storage
const STORAGE_PATH = path.join(__dirname, '../public/storage.json');
let existingActors = {};
if (fs.existsSync(STORAGE_PATH)) {
  existingActors = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
}

// Add new actors to storage
actors.forEach(actor => {
  existingActors[actor.id] = actor;
});

// Save to storage
fs.writeFileSync(STORAGE_PATH, JSON.stringify(existingActors, null, 2));

console.log(`\n✅ Imported ${actors.length} DPI Summit attendees into fieldbook!`);
console.log(`📊 Total actors in storage: ${Object.keys(existingActors).length}`);
console.log(`\n🎯 Next: Navigate to /clear-and-import to sync these actors to localStorage`);

