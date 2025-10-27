import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'actors.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const actors = JSON.parse(fileContents);
    
    return NextResponse.json(actors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load actors' }, { status: 500 });
  }
}

