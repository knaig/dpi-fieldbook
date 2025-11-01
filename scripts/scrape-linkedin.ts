#!/usr/bin/env tsx
/**
 * LinkedIn Profile Scraper
 * Runs with your logged-in Chrome profile
 * Usage: npm run scrape-linkedin "Pramod Varma" "Chief Architect"
 */

import puppeteer from 'puppeteer';

async function scrapeLinkedInProfile(name: string, role?: string) {
  console.log(`🔍 Scraping LinkedIn for: ${name}${role ? ' - ' + role : ''}`);
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    userDataDir: '/Users/karthiknaig/Library/Application Support/Google/Chrome/Default', // Your Chrome profile
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    console.log('Navigating to LinkedIn...');
    await page.goto('https://www.linkedin.com');
    
    // Wait for login or feed to load
    await page.waitForSelector('input[aria-label="Search"]', { timeout: 30000 });
    console.log('✓ LinkedIn loaded');
    
    // Search for profile
    const searchQuery = role ? `${name} ${role}` : name;
    console.log(`Searching for: ${searchQuery}`);
    
    await page.click('input[aria-label="Search"]');
    await page.type('input[aria-label="Search"]', searchQuery);
    await page.keyboard.press('Enter');
    
    await sleep(2000);
    
    // Click People filter
    try {
      await page.waitForSelector('button[aria-label="People"]', { timeout: 5000 });
      await page.click('button[aria-label="People"]');
    } catch (e) {
      console.log('People filter not found, continuing...');
    }
    
    await sleep(1000);
    
    // Click first result
    console.log('Clicking first search result...');
    const firstResult = await page.$$('li.reusable-search__result-container');
    if (firstResult.length > 0) {
      await firstResult[0].click();
      console.log('✓ Opened profile');
    } else {
      console.log('No results found');
      return null;
    }
    
    await sleep(3000);
    
    // Extract profile data
    console.log('Extracting profile data...');
    const profileData = await page.evaluate(() => {
      const getText = (selector: string, root?: Element) => {
        try {
          const el = (root || document).querySelector(selector);
          return el?.textContent?.trim() || '';
        } catch {
          return '';
        }
      };
      
      const profile: any = {
        name: '',
        headline: '',
        location: '',
        connections: '',
        about: '',
        profileImage: '',
        experience: [],
        education: [],
      };
      
      profile.name = getText('h1.text-heading-xlarge') || getText('h1.break-words');
      profile.headline = getText('.pv-text-details__left-panel-inline .text-body-medium.break-words');
      profile.location = getText('.text-body-small.inline');
      profile.connections = getText('span.dist-value');
      profile.about = getText('#about ~ .display-flex p span[aria-hidden="true"]');
      
      // Try to get profile image
      const img: any = document.querySelector('.pv-top-card-profile-picture__image, img.profile-photo-edit__preview') || 
                      document.querySelector('.presence-entity__image');
      if (img) {
        profile.profileImage = img.src;
      }
      
      // Extract experience
      const expSection = document.querySelector('#experience ~ .pvs-list__container');
      if (expSection) {
        const items = expSection.querySelectorAll('.pvs-list__item');
        items.forEach((item: any) => {
          const title = getText('.t-bold span[aria-hidden="true"]', item) || getText('.mr1 .t-bold span[aria-hidden="true"]', item);
          const company = getText('a[data-field="experience_company_logo"]', item);
          if (title) {
            profile.experience.push({ title, company });
          }
        });
      }
      
      return profile;
    });
    
    // Get DPI-related recent activity
    console.log('Checking for DPI-related posts...');
    await page.goto(`${page.url()}recent-activity/`);
    await sleep(2000);
    
    const recentActivity = await page.evaluate(() => {
      const posts: any[] = [];
        const postElements = document.querySelectorAll('.feed-shared-update-v2');
        
        postElements.forEach((post: any, idx: number) => {
          if (idx < 5) { // Get first 5 posts
            const text = post.textContent || '';
            if (text.toLowerCase().includes('dpi') || 
                text.toLowerCase().includes('digital public infrastructure') ||
                text.toLowerCase().includes('digital transformation')) {
              posts.push({
                text: text.substring(0, 200),
                type: 'DPI-related',
                url: post.querySelector('a')?.href || ''
              });
            }
          }
        });
        
        return posts;
    });
    
    profileData.recentActivity = recentActivity;
    profileData.profileUrl = page.url();
    
    console.log('✅ Scraping complete!');
    console.log('\n📊 Profile Data:');
    console.log(JSON.stringify(profileData, null, 2));
    
    return profileData;
    
  } catch (error: any) {
    console.error('❌ Scraping error:', error.message);
    return null;
  } finally {
    // Don't close browser so you can inspect
    console.log('Press Ctrl+C to close browser...');
  }
}

// Run scraper
const args = process.argv.slice(2);
const name = args[0];
const role = args[1];

if (!name) {
  console.log('Usage: npm run scrape-linkedin "Person Name" [Role]');
  console.log('Example: npm run scrape-linkedin "Pramod Varma" "Chief Architect"');
  process.exit(1);
}

scrapeLinkedInProfile(name, role).then(result => {
  if (result) {
    console.log('\n✅ Success! Profile data ready.');
    // Save to file or return
  } else {
    console.log('\n❌ Failed to scrape profile');
  }
});

