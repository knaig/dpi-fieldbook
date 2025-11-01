const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeAttendees() {
  console.log('🚀 Starting DPI Summit attendee scraping...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    const url = 'https://www.globaldpisummit.org/auth/emailLogin/verify?token=i1C-PxQCC9COu_Bhho4epLB6qfao1Izw-B9Z0ITngxg&eventGroupId=125268&redirectUrl=https://www.globaldpisummit.org/community';
    
    console.log('📄 Navigating to DPI Summit community...');
    await page.goto(url);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Wait for community/member list to load
    try {
      await page.waitForSelector('.member, .attendee-card, .people-item, [class*="member"], [class*="attendee"]', { timeout: 5000 });
      console.log('✅ Found attendee elements on page');
    } catch (e) {
      console.log('⚠️  No attendee elements found, checking for JSON data...');
    }
    
    // Look for JSON data in the page
    const jsonData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[id^="bootstrap-data"]'));
      const data = {};
      scripts.forEach(script => {
        try {
          const id = script.id;
          const text = script.textContent;
          if (text) {
            const parsed = JSON.parse(text);
            data[id] = parsed;
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
      return data;
    });
    
    console.log('📊 Found bootstrap data:', Object.keys(jsonData));
    fs.writeFileSync('public/dpi-bootstrap-data.json', JSON.stringify(jsonData, null, 2));
    
    // Screenshot
    await page.screenshot({ path: 'public/dpi-page.png', fullPage: true });
    console.log('📸 Screenshot saved to public/dpi-page.png');
    
    // Get page content
    const pageContent = await page.content();
    fs.writeFileSync('public/dpi-page-content.html', pageContent);
    console.log('💾 Page content saved to public/dpi-page-content.html');
    
    console.log('\n✅ Done! Please check the screenshot and HTML to see what data is available.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n⏸️  Keeping browser open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

scrapeAttendees().catch(console.error);

