import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';

const tracksPath = path.join(process.cwd(), 'tracks.json');

async function getTracks() {
  return JSON.parse(await readFile(tracksPath, 'utf-8'));
}

async function saveTracks(tracks: Record<string, unknown>[]) {
  await writeFile(tracksPath, JSON.stringify(tracks, null, 2) + '\n');
}

// UPDATE track
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trackId = parseInt(id);
  const updates = await req.json();
  const tracks = await getTracks();

  const idx = tracks.findIndex((t: { id: number }) => t.id === trackId);
  if (idx === -1) return NextResponse.json({ error: 'Track no encontrado' }, { status: 404 });

  // Update allowed fields
  const allowed = ['songName', 'year', 'image', 'artist'];
  for (const key of allowed) {
    if (key in updates) tracks[idx][key] = updates[key];
  }

  await saveTracks(tracks);
  return NextResponse.json({ ok: true, track: tracks[idx] });
}

// DELETE track
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trackId = parseInt(id);
  const tracks = await getTracks();

  const idx = tracks.findIndex((t: { id: number }) => t.id === trackId);
  if (idx === -1) return NextResponse.json({ error: 'Track no encontrado' }, { status: 404 });

  const [removed] = tracks.splice(idx, 1);

  // Delete audio file if it exists
  if (removed.audioUrl) {
    const audioPath = path.join(process.cwd(), 'public', removed.audioUrl);
    try { await unlink(audioPath); } catch { /* file may not exist */ }
  }

  await saveTracks(tracks);
  return NextResponse.json({ ok: true });
}
