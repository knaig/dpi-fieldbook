const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape() {
  console.log('🚀 Starting scraper...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    userDataDir: '/Users/karthiknaig/Library/Application Support/Google/Chrome/Default',
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  const allUsers = new Map();
  let apiCallCount = 0;
  
  // Capture API responses BEFORE navigation
  page.on('response', async (response) => {
    const url = response.url();
    
    if (url.includes('community/735634/search')) {
      apiCallCount++;
      console.log(`📡 API call #${apiCallCount}: ${url.substring(0, 100)}`);
      
      try {
        const json = await response.json();
        const users = json.data || json.users || [];
        
        users.forEach(u => {
          if (u.id) allUsers.set(u.id, u);
        });
        
        console.log(`   +${users.length} users → Total: ${allUsers.size}`);
      } catch (e) {
        // Skip
      }
    }
  });
  
  console.log('📄 Loading page...');
  await page.goto('https://www.globaldpisummit.org/auth/emailLogin/verify?token=Z3OmdNu8LWEiwYGXaE_PtOymy31kCfFv9INBoaIeKQ4&eventGroupId=125268&redirectUrl=https://www.globaldpisummit.org/community', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('✓ Page loaded\n');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('📜 Scrolling fast to load all 1,455 attendees...');
  for (let i = 0; i < 350; i++) {
    try {
      await page.evaluate(() => window.scrollBy(0, 2000)); // Bigger scrolls
    } catch (e) {
      console.log(`   ⚠️  Scroll error at ${i}, continuing...`);
    }
    
    await new Promise(r => setTimeout(r, 800)); // Faster delay
    
    if (i % 10 === 0) {
      console.log(`   Scroll ${i}: ${allUsers.size} users`);
    }
    
    if (allUsers.size >= 1400) {
      console.log(`✅ Reached ${allUsers.size} users - stopping`);
      break;
    }
  }
  
  console.log(`\n✅ Final: ${allUsers.size} users from ${apiCallCount} API calls`);
  
  const attendees = Array.from(allUsers.values());
  fs.writeFileSync('public/dpi-all-attendees-complete.json', JSON.stringify(attendees, null, 2));
  
  const shankar = attendees.find(u => 
    String(u.firstName || '').toLowerCase().includes('shankar') ||
    String(u.lastName || '').toLowerCase().includes('maruwada')
  );
  
  console.log(shankar ? `\n✅ Shankar: ${shankar.firstName} ${shankar.lastName}` : '\n❌ Shankar not found');
  
  console.log('\n✅ Saved to public/dpi-all-attendees-complete.json');
  console.log('Keeping browser open 20s...');
  await new Promise(r => setTimeout(r, 20000));
  await browser.close();
}

scrape().catch(console.error);

