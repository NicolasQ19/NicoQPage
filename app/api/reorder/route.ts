import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const { order } = await req.json() as { order: number[] };

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'Se necesita un array de IDs' }, { status: 400 });
  }

  const tracksPath = path.join(process.cwd(), 'tracks.json');
  const tracks = JSON.parse(await readFile(tracksPath, 'utf-8'));

  const byId = new Map(tracks.map((t: { id: number }) => [t.id, t]));
  const reordered = order.map(id => byId.get(id)).filter(Boolean);

  // Append any tracks not in the order array (safety net)
  for (const t of tracks) {
    if (!order.includes(t.id)) reordered.push(t);
  }

  await writeFile(tracksPath, JSON.stringify(reordered, null, 2) + '\n');
  return NextResponse.json({ ok: true });
}
