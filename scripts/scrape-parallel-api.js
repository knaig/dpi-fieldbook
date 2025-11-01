const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeParallel() {
  console.log('🚀 Starting parallel API scraper...\n');
  
  // Launch browser to get authenticated session
  const browser = await puppeteer.launch({ 
    headless: false,
    userDataDir: '/Users/karthiknaig/Library/Application Support/Google/Chrome/Default',
  });
  
  const page = await browser.newPage();
  
  console.log('📄 Loading page to get auth cookies...');
  await page.goto('https://www.globaldpisummit.org/auth/emailLogin/verify?token=Z3OmdNu8LWEiwYGXaE_PtOymy31kCfFv9INBoaIeKQ4&eventGroupId=125268&redirectUrl=https://www.globaldpisummit.org/community', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('✓ Page loaded, extracting cookies...');
  await new Promise(r => setTimeout(r, 3000));
  
  // Get cookies for API requests
  const cookies = await page.cookies();
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  
  console.log(`✓ Got ${cookies.length} cookies\n`);
  
  // Now make parallel API requests
  console.log('📡 Making parallel API requests...\n');
  
  const BATCH_SIZE = 48;
  const TOTAL_EXPECTED = 1455;
  const CONCURRENT = 3; // Safe: only 3 parallel requests to avoid rate limiting
  
  const allUsers = new Map();
  
  // Calculate all offsets
  const offsets = [];
  for (let offset = 0; offset < TOTAL_EXPECTED; offset += BATCH_SIZE) {
    offsets.push(offset);
  }
  
  console.log(`📊 Will fetch ${offsets.length} batches (48 users each) in parallel...\n`);
  
  // Process in chunks of CONCURRENT requests
  for (let i = 0; i < offsets.length; i += CONCURRENT) {
    const chunk = offsets.slice(i, i + CONCURRENT);
    
    const promises = chunk.map(async (offset) => {
      const url = `https://api.bizzabo.com/api/v2/community/735634/search?sort=join&count=${BATCH_SIZE}&offset=${offset}`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'Cookie': cookieString,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          }
        });
        
        if (!response.ok) {
          console.log(`   ⚠️  Offset ${offset}: ${response.status}`);
          return [];
        }
        
        const data = await response.json();
        const users = data.data || [];
        
        console.log(`   ✅ Offset ${offset}: ${users.length} users`);
        return users;
        
      } catch (error) {
        console.error(`   ❌ Offset ${offset}: ${error.message}`);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    
    // Merge results
    results.flat().forEach(user => {
      if (user.id) {
        allUsers.set(user.id, user);
      }
    });
    
    console.log(`   📊 Processed batch ${Math.floor(i / CONCURRENT) + 1}/${Math.ceil(offsets.length / CONCURRENT)} → Total: ${allUsers.size} users\n`);
    
    // Longer delay between chunks to be safe and respectful
    if (i + CONCURRENT < offsets.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log(`\n✅ Final: ${allUsers.size} unique users`);
  
  // Convert to array and save
  const attendees = Array.from(allUsers.values());
  fs.writeFileSync('public/dpi-all-attendees-complete.json', JSON.stringify(attendees, null, 2));
  
  console.log('✅ Saved to public/dpi-all-attendees-complete.json');
  
  // Check for Shankar
  const shankar = attendees.filter(u => 
    String(u.firstName || '').toLowerCase().includes('shankar') ||
    String(u.lastName || '').toLowerCase().includes('maruwada')
  );
  
  if (shankar.length > 0) {
    console.log(`\n✅ Found ${shankar.length} Shankar(s):`);
    shankar.forEach(s => console.log(`   - ${s.firstName} ${s.lastName} (${s.company})`));
  } else {
    console.log('\n❌ Shankar Maruwada not found');
  }
  
  // Check for Ekstep
  const ekstep = attendees.filter(u => 
    String(u.company || '').toLowerCase().includes('ekstep')
  );
  
  if (ekstep.length > 0) {
    console.log(`\n✅ Found ${ekstep.length} Ekstep attendee(s):`);
    ekstep.forEach(e => console.log(`   - ${e.firstName} ${e.lastName} (${e.company}) - ${e.title}`));
  }
  
  // Statistics
  console.log(`\n📊 Statistics:`);
  console.log(`   Total: ${attendees.length}`);
  console.log(`   With company: ${attendees.filter(a => a.company).length}`);
  console.log(`   With photo: ${attendees.filter(a => a.photoUrl).length}`);
  
  await browser.close();
  console.log('\n✅ Done!');
}

scrapeParallel().catch(console.error);

