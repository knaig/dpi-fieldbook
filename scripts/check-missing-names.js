const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '../public/storage.json');

console.log('📖 Reading storage.json...');
const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
const entries = Object.values(data);

const withoutNames = entries.filter(e => {
  if (!e) return false;
  if (!e.name) return true;
  if (e.name.trim() === '') return true;
  if (e.name.startsWith('Actor ')) return true;
  return false;
});

console.log(`Total entries: ${entries.length}`);
console.log(`Entries without proper names: ${withoutNames.length}`);

if (withoutNames.length > 0) {
  console.log('\nSample entries without names:');
  withoutNames.slice(0, 10).forEach(e => {
    console.log(`  ID: ${e.id}`);
    console.log(`    firstName: ${e.firstName || 'N/A'}`);
    console.log(`    lastName: ${e.lastName || 'N/A'}`);
    console.log(`    contactName: ${e.contactName || 'N/A'}`);
    console.log(`    summitCompany: ${e.summitCompany || 'N/A'}`);
    console.log(`    current name: ${e.name || '(missing)'}`);
    console.log('');
  });
}

// Also check if we can generate names for them
console.log('\n🔍 Attempting to generate names for missing entries...');
let canFix = 0;
withoutNames.forEach(e => {
  if (e.firstName && e.lastName) {
    console.log(`  ✅ Can fix: ${e.id} - has firstName/lastName`);
    canFix++;
  } else if (e.contactName) {
    console.log(`  ✅ Can fix: ${e.id} - has contactName`);
    canFix++;
  } else if (e.summitCompany) {
    console.log(`  ⚠️  Can partially fix: ${e.id} - only has company`);
    canFix++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`  - Total without names: ${withoutNames.length}`);
console.log(`  - Can be fixed automatically: ${canFix}`);



