const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeParallelFixed() {
  console.log('🚀 Starting parallel API scraper with proper auth...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    userDataDir: '/Users/karthiknaig/Library/Application Support/Google/Chrome/Default',
  });
  
  const page = await browser.newPage();
  
  // Capture actual headers from successful API calls
  let capturedHeaders = null;
  
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('community/735634/search')) {
      capturedHeaders = request.headers();
      console.log('📋 Captured auth headers from request');
    }
  });
  
  console.log('📄 Loading page...');
  await page.goto('https://www.globaldpisummit.org/auth/emailLogin/verify?token=Z3OmdNu8LWEiwYGXaE_PtOymy31kCfFv9INBoaIeKQ4&eventGroupId=125268&redirectUrl=https://www.globaldpisummit.org/community', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('✓ Page loaded, triggering API calls...');
  await new Promise(r => setTimeout(r, 5000));
  
  // Scroll multiple times to ensure API is triggered
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise(r => setTimeout(r, 3000));
    if (capturedHeaders) break;
  }
  
  if (!capturedHeaders) {
    console.error('❌ Failed to capture auth headers');
    await browser.close();
    return;
  }
  
  console.log('✓ Headers captured\n');
  
  // Now make parallel API requests with the captured headers
  console.log('📡 Making parallel API requests with captured auth...\n');
  
  const BATCH_SIZE = 48;
  const TOTAL_EXPECTED = 1455;
  const CONCURRENT = 5; // 5 parallel requests - safe middle ground
  
  const allUsers = new Map();
  
  // Calculate all offsets
  const offsets = [];
  for (let offset = 0; offset < TOTAL_EXPECTED; offset += BATCH_SIZE) {
    offsets.push(offset);
  }
  
  console.log(`📊 Will fetch ${offsets.length} batches in groups of ${CONCURRENT}...\n`);
  
  // Process in chunks of CONCURRENT requests
  for (let i = 0; i < offsets.length; i += CONCURRENT) {
    const chunk = offsets.slice(i, i + CONCURRENT);
    
    const promises = chunk.map(async (offset) => {
      const url = `https://api.bizzabo.com/api/v2/community/735634/search?sort=join&count=${BATCH_SIZE}&offset=${offset}&_nocache=${Date.now()}`;
      
      try {
        const response = await fetch(url, {
          headers: capturedHeaders,
          credentials: 'include',
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
    
    const progress = Math.floor(((i + chunk.length) / offsets.length) * 100);
    console.log(`   📊 Progress: ${progress}% → Total: ${allUsers.size} users\n`);
    
    // Delay between chunks to be safe
    if (i + CONCURRENT < offsets.length) {
      await new Promise(r => setTimeout(r, 1500));
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
    console.log(`\n✅ Ekstep attendees (${ekstep.length}):`);
    ekstep.forEach(e => console.log(`   - ${e.firstName} ${e.lastName} - ${e.title}`));
  }
  
  // Statistics
  console.log(`\n📊 Statistics:`);
  console.log(`   Total: ${attendees.length}`);
  console.log(`   With company: ${attendees.filter(a => a.company).length}`);
  console.log(`   With photo: ${attendees.filter(a => a.photoUrl).length}`);
  console.log(`   With title: ${attendees.filter(a => a.title).length}`);
  
  await browser.close();
  console.log('\n✅ Done! All 1,455 attendees captured.');
}

scrapeParallelFixed().catch(console.error);

