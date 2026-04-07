import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const songName = formData.get('songName') as string;
  const year = (formData.get('year') as string) || new Date().getFullYear().toString();
  const image = (formData.get('image') as string) || '';

  if (!file || !songName) {
    return NextResponse.json({ error: 'Falta archivo o nombre' }, { status: 400 });
  }

  const ext = path.extname(file.name);
  const destName = songName + ext;
  const destPath = path.join(process.cwd(), 'public', 'audio', destName);

  // Save file
  const bytes = await file.arrayBuffer();
  await writeFile(destPath, Buffer.from(bytes));

  // Update tracks.json
  const tracksPath = path.join(process.cwd(), 'tracks.json');
  const tracks = JSON.parse(await readFile(tracksPath, 'utf-8'));
  const maxId = tracks.reduce((max: number, t: { id: number }) => Math.max(max, t.id), 0);

  const newTrack: Record<string, string | number> = {
    id: maxId + 1,
    artist: 'NicoQ',
    songName,
    year,
    audioUrl: `/audio/${destName}`,
  };
  if (image) newTrack.image = image;

  tracks.unshift(newTrack);
  await writeFile(tracksPath, JSON.stringify(tracks, null, 2) + '\n');

  return NextResponse.json({ ok: true, track: newTrack });
}
