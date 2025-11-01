const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '../public/storage.json');

console.log('📖 Reading storage.json...');
const storage = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
const entries = Object.values(storage);

let fixed = 0;

entries.forEach(entry => {
  if (!entry) return;
  
  // Check if name is missing or invalid
  const needsName = !entry.name || 
                   entry.name.trim() === '' || 
                   entry.name.startsWith('Actor ');
  
  if (needsName) {
    // Try to generate name from available data
    if (entry.firstName && entry.lastName) {
      entry.name = `${entry.firstName} ${entry.lastName}`;
      fixed++;
    } else if (entry.contactName && entry.contactName.trim() !== '') {
      entry.name = entry.contactName;
      fixed++;
    } else if (entry.summitCompany && entry.contactRole) {
      entry.name = `${entry.contactRole} at ${entry.summitCompany}`;
      fixed++;
    } else if (entry.summitCompany) {
      entry.name = entry.summitCompany;
      fixed++;
    } else if (entry.id) {
      // Last resort - use ID but make it clear
      entry.name = `Actor ${entry.id.replace('actor-dpi-', '')}`;
      fixed++;
    }
  }
});

// Save back
if (fixed > 0) {
  console.log(`\n💾 Fixing ${fixed} entries...`);
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
  console.log(`✅ Fixed ${fixed} entries with missing names!`);
} else {
  console.log(`\n✅ No entries need fixing - all have names!`);
}

// Verify
const withoutNames = Object.values(storage).filter(e => 
  e && (!e.name || e.name.trim() === '' || e.name.startsWith('Actor '))
);

console.log(`\n📊 Verification:`);
console.log(`  - Total entries: ${Object.values(storage).length}`);
console.log(`  - Entries still without names: ${withoutNames.length}`);

if (withoutNames.length > 0) {
  console.log('\n⚠️  Remaining entries without names:');
  withoutNames.forEach(e => {
    console.log(`  - ${e.id}: ${JSON.stringify({
      firstName: e.firstName,
      lastName: e.lastName,
      contactName: e.contactName,
      summitCompany: e.summitCompany,
      contactRole: e.contactRole
    })}`);
  });
}



