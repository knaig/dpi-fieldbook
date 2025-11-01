const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeAllAttendees() {
  console.log('🚀 Starting comprehensive DPI Summit attendee scraping with logged-in Chrome...');
  
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
    }
  });
  
  try {
    const url = 'https://www.globaldpisummit.org/auth/emailLogin/verify?token=Z3OmdNu8LWEiwYGXaE_PtOymy31kCfFv9INBoaIeKQ4&eventGroupId=125268&redirectUrl=https://www.globaldpisummit.org/community';
    
    console.log('📄 Navigating to DPI Summit community...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('✓ Page loaded');
    
    // Wait for community page to render
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Scroll incrementally to load all attendees
    console.log('📜 Scrolling to load all faculty attendees...');
    let scrollCount = 0;
    const maxScrolls = 300; // Increased for large lists
    let lastHeight = 0;
    let stableCount = 0;
    
    while (scrollCount < maxScrolls && stableCount < 10) {
      // Get current height
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      
      if (currentHeight === lastHeight) {
        stableCount++;
      } else {
        stableCount = 0;
      }
      
      lastHeight = currentHeight;
      
      // Scroll down incrementally
      await page.evaluate(() => {
        window.scrollBy(0, 1000);
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      scrollCount++;
      if (scrollCount % 20 === 0) {
        console.log(`   Scroll ${scrollCount}/${maxScrolls}, height: ${currentHeight}`);
      }
      
      // Scroll to bottom periodically to trigger pagination
      if (scrollCount % 20 === 0) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`✅ Finished scrolling after ${scrollCount} iterations`);
    
    // Extract all attendees from the page
    console.log('📊 Extracting attendee data from page...');
    
    // First, save the full HTML for debugging
    const fullHtml = await page.content();
    fs.writeFileSync('public/dpi-full-page-content.html', fullHtml);
    console.log('✅ Saved full HTML to public/dpi-full-page-content.html');
    
    const attendees = await page.evaluate(() => {
      const attendeeList = [];
      
      // Method 1: Try to extract from JSON script tags
      const scriptTags = document.querySelectorAll('script[type="application/json"]');
      console.log(`Found ${scriptTags.length} JSON script tags`);
      
      for (const script of scriptTags) {
        const id = script.getAttribute('id');
        if (id === 'bootstrap-data-query') {
          try {
            const data = JSON.parse(script.textContent);
            if (data.users && Array.isArray(data.users)) {
              console.log(`Found ${data.users.length} users in bootstrap-data-query`);
              return data.users.map(user => ({
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                company: user.company || '',
                title: user.title || '',
                countryCode: user.countryCode || '',
                country: user.country || '',
                web: user.web || '',
                industry: user.industry || '',
                photoUrl: user.photoUrl || '',
                summary: user.summary || ''
              }));
            }
          } catch (e) {
            console.error(`Failed to parse bootstrap-data-query:`, e);
          }
        }
      }
      
      // Method 2: Fallback - extract from HTML with regex
      const pageText = document.body.innerHTML;
      
      // More comprehensive regex pattern
      const userPattern = /\{"id":(\d+),"firstName":"([^"]*)","lastName":"([^"]*)","company":"([^"]*)"?,"title":"([^"]*)"?,"countryCode":"([^"]*)"?,"country":"([^"]*)"?,"web":"([^"]*)"?,"industry":"([^"]*)"?,"(?:[^"]+":"[^"]*"?,"?)*"photoUrl":"([^"]*)"?/g;
      
      let match;
      while ((match = userPattern.exec(pageText)) !== null) {
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
      const ekstep = uniqueAttendees.filter(a => a.company.toLowerCase().includes('ekstep'));
      console.log('Ekstep attendees:', ekstep);
    }
    
    // Show sample
    console.log('\n📋 Sample attendees:');
    uniqueAttendees.slice(0, 5).forEach(att => {
      console.log(`   - ${att.name} (${att.company}) - ${att.title}`);
    });
    
    console.log('\n✅ Saved to public/dpi-all-attendees-full.json');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n⏸️  Keeping browser open for 60 seconds for manual inspection...');
    console.log('   You can manually check if all 1455 attendees are loaded.');
    await new Promise(resolve => setTimeout(resolve, 60000));
    await browser.close();
  }
}

scrapeAllAttendees().catch(console.error);

