const puppeteer = require('puppeteer');

async function scrapeAttendees() {
  console.log('🚀 Starting DPI Summit attendee scraping...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    userDataDir: false // Use default Chrome profile
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the community page with token
    const url = 'https://www.globaldpisummit.org/auth/emailLogin/verify?token=i1C-PxQCC9COu_Bhho4epLB6qfao1Izw-B9Z0ITngxg&eventGroupId=125268&redirectUrl=https://www.globaldpisummit.org/community';
    
    console.log('📄 Navigating to DPI Summit community...');
    await page.goto(url, { waitUntil: 'networkidle' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if we're logged in or need to login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'public/dpi-community-page.png' });
    console.log('📸 Screenshot saved to public/dpi-community-page.png');
    
    // Try to find attendee list or community members
    const pageContent = await page.content();
    
    // Look for JSON data or attendee information
    const jsonDataMatches = pageContent.match(/<script[^>]*id="bootstrap-data-[^"]*"[^>]*>([^<]+)<\/script>/g);
    
    if (jsonDataMatches) {
      console.log('📊 Found bootstrap data, extracting...');
      
      const attendees = [];
      
      for (const match of jsonDataMatches) {
        try {
          const jsonData = match.match(/>([^<]+)</)?.[1];
          if (jsonData) {
            const data = JSON.parse(jsonData);
            console.log('Found data:', Object.keys(data));
            
            // Look for attendees/members in the data
            if (data.members || data.attendees || data.users) {
              const members = data.members || data.attendees || data.users;
              if (Array.isArray(members)) {
                attendees.push(...members);
              }
            }
          }
        } catch (e) {
          console.log('Could not parse JSON:', e.message);
        }
      }
      
      if (attendees.length > 0) {
        console.log(`\n✅ Found ${attendees.length} attendees`);
        return attendees;
      }
    }
    
    // Try to find network/community page elements
    const networkLinks = await page.$$('a[href*="network"], a[href*="community"], a[href*="attendees"]');
    console.log(`Found ${networkLinks.length} potential network links`);
    
    // Look for any tables or lists with names
    const nameElements = await page.evaluate(() => {
      return document.querySelectorAll('li, tr, .member, .attendee, .participant').length;
    });
    console.log(`Found ${nameElements} potential name containers`);
    
    console.log('\n💡 Page might require authentication or specific interactions');
    console.log('📸 Check /tmp/dpi-community-page.png to see what\'s visible');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
  
  return [];
}

scrapeAttendees().then(attendees => {
  if (attendees.length > 0) {
    console.log('\n📋 Extracted attendees:', JSON.stringify(attendees, null, 2));
  }
}).catch(console.error);

