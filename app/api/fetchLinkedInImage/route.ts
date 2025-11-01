import { NextRequest, NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { name, linkedinUrl } = await request.json();

    if (!linkedinUrl) {
      return NextResponse.json({ error: 'LinkedIn URL required' }, { status: 400 });
    }

    console.log(`[LINKEDIN IMAGE] Fetching image for ${name} from ${linkedinUrl}`);

    // Try LinkedIn OEmbed API for profile images
    const oembedUrl = `https://www.linkedin.com/oembed?url=${encodeURIComponent(linkedinUrl)}`;
    
    try {
      const oembedResponse = await fetch(oembedUrl);
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        if (oembedData.html) {
          // Extract image from oembed HTML
          const imgMatch = oembedData.html.match(/<img[^>]+src="([^"]+)"/);
          if (imgMatch && imgMatch[1]) {
            console.log(`[LINKEDIN IMAGE] Found image via OEmbed: ${imgMatch[1]}`);
            return NextResponse.json({ imageUrl: imgMatch[1], name });
          }
        }
      }
    } catch (e) {
      console.log(`[LINKEDIN IMAGE] OEmbed failed: ${e}`);
    }

    // Try to fetch the LinkedIn page and extract Open Graph image
    try {
      const pageResponse = await fetch(linkedinUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (pageResponse.ok) {
        const html = await pageResponse.text();
        
        // Try to find Open Graph image
        const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (ogImageMatch && ogImageMatch[1]) {
          console.log(`[LINKEDIN IMAGE] Found OG image: ${ogImageMatch[1]}`);
          return NextResponse.json({ imageUrl: ogImageMatch[1], name });
        }
        
        // Try to find profile image in HTML
        const profileImageMatch = html.match(/<img[^>]+class="[^"]*profile-image[^"]*"[^>]+src="([^"]+)"/i);
        if (profileImageMatch && profileImageMatch[1]) {
          console.log(`[LINKEDIN IMAGE] Found profile image: ${profileImageMatch[1]}`);
          return NextResponse.json({ imageUrl: profileImageMatch[1], name });
        }
      }
    } catch (e) {
      console.log(`[LINKEDIN IMAGE] HTML parsing failed: ${e}`);
    }

    console.log(`[LINKEDIN IMAGE] No image found for ${name}`);
    return NextResponse.json({ imageUrl: null, name });

  } catch (error) {
    console.error('[LINKEDIN IMAGE] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

