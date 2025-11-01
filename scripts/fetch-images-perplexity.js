const fs = require('fs');
const path = require('path');

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const STORAGE_PATH = path.join(__dirname, '../public/storage.json');

// Read storage
function getStorage() {
  return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
}

// Update storage
function saveStorage(storage) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(storage, null, 2));
}

async function fetchImageForActor(actor) {
  if (!PERPLEXITY_API_KEY) {
    console.log('No Perplexity API key');
    return null;
  }

  try {
    // Build query with context to ensure we get the right person
    let query = `Find the professional photo or profile picture URL for ${actor.name}`;
    
    if (actor.contactRole) {
      query += `, who is ${actor.contactRole}`;
    }
    
    if (actor.sector) {
      query += ` in the ${actor.sector.toLowerCase()} sector`;
    }
    
    if (actor.linkedinHeadline) {
      query += `. Note: ${actor.linkedinHeadline}`;
    } else if (actor.roleInEcosystem) {
      // Extract key identifiers from role description
      const roleContext = actor.roleInEcosystem.toLowerCase();
      if (roleContext.includes('world bank')) query += ' at World Bank';
      if (roleContext.includes('itu')) query += ' at ITU';
      if (roleContext.includes('undp')) query += ' at UNDP';
      if (roleContext.includes('unicef')) query += ' at UNICEF';
      if (roleContext.includes('gates')) query += ' at Gates Foundation';
      if (roleContext.includes('rockefeller')) query += ' at Rockefeller Foundation';
    }
    
    query += '. Return ONLY a valid image URL (jpg, png, webp format) or the word "null" if not found. Make sure it is the correct person based on the context provided.';

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: query }],
        temperature: 0.1, // Lower temperature for more accuracy
        max_tokens: 500,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      
      if (content && content.startsWith('http') && /\.(jpg|jpeg|png|webp)$/i.test(content)) {
        return content;
      }
    }
  } catch (error) {
    console.error(`Error fetching image for ${actor.name}:`, error);
  }
  return null;
}

async function main() {
  const storage = getStorage();
  const actors = Object.values(storage).filter(a => !a.profileImage || a.profileImage === '');
  
  console.log(`📸 Fetching images for ${actors.length} actors using Perplexity...\n`);
  
  for (let i = 0; i < actors.length; i++) {
    const actor = actors[i];
    console.log(`[${i + 1}/${actors.length}] Processing: ${actor.name}${actor.contactRole ? ` (${actor.contactRole})` : ''}`);
    
    const imageUrl = await fetchImageForActor(actor);
    
    if (imageUrl) {
      storage[actor.id].profileImage = imageUrl;
      console.log(`   ✓ Found validated image: ${imageUrl}`);
      saveStorage(storage);
    } else {
      console.log(`   ✗ No verified image found`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ Complete!');
}

main().catch(console.error);

