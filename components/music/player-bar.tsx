'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Disc3, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { Track } from '@/types/track';

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s <= 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

interface PlayerBarProps {
  project: Track | null;
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  hasTracks: boolean;
  error: string | null;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const PlayerBar = ({ project, audio, isPlaying, hasTracks, error, onPlayPause, onNext, onPrev }: PlayerBarProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const previousVolume = useRef(1);
  const mediaRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    mediaRef.current = audio;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if ('mediaSession' in navigator && Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate, position: Math.min(audio.currentTime, audio.duration) });
        } catch { /* Unsupported position state. */ }
      }
    };
    const onDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onVolume = () => { setVolume(audio.volume); setMuted(audio.muted); };
    onTime(); onDuration(); onVolume();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('volumechange', onVolume);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('volumechange', onVolume);
    };
  }, [audio]);

  const progress = duration > 0 ? Math.min(100, currentTime / duration * 100) : 0;
  const sliderStyle = (value: number) => ({ '--slider-fill': `${value}%` } as React.CSSProperties);
  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.muted || media.volume === 0) {
      media.muted = false;
      if (media.volume === 0) media.volume = previousVolume.current || 1;
    } else { previousVolume.current = media.volume; media.muted = true; }
  };

  return (
    <section className={`player-bar${isPlaying ? ' is-playing' : ''}`} aria-label="Reproductor de música">
      <div className="player-inner">
        <div className="player-info-row">
          <span className="player-artwork" aria-hidden="true"><Disc3 size={26} strokeWidth={1.3} /></span>
          <div className="player-track-info">
            <span className="player-status">{project ? (isPlaying ? 'SONANDO AHORA' : 'EN PAUSA') : 'NICOQ / REPRODUCTOR'}</span>
            <span className="player-track-name" title={project?.songName}>{project?.songName ?? 'Elegí tu próximo sonido'}</span>
            <span className="player-artist">{project?.artist ?? 'Presioná reproducir para empezar'}</span>
          </div>
        </div>
        <div className="player-center">
          <div className="player-transport">
            <button className="player-btn" onClick={onPrev} disabled={!hasTracks} aria-label="Tema anterior" title="Tema anterior"><SkipBack size={19} /></button>
            <button className="player-btn player-play" onClick={onPlayPause} disabled={!hasTracks} aria-label={isPlaying ? 'Pausar' : 'Reproducir'} title={isPlaying ? 'Pausar' : 'Reproducir'}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
            <button className="player-btn" onClick={onNext} disabled={!hasTracks} aria-label="Tema siguiente" title="Tema siguiente"><SkipForward size={19} /></button>
          </div>
          <div className="player-progress">
            <span className="player-time">{fmt(currentTime)}</span>
            <input type="range" className="player-slider" min={0} max={duration || 1} step={0.1} value={Math.min(currentTime, duration || 0)} style={sliderStyle(progress)} aria-label="Posición de reproducción" aria-valuetext={`${fmt(currentTime)} de ${fmt(duration)}`} onChange={e => { const t = Number(e.target.value); const media = mediaRef.current; if (media && duration > 0) { media.currentTime = t; setCurrentTime(t); } }} disabled={!project || duration <= 0} />
            <span className="player-time">{fmt(duration)}</span>
          </div>
        </div>
        <div className="player-volume">
          <button className="player-btn" onClick={toggleMute} disabled={!audio} aria-label={muted || volume === 0 ? 'Activar sonido' : 'Silenciar'} title={muted || volume === 0 ? 'Activar sonido' : 'Silenciar'}>{muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          <input type="range" className="player-slider player-volume-slider" min={0} max={1} step={0.01} value={muted ? 0 : volume} style={sliderStyle(muted ? 0 : volume * 100)} aria-label="Volumen" aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`} disabled={!audio} onChange={e => { const media = mediaRef.current; if (media) { media.muted = false; media.volume = Number(e.target.value); } }} />
        </div>
      </div>
      {error && <p className="player-error" role="alert">{error}</p>}
    </section>
  );
};

export default PlayerBar;
