'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Disc3, GripVertical, Loader2, Music2, Pencil, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react';
import styles from './admin.module.css';

import type { Track } from '@/types/track';


export default function AdminPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [songName, setSongName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [image, setImage] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Partial<Track>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const loadTracks = useCallback(async () => {
    const res = await fetch('/api/tracks');
    if (!res.ok) throw new Error('No se pudieron cargar los temas.');
    setTracks(await res.json());
    setDirty(false);
  }, []);

  useEffect(() => {
    loadTracks().catch(() => setNotice({ text: 'No se pudo cargar la biblioteca. Recargá la página para reintentar.', error: true })).finally(() => setLoading(false));
  }, [loadTracks]);

  async function run(action: string, request: () => Promise<void>) {
    setBusy(action);
    setNotice(null);
    try { await request(); } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'No se pudo completar la acción. Intentá de nuevo.', error: true });
    } finally { setBusy(null); }
  }

  function selectFile(selected: File | undefined) {
    if (!selected) return;
    if (!selected.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(selected.name)) {
      setNotice({ text: 'Elegí un archivo de audio válido.', error: true }); return;
    }
    setFile(selected);
    setSongName(selected.name.replace(/\.[^.]+$/, ''));
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !songName.trim()) return;
    await run('upload', async () => {
      const form = new FormData();
      form.append('file', file); form.append('songName', songName.trim()); form.append('year', year); form.append('image', image.trim());
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('No se pudo subir el tema. Verificá que el servidor permita guardar archivos.');
      await loadTracks();
      setFile(null); setSongName(''); setImage('');
      if (fileRef.current) fileRef.current.value = '';
      setNotice({ text: 'Tema agregado a tu biblioteca.' });
    });
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= tracks.length) return;
    const next = [...tracks]; const [track] = next.splice(from, 1); next.splice(to, 0, track);
    setTracks(next); setDirty(true);
  }

  const visibleTracks = tracks.filter(t => `${t.songName} ${t.artist} ${t.year}`.toLowerCase().includes(query.toLowerCase()));

  return <main className={styles.shell}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}>NICO<span>Q</span><span className={styles.brandDivider}>/</span><small>STUDIO</small></Link>
      <Link href="/" className={styles.siteLink}>Ver sitio <ArrowUpRight size={15} /></Link>
    </header>
    <div className={styles.content}>
      <div className={styles.heading}><div><p className={styles.eyebrow}><span /> TU ESPACIO DE CONTROL</p><h1>La música, a tu manera<span>.</span></h1><p className={styles.subtitle}>Subí nuevos sonidos. Dale forma a tu biblioteca.</p></div><div className={styles.counter}><Disc3 size={24} /><strong>{String(tracks.length).padStart(2, '0')}</strong><span>temas en biblioteca</span></div></div>
      {notice && <div role={notice.error ? 'alert' : 'status'} className={`${styles.notice} ${notice.error ? styles.error : ''}`}><span>{notice.error ? <X size={17} /> : <Check size={17} />}{notice.text}</span><button aria-label="Cerrar mensaje" onClick={() => setNotice(null)}><X size={16} /></button></div>}
      <div className={styles.workspace}>
        <aside className={styles.uploadPanel}>
          <div className={styles.sectionTitle}><span className={styles.sectionIcon}><Plus size={18} /></span><div><h2>Nuevo tema</h2><p>El próximo en sonar.</p></div></div>
          <form onSubmit={upload}>
            <label className={`${styles.dropzone} ${file ? styles.fileSelected : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy && !dirty) selectFile(e.dataTransfer.files[0]); }}>
              <input ref={fileRef} type="file" accept="audio/*" disabled={!!busy || dirty} onChange={e => selectFile(e.target.files?.[0])} aria-label="Seleccionar archivo de audio" />
              <span className={styles.uploadIcon}>{file ? <Music2 size={25} /> : <Upload size={25} />}</span>
              <strong>{file ? file.name : 'Arrastrá tu audio acá'}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · Cambiar archivo` : 'o hacé clic para elegir un archivo'}</span><small>MP3, WAV y otros formatos de audio</small>
            </label>
            <label className={styles.field}>Nombre del tema<input value={songName} onChange={e => setSongName(e.target.value)} placeholder="Dale un nombre a tu sonido" required disabled={!!busy} /></label>
            <label className={styles.field}>Año<input value={year} onChange={e => setYear(e.target.value)} placeholder="2026" required maxLength={4} inputMode="numeric" disabled={!!busy} /></label>
            <label className={styles.field}>Imagen de portada <span>opcional</span><input type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." disabled={!!busy} /></label>
            <button className={styles.primary} disabled={!file || !songName.trim() || !!busy || dirty}>{busy === 'upload' ? <Loader2 size={17} className={styles.spin} /> : <Plus size={17} />}{busy === 'upload' ? 'Subiendo tema…' : 'Agregar a la biblioteca'}</button>
            <p className={styles.formHint}>{dirty ? 'Guardá el orden pendiente antes de agregar un tema.' : 'El nombre y la portada se pueden editar después.'}</p>
          </form>
        </aside>
        <section className={styles.library} aria-labelledby="library-title">
          <div className={styles.libraryHeading}><div><p className={styles.eyebrow}>TU COLECCIÓN</p><h2 id="library-title">Biblioteca <span>{tracks.length}</span></h2></div><button className={dirty ? styles.primary : styles.secondary} disabled={!dirty || !!busy} onClick={() => run('order', async () => {
            const res = await fetch('/api/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: tracks.map(t => t.id) }) });
            if (!res.ok) throw new Error('No se pudo guardar el orden. Intentá de nuevo.');
            setDirty(false); setNotice({ text: 'Orden de la biblioteca guardado.' });
          })}>{busy === 'order' ? <Loader2 size={15} className={styles.spin} /> : <Save size={15} />}Guardar orden</button></div>
          <div className={styles.search}><Search size={17} /><input aria-label="Buscar temas" placeholder="Buscar por tema, artista o año…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda"><X size={15} /></button>}</div>
          <div className={styles.listMeta}><span>{dirty ? '● Cambios de orden sin guardar' : 'LISTA DE TEMAS'}</span><span>{query ? `${visibleTracks.length} resultados` : 'Arrastrá para reordenar'}</span></div>
          {loading ? <div className={styles.empty}><Loader2 className={styles.spin} />Cargando tu biblioteca…</div> : visibleTracks.length === 0 ? <div className={styles.empty}><Disc3 size={32} /><h3>{query ? 'No encontramos ese tema' : 'Todo empieza con un tema'}</h3><p>{query ? 'Probá con otro nombre, artista o año.' : 'Agregá tu primer audio para empezar.'}</p></div> : <ul className={styles.trackList}>{visibleTracks.map(track => {
            const idx = tracks.findIndex(t => t.id === track.id);
            return <li key={track.id} className={`${styles.track} ${overId === track.id ? styles.dragOver : ''} ${dragId === track.id ? styles.dragging : ''}`} draggable={!busy && editingId === null && !query} onDragStart={() => setDragId(track.id)} onDragOver={e => { e.preventDefault(); setOverId(track.id); }} onDragEnd={() => { setDragId(null); setOverId(null); }} onDrop={e => { e.preventDefault(); if (dragId !== null && !busy && !query) move(tracks.findIndex(t => t.id === dragId), idx); setDragId(null); setOverId(null); }}>
              {editingId === track.id ? <form className={styles.editForm} onSubmit={e => { e.preventDefault(); run('edit', async () => {
                const res = await fetch(`/api/tracks/${track.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) });
                if (!res.ok) throw new Error('No se pudieron guardar los cambios.');
                setTracks(current => current.map(t => t.id === track.id ? { ...t, ...edit } : t)); setEditingId(null); setNotice({ text: 'Tema actualizado.' });
              }); }}><div className={styles.editHeader}><Pencil size={14} />Editando tema</div><label className={styles.field}>Nombre<input required value={edit.songName || ''} onChange={e => setEdit({ ...edit, songName: e.target.value })} /></label><div className={styles.editColumns}><label className={styles.field}>Artista<input value={edit.artist || ''} onChange={e => setEdit({ ...edit, artist: e.target.value })} /></label><label className={styles.field}>Año<input required value={edit.year || ''} onChange={e => setEdit({ ...edit, year: e.target.value })} /></label></div><label className={styles.field}>Imagen de portada<input type="url" value={edit.image || ''} onChange={e => setEdit({ ...edit, image: e.target.value })} /></label><div className={styles.editActions}><button type="button" className={styles.secondary} disabled={!!busy} onClick={() => setEditingId(null)}>Cancelar</button><button className={styles.primary} disabled={!!busy}><Check size={15} />{busy === 'edit' ? 'Guardando…' : 'Guardar cambios'}</button></div></form> : <>
                <span className={styles.grip}><GripVertical size={15} /></span><span className={styles.index}>{String(idx + 1).padStart(2, '0')}</span><span className={styles.artwork}><Music2 size={19} /></span><div className={styles.trackInfo}><h3>{track.songName}</h3><p>{track.artist} <span> / </span> {track.year}</p></div><div className={styles.trackActions}><div className={styles.moveButtons}><button disabled={idx === 0 || !!busy || !!query} aria-label={`Subir ${track.songName}`} onClick={() => move(idx, idx - 1)}><ArrowUp size={14} /></button><button disabled={idx === tracks.length - 1 || !!busy || !!query} aria-label={`Bajar ${track.songName}`} onClick={() => move(idx, idx + 1)}><ArrowDown size={14} /></button></div><button disabled={!!busy} aria-label={`Editar ${track.songName}`} onClick={() => { setEditingId(track.id); setEdit({ songName: track.songName, year: track.year, image: track.image || '', artist: track.artist }); }}><Pencil size={16} /></button><button className={styles.delete} disabled={!!busy || dirty} aria-label={`Eliminar ${track.songName}`} onClick={() => {
                  if (!confirm(`¿Eliminar "${track.songName}" y su archivo de audio? Esta acción no se puede deshacer.`)) return;
                  run(`delete-${track.id}`, async () => { const res = await fetch(`/api/tracks/${track.id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('No se pudo eliminar el tema.'); await loadTracks(); setNotice({ text: 'Tema eliminado.' }); });
                }}>{busy === `delete-${track.id}` ? <Loader2 size={16} className={styles.spin} /> : <Trash2 size={16} />}</button></div>
              </>}
            </li>;
          })}</ul>}
          <footer className={styles.libraryFooter}><span>NICOQ / MUSIC LIBRARY</span><span>Tu sonido. Tu orden.</span></footer>
        </section>
      </div>
    </div>
  </main>;
}
