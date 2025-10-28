/**
 * Professional LinkedIn Scraper
 * Uses Puppeteer with stealth mode to avoid detection
 * Runs in headless Chrome with your logged-in profile
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

export interface LinkedInScrapeResult {
  profileUrl: string;
  name: string;
  headline: string;
  location?: string;
  connections?: string;
  about?: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
  }>;
  skills: string[];
  profileImage?: string;
  recentActivity?: Array<{
    text: string;
    type: string;
    date: string;
  }>;
}

export async function scrapeLinkedInProfile(
  name: string,
  role?: string
): Promise<LinkedInScrapeResult | null> {
  const browser = await puppeteer.launch({
    headless: false, // Show browser to use your login
    userDataDir: '/Users/karthiknaig/Library/Application Support/Google/Chrome', // Use your Chrome profile
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to LinkedIn
    console.log('Navigating to LinkedIn...');
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle0' });
    
    // Search for the profile
    console.log(`Searching for: ${name}${role ? ' ' + role : ''}`);
    const searchSelector = 'input[aria-label="Search"]';
    await page.waitForSelector(searchSelector);
    await page.type(searchSelector, `${name}${role ? ' ' + role : ''}`);
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForSelector('li.reusable-search__result-container', { timeout: 10000 });
    
    // Click on the first result
    await page.click('li.reusable-search__result-container:first-child');
    
    // Wait for profile to load
    await page.waitForSelector('.pv-text-details__left-panel', { timeout: 10000 });
    
    // Extract profile data
    const profileData = await page.evaluate(() => {
      const extractText = (selector: string) => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || '';
      };
      
      const profile: any = {
        name: extractText('h1.text-heading-xlarge'),
        headline: extractText('.text-body-medium.break-words'),
        location: extractText('.text-body-small.inline.t-black--light'),
        connections: extractText('.t-bold span'),
        about: extractText('.inline-show-more span'),
        experience: [],
        education: [],
        skills: [],
        profileImage: '',
      };
      
      // Extract profile image
      const img = document.querySelector('.pv-top-card-profile-picture__image') as HTMLImageElement;
      if (img) {
        profile.profileImage = img.src;
      }
      
      // Extract experience
      const expElements = document.querySelectorAll('#experience ~ .pvs-list__container .pvs-entity');
      expElements.forEach((el: any) => {
        const title = el.querySelector('span[aria-hidden="true"]')?.textContent?.trim();
        const company = el.querySelector('a[data-field="experience_company_logo"]')?.getAttribute('aria-label');
        const duration = el.querySelector('.pvs-entity__caption-wrapper .t-14.t-normal.t-black--light')?.textContent?.trim();
        if (title) {
          profile.experience.push({ title, company: company || '', duration: duration || '' });
        }
      });
      
      // Extract education
      const eduElements = document.querySelectorAll('#education ~ .pvs-list__container .pvs-entity');
      eduElements.forEach((el: any) => {
        const school = el.querySelector('.pv-entity__school-name')?.textContent?.trim();
        const degree = el.querySelector('.pv-entity__degree-name')?.textContent?.trim();
        if (school) {
          profile.education.push({ school, degree: degree || '' });
        }
      });
      
      return profile;
    });
    
    // Look for recent activity about DPI
    const recentActivity = await page.evaluate(() => {
      const posts = document.querySelectorAll('.feed-shared-update-v2');
      const activity: any[] = [];
      
      posts.forEach((post: any, index: number) => {
        if (index < 3) { // Get first 3 posts
          const text = post.querySelector('.feed-shared-text-view span[aria-hidden="true"]')?.textContent?.trim();
          const type = 'post';
          if (text && (text.includes('DPI') || text.includes('Digital Public Infrastructure') || text.includes('digital public'))) {
            activity.push({ text, type, date: 'Recent' });
          }
        }
      });
      
      return activity;
    });
    
    profileData.recentActivity = recentActivity;
    profileData.profileUrl = page.url();
    
    console.log('Successfully scraped LinkedIn profile:', profileData);
    
    return profileData;
  } catch (error) {
    console.error('LinkedIn scraping error:', error);
    return null;
  } finally {
    await browser.close();
  }
}

