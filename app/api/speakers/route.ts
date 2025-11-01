import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';

type Speaker = {
  name: string;
  title?: string;
  organization?: string;
};

async function fetchPage(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return await res.text();
}

function parseSpeakers(html: string): Speaker[] {
  const $ = cheerio.load(html);
  const speakers: Speaker[] = [];
  // Heuristic selectors tailored to provided page
  // Look for blocks with name in <strong> or heading, followed by role/org lines
  $('[data-name], .speaker, .elementor-widget-container, .ev-spkr, .card').each((_, el) => {
    const block = $(el);
    let name = block.find('strong').first().text().trim();
    if (!name) name = block.find('h3, h4').first().text().trim();
    if (!name) return;
    const lines = block.text().split('\n').map(s => s.trim()).filter(Boolean);
    // try to find a title and org line after name
    const idx = lines.findIndex(l => l === name);
    const after = idx >= 0 ? lines.slice(idx + 1) : lines;
    const title = after[0] || undefined;
    const organization = after[1] || undefined;
    speakers.push({ name, title, organization });
  });
  // Fallback: parse repeated blocks listing name, title, org separately
  if (speakers.length === 0) {
    $('strong').each((_, s) => {
      const name = $(s).text().trim();
      if (!name) return;
      const parent = $(s).closest('*');
      const txt = parent.text();
      const lines = txt.split('\n').map(t => t.trim()).filter(Boolean);
      const idx = lines.findIndex(l => l === name);
      const title = lines[idx + 1];
      const organization = lines[idx + 2];
      speakers.push({ name, title, organization });
    });
  }
  // de-duplicate by name
  const seen = new Set<string>();
  return speakers.filter(s => {
    if (seen.has(s.name.toLowerCase())) return false;
    seen.add(s.name.toLowerCase());
    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const url = process.env.SPEAKERS_URL || 'https://www.globaldpisummit.org/page/4967567/speakers';
    const html = await fetchPage(url);
    const speakers = parseSpeakers(html);

    try {
      const outDir = path.join(process.cwd(), 'public', 'data');
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, 'speakers.json'), JSON.stringify({ source: url, updatedAt: new Date().toISOString(), speakers }, null, 2));
    } catch (e) {
      console.warn('Failed to persist speakers.json', e);
    }

    return NextResponse.json({ speakers });
  } catch (e: any) {
    console.error('speakers GET error', e);
    return NextResponse.json({ error: 'Failed to load speakers' }, { status: 500 });
  }
}


