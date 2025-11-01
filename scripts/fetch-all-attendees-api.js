const fs = require('fs');

// API endpoint discovered from network logs
const BASE_URL = 'https://api.bizzabo.com/api/v2/community/735634/search';
const BATCH_SIZE = 48; // Number of attendees per request
const EXPECTED_TOTAL = 1455;

async function fetchAllAttendees() {
  console.log('🚀 Fetching all attendees via API...\n');
  
  const allAttendees = [];
  let offset = 0;
  let hasMore = true;
  
  while (hasMore && offset < 2000) {
    const url = `${BASE_URL}?sort=join&count=${BATCH_SIZE}&offset=${offset}`;
    
    try {
      console.log(`📡 Fetching batch: offset=${offset} (${allAttendees.length} total so far)...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Error: ${response.status} ${response.statusText}`);
        break;
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const users = data.data;
        console.log(`   ✅ Fetched ${users.length} users`);
        
        const attendees = users.map(user => ({
          id: user.id || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          company: user.company || '',
          title: user.title || '',
          countryCode: user.countryCode || '',
          country: user.country || '',
          web: user.web || '',
          industry: user.industry || '',
          photoUrl: user.photoUrl || '',
          summary: user.summary || '',
          oneLiner: user.oneLiner || ''
        }));
        
        allAttendees.push(...attendees);
        
        // Check if we've reached the end
        if (users.length < BATCH_SIZE) {
          console.log(`   ✅ Last batch (${users.length} users) - reached end`);
          hasMore = false;
        }
      } else {
        console.log(`   ⚠️  Unexpected response format`);
        console.log(`   Data keys:`, Object.keys(data));
      }
      
      offset += BATCH_SIZE;
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error fetching batch at offset ${offset}:`, error.message);
      break;
    }
  }
  
  console.log(`\n✅ Total attendees fetched: ${allAttendees.length}`);
  
  // Save to file
  fs.writeFileSync('public/dpi-all-attendees-from-api.json', JSON.stringify(allAttendees, null, 2));
  
  // Check for Shankar Maruwada
  const shankar = allAttendees.find(a => 
    a.name.toLowerCase().includes('shankar') || 
    a.name.toLowerCase().includes('maruwada')
  );
  
  if (shankar) {
    console.log(`\n✅ Found Shankar Maruwada:`, shankar);
  } else {
    console.log(`\n❌ Shankar Maruwada not found`);
    const ekstep = allAttendees.filter(a => a.company.toLowerCase().includes('ekstep'));
    console.log(`Ekstep attendees (${ekstep.length}):`, ekstep.map(e => e.name));
  }
  
  // Show sample
  console.log(`\n📋 Sample attendees (first 5):`);
  allAttendees.slice(0, 5).forEach(att => {
    console.log(`   - ${att.name} (${att.company}) - ${att.title}`);
  });
  
  console.log(`\n✅ Saved ${allAttendees.length} attendees to public/dpi-all-attendees-from-api.json`);
  
  return allAttendees;
}

fetchAllAttendees().catch(console.error);

