'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Track {
  id: number;
  artist: string;
  songName: string;
  year: string;
  audioUrl?: string;
  image?: string;
}

export default function AdminPage() {
  // ── Upload state
  const [songName, setSongName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [image, setImage] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Track list state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Track>>({});

  const loadTracks = useCallback(async () => {
    const res = await fetch('/api/tracks');
    if (res.ok) setTracks(await res.json());
  }, []);

  useEffect(() => { loadTracks(); }, [loadTracks]);

  // ── Upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage('Selecciona un archivo.');
      setStatus('error');
      return;
    }
    const name = file.name.replace(/\.[^.]+$/, '');
    setSongName(name);

    setStatus('uploading');
    setMessage('Subiendo...');

    const form = new FormData();
    form.append('file', file);
    form.append('songName', name);
    form.append('year', year);
    if (image.trim()) form.append('image', image.trim());

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setStatus('done');
      setMessage(`"${data.track.songName}" agregado.`);
      setSongName('');
      setImage('');
      if (fileRef.current) fileRef.current.value = '';
      loadTracks();
    } catch {
      setStatus('error');
      setMessage('Error al subir. Revisa la consola.');
    }
  };

  // ── Drag & drop
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const updated = [...tracks];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setTracks(updated);
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  // ── Save order
  const saveOrder = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: tracks.map(t => t.id) }),
      });
      if (res.ok) { setMessage('Orden guardado.'); setStatus('done'); }
    } catch {
      setMessage('Error al guardar el orden.');
      setStatus('error');
    }
    setSaving(false);
  };

  // ── Move with buttons
  const move = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= tracks.length) return;
    const updated = [...tracks];
    [updated[idx], updated[to]] = [updated[to], updated[idx]];
    setTracks(updated);
  };

  // ── Edit track
  const startEdit = (track: Track) => {
    setEditingId(track.id);
    setEditForm({ songName: track.songName, year: track.year, image: track.image || '', artist: track.artist });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    try {
      const res = await fetch(`/api/tracks/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setMessage('Tema actualizado.');
        setStatus('done');
        setEditingId(null);
        setEditForm({});
        loadTracks();
      }
    } catch {
      setMessage('Error al guardar.');
      setStatus('error');
    }
  };

  // ── Delete track
  const deleteTrack = async (track: Track) => {
    if (!confirm(`Eliminar "${track.songName}"?`)) return;
    try {
      const res = await fetch(`/api/tracks/${track.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage(`"${track.songName}" eliminado.`);
        setStatus('done');
        loadTracks();
      }
    } catch {
      setMessage('Error al eliminar.');
      setStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f0ece3',
      fontFamily: 'monospace',
      padding: '2rem',
      maxWidth: '640px',
      margin: '0 auto',
      overflowY: 'auto',
    }}>
      {/* ── Upload form ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.2rem', opacity: 0.6 }}>+ agregar tema</h1>

        <label>
          <span style={labelStyle}>Archivo (mp3/wav)</span>
          <input ref={fileRef} type="file" accept="audio/*" style={inputStyle} onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              const name = file.name.replace(/\.[^.]+$/, '');
              setSongName(name);
            }
          }} />
        </label>

        {songName && (
          <p style={{ fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>
            Nombre: <strong style={{ opacity: 1 }}>{songName}</strong>
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label style={{ flex: '0 0 100px' }}>
            <span style={labelStyle}>Año</span>
            <input type="text" value={year} onChange={e => setYear(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ flex: 1 }}>
            <span style={labelStyle}>Imagen (URL, opcional)</span>
            <input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." style={inputStyle} />
          </label>
        </div>

        <button type="submit" disabled={status === 'uploading'} style={btnStyle(status === 'uploading')}>
          {status === 'uploading' ? 'subiendo...' : 'subir tema'}
        </button>
      </form>

      {/* ── Track list ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', opacity: 0.6, margin: 0 }}>temas</h2>
          <button onClick={saveOrder} disabled={saving} style={{ ...btnStyle(saving), padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            {saving ? 'guardando...' : 'guardar orden'}
          </button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tracks.map((track, idx) => (
            <li
              key={track.id}
              draggable={editingId !== track.id}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              style={{
                padding: '0.6rem 0.75rem',
                background: dragIdx === idx ? '#1a2a1a' : overIdx === idx ? '#1a1a2a' : '#111',
                borderBottom: '1px solid #222',
                cursor: editingId === track.id ? 'default' : 'grab',
                opacity: dragIdx === idx ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
            >
              {editingId === track.id ? (
                /* ── Edit mode ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>
                    <span style={labelStyle}>Nombre</span>
                    <input
                      type="text"
                      value={editForm.songName || ''}
                      onChange={e => setEditForm(f => ({ ...f, songName: e.target.value }))}
                      style={inputStyle}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <label style={{ flex: '0 0 80px' }}>
                      <span style={labelStyle}>Año</span>
                      <input
                        type="text"
                        value={editForm.year || ''}
                        onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ flex: 1 }}>
                      <span style={labelStyle}>Imagen URL</span>
                      <input
                        type="text"
                        value={editForm.image || ''}
                        onChange={e => setEditForm(f => ({ ...f, image: e.target.value }))}
                        style={inputStyle}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={saveEdit} style={{ ...btnStyle(false), padding: '0.4rem 0.8rem', fontSize: '0.8rem', flex: 1 }}>
                      guardar
                    </button>
                    <button onClick={cancelEdit} style={{ ...btnStyle(false), padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#333', color: '#f0ece3' }}>
                      cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Normal mode ── */
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ opacity: 0.3, fontSize: '0.8rem', width: '24px', textAlign: 'center' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '0.25rem' }}>
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} style={arrowBtn}>&#9650;</button>
                    <button onClick={() => move(idx, 1)} disabled={idx === tracks.length - 1} style={arrowBtn}>&#9660;</button>
                  </div>

                  <span style={{ flex: 1, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.songName}
                  </span>
                  <span style={{ opacity: 0.3, fontSize: '0.75rem', marginRight: '0.25rem' }}>{track.year}</span>

                  <button onClick={() => startEdit(track)} style={actionBtn} title="Editar">
                    &#9998;
                  </button>
                  <button onClick={() => deleteTrack(track)} style={{ ...actionBtn, color: '#a44' }} title="Eliminar">
                    &#10005;
                  </button>
                  <span style={{ opacity: 0.2, fontSize: '0.7rem' }}>&#9776;</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Status message ── */}
      {message && (
        <p style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: status === 'error' ? '#2a1010' : '#102a10',
          fontSize: '0.85rem',
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  opacity: 0.5,
  marginBottom: '0.25rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  background: '#1a1a1a',
  border: '1px solid #333',
  color: '#f0ece3',
  fontFamily: 'monospace',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '0.75rem',
  background: disabled ? '#333' : '#f0ece3',
  color: '#0a0a0a',
  border: 'none',
  cursor: disabled ? 'wait' : 'pointer',
  fontFamily: 'monospace',
  fontSize: '0.95rem',
  fontWeight: 'bold',
});

const arrowBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#f0ece3',
  cursor: 'pointer',
  padding: 0,
  fontSize: '0.6rem',
  lineHeight: 1,
  opacity: 0.4,
};

const actionBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#f0ece3',
  cursor: 'pointer',
  padding: '0.2rem',
  fontSize: '0.85rem',
  opacity: 0.5,
};
