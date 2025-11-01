const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeAllAttendees() {
  console.log('🚀 Starting comprehensive DPI Summit attendee scraping...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    userDataDir: '/Users/karthiknaig/Library/Application Support/Google/Chrome/Default',
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Monitor network requests to capture API calls
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('bootstrap-data') || url.includes('api') || url.includes('users')) {
      console.log(`   📡 Network: ${response.status()} ${url.substring(0, 100)}`);
      try {
        const data = await response.json();
        if (data && data.users) {
          console.log(`      ✅ Found ${data.users.length} users in API response`);
        }
      } catch (e) {
        // Not JSON
      }
    }
  });
  
  try {
    const url = 'https://www.globaldpisummit.org/auth/emailLogin/verify?token=Z3OmdNu8LWEiwYGXaE_PtOymy31kCfFv9INBoaIeKQ4&eventGroupId=125268&redirectUrl=https://www.globaldpisummit.org/community';
    
    console.log('📄 Navigating to DPI Summit community...');
    await page.goto(url);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Scroll incrementally to load all attendees
    console.log('📜 Scrolling to load all attendees (this may take a while for 1452 attendees)...');
    let previousAttendeeCount = 0;
    let scrollCount = 0;
    const maxScrolls = 200; // Allow more scrolls for large lists
    let consecutiveNoChange = 0;
    
    while (scrollCount < maxScrolls && consecutiveNoChange < 5) {
      // Scroll down incrementally
      await page.evaluate(() => {
        window.scrollBy(0, 800); // Scroll in smaller increments
      });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Count attendees currently on the page
      const currentAttendeeCount = await page.evaluate(() => {
        const text = document.body.innerHTML;
        const matches = text.match(/<div[^>]*class="[^"]*user[^"]*"|data-user-id="/g);
        return matches ? matches.length : 0;
      });
      
      if (currentAttendeeCount === previousAttendeeCount) {
        consecutiveNoChange++;
      } else {
        consecutiveNoChange = 0;
        previousAttendeeCount = currentAttendeeCount;
      }
      
      scrollCount++;
      console.log(`   Scroll ${scrollCount}/${maxScrolls}, attendees loaded: ${currentAttendeeCount}`);
      
      // Scroll to bottom periodically to trigger pagination
      if (scrollCount % 10 === 0) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`✅ Finished scrolling. Loaded approximately ${previousAttendeeCount} attendees`);
    
    // Extract all attendees from the page
    console.log('📊 Extracting attendee data...');
    const attendees = await page.evaluate(() => {
      const attendeeList = [];
      
      // Look for user data in the page
      const pageText = document.body.innerHTML;
      
      // Try to find all user objects in the data
      const userDataMatches = pageText.matchAll(/\{"id":(\d+),"firstName":"([^"]+)","lastName":"([^"]+)","company":"([^"]*)"?,"title":"([^"]*)"?,"countryCode":"([^"]*)"?,"country":"([^"]*)"?,"web":"([^"]*)"?,"industry":"([^"]*)"?,"photoUrl":"([^"]*)"?/g);
      
      for (const match of userDataMatches) {
        const id = match[1];
        const firstName = match[2];
        const lastName = match[3];
        const company = match[4] || '';
        const title = match[5] || '';
        const countryCode = match[6] || '';
        const country = match[7] || '';
        const web = match[8] || '';
        const industry = match[9] || '';
        const photoUrl = match[10] || '';
        
        if (firstName && lastName) {
          attendeeList.push({
            id,
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            company,
            title,
            countryCode,
            country,
            web,
            industry,
            photoUrl
          });
        }
      }
      
      return attendeeList;
    });
    
    console.log(`✅ Extracted ${attendees.length} attendees`);
    
    // Remove duplicates
    const uniqueAttendees = [];
    const seenIds = new Set();
    for (const att of attendees) {
      if (!seenIds.has(att.id)) {
        seenIds.add(att.id);
        uniqueAttendees.push(att);
      }
    }
    
    console.log(`✅ Found ${uniqueAttendees.length} unique attendees`);
    
    // Save to file
    fs.writeFileSync('public/dpi-all-attendees-full.json', JSON.stringify(uniqueAttendees, null, 2));
    
    // Check for specific people
    const shankar = uniqueAttendees.find(a => 
      a.name.toLowerCase().includes('shankar') || 
      a.name.toLowerCase().includes('maruwada')
    );
    
    if (shankar) {
      console.log('\n✅ Found Shankar Maruwada:', shankar);
    } else {
      console.log('\n❌ Shankar Maruwada not found');
      console.log('Ekstep attendees:', uniqueAttendees.filter(a => a.company.toLowerCase().includes('ekstep')));
    }
    
    // Show sample
    console.log('\n📋 Sample attendees:');
    uniqueAttendees.slice(0, 5).forEach(att => {
      console.log(`   - ${att.name} (${att.company}) - ${att.title}`);
    });
    
    console.log('\n✅ Saved to public/dpi-all-attendees-full.json');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n⏸️  Keeping browser open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

scrapeAllAttendees().catch(console.error);

