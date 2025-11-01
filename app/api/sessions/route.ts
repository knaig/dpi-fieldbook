import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Session } from '@/lib/prioritizeSessions';
import { promises as fs } from 'fs';
import path from 'path';

async function fetchWithAuth(url: string, token?: string, cookieHeader?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000), cache: 'no-store', redirect: 'follow' });
  return res;
}

function parseDate(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function extractDay(iso?: string): string | undefined {
  if (!iso) return undefined;
  return iso.slice(0, 10);
}

async function parseHtmlSchedule(html: string, base?: string): Promise<Session[]> {
  const $ = cheerio.load(html);
  const sessions: Session[] = [];
  // Heuristic selectors; adjust as needed for actual site
  $('.session, .event, [data-session-id]').each((_, el) => {
    const id = $(el).attr('data-session-id') || $(el).attr('id') || `${sessions.length}`;
    const title = $(el).find('.title, h3, h2').first().text().trim();
    if (!title) return;
    const description = $(el).find('.description, .summary, p').first().text().trim();
    const speakers = $(el).find('.speaker, .speakers, [data-speaker]').map((i, s) => $(s).text().trim()).get().filter(Boolean);
    const organizations = $(el).find('.org, .organization, .company').map((i, s) => $(s).text().trim()).get().filter(Boolean);
    const start = parseDate($(el).find('[data-start], time[datetime]').attr('data-start') || $(el).find('time[datetime]').attr('datetime'));
    const end = parseDate($(el).find('[data-end]').attr('data-end'));
    const href = $(el).find('a[href]').attr('href');
    const url = href && base ? new URL(href, base).toString() : href;
    sessions.push({ id, title, description, speakers, organizations, start, end, day: extractDay(start), url });
  });
  return sessions;
}

export async function GET(request: NextRequest) {
  try {
    const url = process.env.SESSIONS_URL || process.env.SCHEDULE_URL || 'https://www.globaldpisummit.org/agenda';
    const token = process.env.SESSIONS_TOKEN || process.env.SCHEDULE_TOKEN;
    const verifyUrl = process.env.SESSIONS_VERIFY_URL || process.env.SCHEDULE_VERIFY_URL;
    if (!url) {
      return NextResponse.json({ error: 'SESSIONS_URL not configured' }, { status: 400 });
    }

    // Optional: hit email-login verification endpoint to acquire authenticated cookies
    let cookieHeader: string | undefined = undefined;
    if (verifyUrl) {
      const vres = await fetch(verifyUrl, { signal: AbortSignal.timeout(15000), redirect: 'manual' });
      // collect set-cookie headers
      const setCookie = vres.headers.get('set-cookie');
      if (setCookie) {
        // In case of multiple cookies, we keep the header as-is
        cookieHeader = setCookie;
      }
      // Follow redirect chain once if Location provided to complete session
      const loc = vres.headers.get('location');
      if (loc) {
        await fetch(loc, { headers: cookieHeader ? { Cookie: cookieHeader } : undefined, redirect: 'follow', signal: AbortSignal.timeout(15000) }).catch(() => {});
      }
    }

    const res = await fetchWithAuth(url, token, cookieHeader);
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get('content-type') || '';
    let sessions: Session[] = [];
    if (contentType.includes('application/json')) {
      const data = await res.json();
      // Try to map common JSON shapes into Session[]
      const arr: any[] = Array.isArray(data) ? data : (Array.isArray((data as any).sessions) ? (data as any).sessions : []);
      sessions = arr.map((x, i) => ({
        id: String(x.id ?? i),
        title: String(x.title ?? x.name ?? ''),
        description: String(x.description ?? x.summary ?? ''),
        speakers: x.speakers ?? x.presenters ?? [],
        organizations: x.organizations ?? x.orgs ?? [],
        start: parseDate(x.start ?? x.startTime),
        end: parseDate(x.end ?? x.endTime),
        day: extractDay(parseDate(x.start ?? x.startTime)),
        url: x.url ?? x.link ?? undefined,
        tags: x.tags ?? [],
      })).filter(s => s.title);
    } else {
      const html = await res.text();
      sessions = await parseHtmlSchedule(html, url);
    }

    // Persist to public/data/sessions.json
    try {
      const outDir = path.join(process.cwd(), 'public', 'data');
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, 'sessions.json'), JSON.stringify({ source: url, updatedAt: new Date().toISOString(), sessions }, null, 2));
    } catch (e) {
      console.warn('Failed to persist sessions.json', e);
    }

    return NextResponse.json({ sessions });
  } catch (e: any) {
    console.error('sessions GET error', e);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}


