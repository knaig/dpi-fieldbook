import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { name, role } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    console.log(`Starting LinkedIn scrape for: ${name}`);

    const browser = await puppeteer.launch({
      headless: false,
      userDataDir: '/Users/karthiknaig/Library/Application Support/Google/Chrome/Default',
      defaultViewport: null,
      args: ['--start-maximized'],
    });

    try {
      const page = await browser.newPage();
      
      console.log('Navigating to LinkedIn...');
      await page.goto('https://www.linkedin.com', { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Search for profile
      const searchQuery = role ? `${name} ${role}` : name;
      console.log(`Searching for: ${searchQuery}`);
      
      await page.waitForSelector('input[aria-label="Search"]', { timeout: 15000 });
      await page.click('input[aria-label="Search"]');
      await page.type('input[aria-label="Search"]', searchQuery, { delay: 100 });
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Try to filter by People
      try {
        const peopleButton = await page.$('button[aria-label="People"]');
        if (peopleButton) {
          await peopleButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        console.log('Could not find People filter');
      }
      
      // Click first result
      console.log('Clicking first search result...');
      await page.waitForSelector('li.reusable-search__result-container', { timeout: 10000 });
      const firstResult = await page.$('li.reusable-search__result-container:first-child');
      if (firstResult) {
        await firstResult.click();
      } else {
        throw new Error('No search results found');
      }
      
      await page.waitForTimeout(3000);
      
      // Extract profile data
      const profileData = await page.evaluate(() => {
        const getText = (selector: string) => {
          try {
            const el = document.querySelector(selector);
            return el?.textContent?.trim() || '';
          } catch {
            return '';
          }
        };
        
        const getImage = (selector: string) => {
          try {
            const img = document.querySelector(selector) as HTMLImageElement;
            return img?.src || '';
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
        
        // Try multiple selectors for each field (LinkedIn changes them frequently)
        profile.name = getText('h1.text-heading-xlarge') || 
                       getText('h1.break-words') ||
                       getText('.pv-text-details__left-panel h1');
        
        profile.headline = getText('.pv-text-details__left-panel .text-body-medium') ||
                          getText('.text-body-medium.break-words');
        
        profile.location = getText('.text-body-small.inline.t-black--light') ||
                          getText('.inline.t-black--light');
        
        profile.connections = getText('span.dist-value') ||
                            getText('span[aria-label*="connections"]')?.match(/\d+/)?.[0] || '';
        
        profile.about = getText('#about ~ div p span[aria-hidden="true"]') ||
                       getText('.inline-show-more-text span[aria-hidden="true"]');
        
        // Try multiple image selectors
        profile.profileImage = getImage('.pv-top-card-profile-picture__image') ||
                              getImage('img.presence-entity__image') ||
                              getImage('img.profile-photo-edit__preview');
        
        // Extract experience
        const expContainer = document.querySelector('#experience ~ .pvs-list__container');
        if (expContainer) {
          const items = expContainer.querySelectorAll('.pvs-list__item');
          items.forEach((item: any) => {
            const spans = item.querySelectorAll('span[aria-hidden="true"]');
            if (spans.length > 0) {
              const title = spans[0]?.textContent?.trim();
              const company = spans[1]?.textContent?.trim() || '';
              if (title) {
                profile.experience.push({ title, company, duration: '' });
              }
            }
          });
        }
        
        return profile;
      });
      
      profileData.profileUrl = page.url();
      
      // Check for recent DPI-related activity
      try {
        console.log('Checking recent activity...');
        await page.goto(`${page.url()}recent-activity/`);
        await page.waitForTimeout(2000);
        
        const recentActivity = await page.evaluate(() => {
          const posts: any[] = [];
          const postElements = document.querySelectorAll('.feed-shared-update-v2');
          
          postElements.forEach((post: any, idx: number) => {
            if (idx < 5) {
              const text = post.textContent || '';
              if (text.toLowerCase().includes('dpi') || 
                  text.toLowerCase().includes('digital public infrastructure') ||
                  text.toLowerCase().includes('digital identity') ||
                  text.toLowerCase().includes('digital transformation')) {
                posts.push({
                  text: text.substring(0, 200),
                  type: 'DPI-related',
                });
              }
            }
          });
          
          return posts;
        });
        
        profileData.recentActivity = recentActivity;
      } catch (e) {
        console.log('Could not check recent activity:', e);
      }
      
      await browser.close();
      
      return NextResponse.json({ 
        success: true, 
        profile: profileData 
      });
      
    } catch (error: any) {
      await browser.close();
      throw error;
    }
    
  } catch (error: any) {
    console.error('LinkedIn scraping error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to scrape LinkedIn'
    }, { status: 500 });
  }
}

