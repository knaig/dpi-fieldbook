const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeWithNetworkIntercept() {
  console.log('🚀 Starting network-intercept scraper for all 1,455 attendees...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    userDataDir: '/Users/karthiknaig/Library/Application Support/Google/Chrome/Default',
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Store all captured user data
  const allUsers = new Map(); // Use Map to avoid duplicates by ID
  
  // Intercept and capture all API responses
  page.on('response', async (response) => {
    const url = response.url();
    
    // Log all community/search related API calls for debugging
    if (url.includes('community') || url.includes('search')) {
      console.log(`   📡 API Call: ${response.status()} ${url.substring(0, 120)}`);
    }
    
    // Check if this is the community search API
    if (url.includes('/api/v2/community/735634/search') || url.includes('community/735634/search')) {
      try {
        const data = await response.json();
        console.log(`   📦 Response data keys:`, Object.keys(data));
        
        // Try different response formats
        let users = null;
        if (data && data.data && Array.isArray(data.data)) {
          users = data.data;
        } else if (data && Array.isArray(data)) {
          users = data;
        } else if (data && data.users && Array.isArray(data.users)) {
          users = data.users;
        }
        
        if (users && users.length > 0) {
          console.log(`📡 Intercepted API: ${users.length} users (total unique: ${allUsers.size + users.length})`);
          
          // Add users to map (deduplicate by ID)
          users.forEach(user => {
            if (user.id && !allUsers.has(user.id)) {
              allUsers.set(user.id, user);
            }
          });
          
          console.log(`   ✅ Now have ${allUsers.size} unique users`);
        } else {
          console.log(`   ⚠️  No users array found in response`);
        }
      } catch (e) {
        console.log(`   ⚠️  Failed to parse JSON: ${e.message}`);
      }
    }
  });
  
  try {
    const url = 'https://www.globaldpisummit.org/auth/emailLogin/verify?token=Z3OmdNu8LWEiwYGXaE_PtOymy31kCfFv9INBoaIeKQ4&eventGroupId=125268&redirectUrl=https://www.globaldpisummit.org/community';
    
    console.log('📄 Navigating to DPI Summit community...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('✓ Page loaded, waiting for initial data...\n');
    
    // Wait a bit for initial load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Now scroll to trigger all API calls
    console.log('📜 Scrolling to trigger all API pagination...');
    let scrollCount = 0;
    const maxScrolls = 500; // Increased to ensure we get all pages
    let lastUserCount = 0;
    let stableCount = 0;
    
    while (scrollCount < maxScrolls && stableCount < 10) {
      const currentUserCount = allUsers.size;
      
      if (currentUserCount === lastUserCount) {
        stableCount++;
      } else {
        stableCount = 0;
      }
      
      lastUserCount = currentUserCount;
      
      // Scroll down
      await page.evaluate(() => {
        window.scrollBy(0, 1000);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      scrollCount++;
      
      // Log progress every 20 scrolls
      if (scrollCount % 20 === 0) {
        console.log(`   Scroll ${scrollCount}/${maxScrolls} - ${currentUserCount} users captured`);
      }
      
      // Periodically scroll to bottom to ensure we trigger pagination
      if (scrollCount % 25 === 0) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // If we've captured enough users, check if we should continue
      if (currentUserCount >= 1400 && stableCount >= 5) {
        console.log(`\n✅ Captured ${currentUserCount} users (likely all data loaded)`);
        break;
      }
    }
    
    console.log(`\n✅ Finished scrolling. Final count from network: ${allUsers.size} unique users`);
    
    // Fallback: Extract from page DOM if network interception didn't capture enough
    if (allUsers.size < 1000) {
      console.log('\n📄 Extracting additional data from page DOM...');
      
      const pageUsers = await page.evaluate(() => {
        const users = [];
        
        // Try to extract from JSON script tags
        const scriptTags = document.querySelectorAll('script[type="application/json"]');
        for (const script of scriptTags) {
          const id = script.getAttribute('id');
          if (id === 'bootstrap-data-query') {
            try {
              const data = JSON.parse(script.textContent);
              if (data.users && Array.isArray(data.users)) {
                return data.users.map(user => ({
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
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
              }
            } catch (e) {
              console.error('Failed to parse bootstrap-data-query:', e);
            }
          }
        }
        return [];
      });
      
      // Merge page users into allUsers
      pageUsers.forEach(user => {
        if (user.id && !allUsers.has(user.id)) {
          allUsers.set(user.id, user);
        }
      });
      
      console.log(`   ✅ Added ${pageUsers.length} users from page DOM`);
      console.log(`   ✅ Total unique users now: ${allUsers.size}`);
    }
    
    // Convert map to array and format
    const attendees = Array.from(allUsers.values()).map(user => ({
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
    
    // Save to file
    fs.writeFileSync('public/dpi-all-attendees-complete.json', JSON.stringify(attendees, null, 2));
    console.log(`✅ Saved ${attendees.length} attendees to public/dpi-all-attendees-complete.json`);
    
    // Check for specific people
    const shankar = attendees.find(a => 
      a.name.toLowerCase().includes('shankar') || 
      a.name.toLowerCase().includes('maruwada')
    );
    
    if (shankar) {
      console.log(`\n✅ Found Shankar Maruwada:`, shankar);
    } else {
      console.log(`\n❌ Shankar Maruwada not found`);
      const ekstep = attendees.filter(a => a.company && a.company.toLowerCase().includes('ekstep'));
      if (ekstep.length > 0) {
        console.log(`Ekstep attendees (${ekstep.length}):`);
        ekstep.forEach(e => console.log(`   - ${e.name} (${e.company}) - ${e.title}`));
      }
    }
    
    // Show statistics
    console.log(`\n📊 Statistics:`);
    console.log(`   Total attendees: ${attendees.length}`);
    console.log(`   With company: ${attendees.filter(a => a.company).length}`);
    console.log(`   With title: ${attendees.filter(a => a.title).length}`);
    console.log(`   With photo: ${attendees.filter(a => a.photoUrl).length}`);
    console.log(`   With summary: ${attendees.filter(a => a.summary).length}`);
    
    // Show sample
    console.log(`\n📋 Sample attendees (first 10):`);
    attendees.slice(0, 10).forEach(att => {
      console.log(`   - ${att.name} (${att.company || 'N/A'}) - ${att.title || 'N/A'}`);
    });
    
    return attendees;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n⏸️  Keeping browser open for 30 seconds for verification...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

scrapeWithNetworkIntercept().catch(console.error);

