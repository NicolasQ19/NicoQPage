import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  const tracksPath = path.join(process.cwd(), 'tracks.json');
  const tracks = JSON.parse(await readFile(tracksPath, 'utf-8'));
  return NextResponse.json(tracks);
}
