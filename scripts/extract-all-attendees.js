const fs = require('fs');
const path = require('path');

// Read the full HTML
const html = fs.readFileSync('public/dpi-page-content.html', 'utf-8');

// Extract all user objects using a more comprehensive pattern
const userPattern = /\{"id":(\d+),"firstName":"([^"]+)","lastName":"([^"]+)","company":"([^"]*)"?,"title":"([^"]*)"?,"countryCode":"([^"]*)"?,"country":"([^"]*)"?,"web":"([^"]*)"?,"industry":"([^"]*)"?,"summary":"([^"]*)"?,"(?:\w+Id":"([^"]*)"?,")?(?:\w+Handle":"([^"]*)"?,")?(?:\w+Url":"([^"]*)"?,")?photoUrl":"([^"]*)"?/g;

const attendees = [];
let match;

// Extract all attendees from the HTML
while ((match = userPattern.exec(html)) !== null) {
  const id = match[1];
  const firstName = match[2];
  const lastName = match[3];
  const company = match[4];
  const title = match[5];
  const countryCode = match[6];
  const country = match[7];
  const web = match[8];
  const industry = match[9];
  const summary = match[10];
  const photoUrl = match[11] || match[12] || match[13] || match[14]; // Try to get photoUrl from various positions
  
  if (firstName && lastName) {
    attendees.push({
      id,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      company: company || '',
      title: title || '',
      countryCode: countryCode || '',
      country: country || '',
      web: web || '',
      industry: industry || '',
      summary: summary || '',
      photoUrl: photoUrl || ''
    });
  }
}

// Remove duplicates
const uniqueAttendees = [];
const seenNames = new Set();
for (const att of attendees) {
  const key = `${att.name}-${att.company}`;
  if (!seenNames.has(key)) {
    seenNames.add(key);
    uniqueAttendees.push(att);
  }
}

console.log(`Extracted ${uniqueAttendees.length} unique attendees`);

// Save to file
fs.writeFileSync('public/dpi-all-attendees.json', JSON.stringify(uniqueAttendees, null, 2));

// Check for Shankar Maruwada
const shankar = uniqueAttendees.find(a => a.name.toLowerCase().includes('shankar') || a.name.toLowerCase().includes('maruwada'));
if (shankar) {
  console.log('\n✅ Found Shankar Maruwada:', shankar);
} else {
  console.log('\n❌ Shankar Maruwada not found');
  console.log('Ekstep attendees:', uniqueAttendees.filter(a => a.company.toLowerCase().includes('ekstep')));
}

console.log('\n✅ Saved to public/dpi-all-attendees.json');

