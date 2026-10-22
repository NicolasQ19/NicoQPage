'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import type { Track } from '@/types/track';
import PlayerBar from './player-bar';
import TrackRow from './track-row';
import TimeDisplay from './time-display';
import './music.css';



// ── Types ────────────────────────────────────────────────────────


interface Config {
  timeZone?: string;
  timeUpdateInterval?: number;
  idleDelay?: number;
}

interface SocialLinks {
  spotify?: string;
  instagram?: string;
  soundcloud?: string;
}

interface Location {
  latitude?: string;
  longitude?: string;
  display?: boolean;
}

interface Callbacks {
  onProjectHover?: (project: Track) => void;
  onProjectLeave?: () => void;
  onContainerLeave?: () => void;
  onIdleStart?: () => void;
}

// ── Time display ─────────────────────────────────────────────────

// ── Track row ────────────────────────────────────────────────────

// ── Player bar ───────────────────────────────────────────────────

// ── Main component ───────────────────────────────────────────────

interface MusicPortfolioProps {
  PROJECTS_DATA?: Track[];
  LOCATION?: Location;
  CALLBACKS?: Callbacks;
  CONFIG?: Config;
  SOCIAL_LINKS?: SocialLinks;
}

const EMPTY_CALLBACKS: Callbacks = {};

const MusicPortfolio = ({
  PROJECTS_DATA = [],
  LOCATION = {},
  CALLBACKS = EMPTY_CALLBACKS,
  CONFIG = {},
  SOCIAL_LINKS = {},
}: MusicPortfolioProps) => {
  const [tracks, setTracks] = useState<Track[]>(PROJECTS_DATA);
  const [activeIndex,    setActiveIndex]    = useState(-1);
  const [playingIndex,   setPlayingIndex]   = useState(-1);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentAudio,   setCurrentAudio]   = useState<HTMLAudioElement | null>(null);
  const [dragIdx, setDragIdx]   = useState<number | null>(null);
  const [overIdx, setOverIdx]   = useState<number | null>(null);

  const bgRef          = useRef<HTMLDivElement>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const trackItemsRef  = useRef<(HTMLLIElement | null)[]>([]);
  const idleTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleAnimRef    = useRef<gsap.core.Timeline | null>(null);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs that mirror state — used inside MediaSession handlers to avoid stale closures
  const playingIndexRef = useRef(-1);
  const tracksRef       = useRef<Track[]>(PROJECTS_DATA);

  // Keep refs in sync with state
  useEffect(() => { playingIndexRef.current = playingIndex; }, [playingIndex]);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);

  // Restore saved order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nicoq-track-order');
      if (!saved) return;
      const order: number[] = JSON.parse(saved);
      const byId = new Map(PROJECTS_DATA.map(t => [t.id, t]));
      const ordered = order.map(id => byId.get(id)).filter(Boolean) as Track[];
      // Append any new tracks not in saved order
      for (const t of PROJECTS_DATA) {
        if (!order.includes(t.id)) ordered.push(t);
      }
      if (ordered.length > 0) {
        const frame = requestAnimationFrame(() => setTracks(ordered));
        return () => cancelAnimationFrame(frame);
      }
    } catch { /* ignore */ }
  }, [PROJECTS_DATA]);

  // Drag handlers
  const handleDragStart = useCallback((idx: number) => setDragIdx(idx), []);
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  }, []);
  const handleDrop = useCallback((idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    setTracks(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIdx, 1);
      updated.splice(idx, 0, moved);
      const playingId = prev[playingIndexRef.current]?.id;
      if (playingId !== undefined) {
        const nextIndex = updated.findIndex(t => t.id === playingId);
        playingIndexRef.current = nextIndex;
        setPlayingIndex(nextIndex);
      }
      try { localStorage.setItem('nicoq-track-order', JSON.stringify(updated.map(t => t.id))); } catch { /* Storage may be unavailable. */ }
      return updated;
    });
    setDragIdx(null);
    setOverIdx(null);
  }, [dragIdx]);
  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  // Preload images
  useEffect(() => {
    tracks.forEach((p) => {
      if (p.image) { const img = new Image(); img.src = p.image; }
    });
  }, [tracks]);

  // Cleanup on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // ── Idle animation
  const startIdle = useCallback(() => {
    if (idleAnimRef.current || window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    trackItemsRef.current.forEach((el, i) => {
      if (!el) return;
      const hide = i * 0.05;
      const show = tracks.length * 0.025 + i * 0.05;
      tl.to(el, { opacity: 0.05, duration: 0.1, ease: 'power2.inOut' }, hide);
      tl.to(el, { opacity: 1,    duration: 0.1, ease: 'power2.inOut' }, show);
    });
    idleAnimRef.current = tl;
  }, [tracks.length]);

  const stopIdle = useCallback(() => {
    if (!idleAnimRef.current) return;
    idleAnimRef.current.kill();
    idleAnimRef.current = null;
    trackItemsRef.current.forEach((el) => { if (el) gsap.set(el, { opacity: 1 }); });
  }, []);

  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (activeIndex === -1) { startIdle(); CALLBACKS.onIdleStart?.(); }
    }, CONFIG.idleDelay ?? 4000);
  }, [activeIndex, startIdle, CONFIG.idleDelay, CALLBACKS]);

  const stopIdleTimer = useCallback(() => {
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
  }, []);

  useEffect(() => {
    startIdleTimer();
    return () => { stopIdleTimer(); stopIdle(); };
  }, [startIdleTimer, stopIdleTimer, stopIdle]);

  // ── Background image
  const showBg = useCallback((imageUrl: string) => {
    const bg = bgRef.current;
    if (!bg) return;
    bg.style.backgroundImage = `url(${imageUrl})`;
    bg.classList.add('visible');
  }, []);

  const hideBg = useCallback(() => {
    bgRef.current?.classList.remove('visible');
  }, []);

  // ── Hover handlers
  const handleEnter = useCallback((index: number, imageUrl: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    stopIdle(); stopIdleTimer();
    setActiveIndex(index);
    CALLBACKS.onProjectHover?.(tracks[index]);
    if (imageUrl) showBg(imageUrl);
  }, [stopIdle, stopIdleTimer, CALLBACKS, tracks, showBg]);

  const handleLeave = useCallback(() => {
    debounceRef.current = setTimeout(() => {
      CALLBACKS.onProjectLeave?.();
    }, 50);
  }, [CALLBACKS]);

  const handleContainerLeave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setActiveIndex(-1);
    hideBg();
    CALLBACKS.onContainerLeave?.();
    startIdleTimer();
  }, [hideBg, startIdleTimer, CALLBACKS]);

  // ── Media Session (lock-screen controls & background playback)
  const updateMediaSession = useCallback((project: Track) => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: project.songName,
      artist: project.artist,
      artwork: project.image
        ? [{ src: project.image, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
  }, []);

  // ── Audio playback
  const handleTrackClickInner = useCallback((index: number) => {
    const list = tracksRef.current;
    const project = list[index];
    if (!project?.audioUrl) return;

    setPlaybackError(null);
    const previousAudio = audioRef.current;
    previousAudio?.pause();

    const audio = new Audio(project.audioUrl);
    audio.volume = previousAudio?.volume ?? 1;
    audio.muted = previousAudio?.muted ?? false;
    audioRef.current = audio;
    setCurrentAudio(audio);

    audio.addEventListener('play', () => { if (audioRef.current === audio) setIsAudioPlaying(true); });
    audio.addEventListener('pause', () => { if (audioRef.current === audio) setIsAudioPlaying(false); });
    const onError = () => {
      if (audioRef.current !== audio) return;
      setIsAudioPlaying(false);
      setPlaybackError('No se pudo reproducir el audio. Intentá nuevamente o elegí otro tema.');
    };
    audio.addEventListener('error', onError);
    audio.play().catch(onError);
    setPlayingIndex(index);
    playingIndexRef.current = index;
    updateMediaSession(project);
    audio.addEventListener('ended', () => {
      if (audioRef.current === audio) setIsAudioPlaying(false);
    });
  }, [updateMediaSession]);

  // ── Circular next / prev helpers (always use refs for fresh values)
  const findNext = useCallback((from: number) => {
    const list = tracksRef.current;
    for (let i = 1; i <= list.length; i++) {
      const idx = (from + i) % list.length;
      if (list[idx]?.audioUrl) return idx;
    }
    return -1;
  }, []);

  const findPrev = useCallback((from: number) => {
    const list = tracksRef.current;
    for (let i = 1; i <= list.length; i++) {
      const idx = (from - i + list.length) % list.length;
      if (list[idx]?.audioUrl) return idx;
    }
    return -1;
  }, []);

  const handleNext = useCallback(() => {
    const idx = findNext(playingIndexRef.current);
    if (idx !== -1) handleTrackClickInner(idx);
  }, [findNext, handleTrackClickInner]);

  const handlePrev = useCallback(() => {
    const idx = findPrev(playingIndexRef.current);
    if (idx !== -1) handleTrackClickInner(idx);
  }, [findPrev, handleTrackClickInner]);

  // ── Bind MediaSession actions once on mount (uses refs → always fresh)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play().catch(() => setIsAudioPlaying(false));
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsAudioPlaying(false);
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const idx = findPrev(playingIndexRef.current);
      if (idx !== -1) handleTrackClickInner(idx);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const idx = findNext(playingIndexRef.current);
      if (idx !== -1) handleTrackClickInner(idx);
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - (details.seekOffset ?? 10));
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + (details.seekOffset ?? 10));
      }
    });
  }, [findNext, findPrev, handleTrackClickInner]);

  const handleTrackClick = useCallback((index: number) => {
    const list = tracksRef.current;
    const project = list[index];
    if (!project?.audioUrl) return;

    if (playingIndexRef.current === index) {
      if (audioRef.current?.paused) {
        audioRef.current.play().catch(() => setIsAudioPlaying(false));
      } else {
        audioRef.current?.pause(); setIsAudioPlaying(false);
      }
      return;
    }

    handleTrackClickInner(index);
  }, [handleTrackClickInner]);

  const handlePlayerPlayPause = useCallback(() => {
    if (!audioRef.current) {
      const first = tracksRef.current.findIndex(track => !!track.audioUrl);
      if (first !== -1) handleTrackClickInner(first);
      return;
    }
    setPlaybackError(null);
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => setIsAudioPlaying(false));
    } else {
      audioRef.current.pause(); setIsAudioPlaying(false);
    }
  }, [handleTrackClickInner]);

  return (
    <div className="portfolio-root">
      {/* Grain */}
      <svg className="grain-overlay" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <filter id="grain-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-noise)" />
      </svg>

      {/* Background */}
      <div ref={bgRef} className="bg-image" aria-hidden="true" />
      <div className="bg-overlay" aria-hidden="true" />

      {/* Header */}
      <header className="port-header">
        <div className="corner-square" aria-hidden="true" />
        <nav className="port-nav" aria-label="Social links">
          {LOCATION.display && LOCATION.latitude && (
            <>
              <span>{LOCATION.latitude}</span>
              <span className="port-nav-sep">|</span>
            </>
          )}
          <TimeDisplay CONFIG={CONFIG} />
          <span className="port-nav-sep">|</span>
          <a href={SOCIAL_LINKS.spotify ?? '#'} target="_blank" rel="noopener noreferrer">Spotify</a>
          <span className="port-nav-sep">|</span>
          <a href={SOCIAL_LINKS.instagram ?? '#'} target="_blank" rel="noopener noreferrer">Instagram</a>
          <span className="port-nav-sep">|</span>
          <a href={SOCIAL_LINKS.soundcloud ?? '#'} target="_blank" rel="noopener noreferrer">SoundCloud</a>
        </nav>
      </header>

      {/* Track list */}
      <main className="tracks-section" onMouseLeave={handleContainerLeave}>
        <h1 className="sr-only">Music Portfolio</h1>
        <div className="tracks-inner">
          {/* Column headers */}
          <div className="track-header" aria-hidden="true">
            <span>#</span>
            <span className="track-col-artist">Artist</span>
            <span>Song Name</span>
            <span>Year</span>
          </div>

          <ul
            className={`tracks-list${activeIndex !== -1 ? ' has-active' : ''}`}
            role="list"
          >
            {tracks.map((project, index) => (
              <TrackRow
                key={project.id}
                ref={(el) => { trackItemsRef.current[index] = el; }}
                project={project}
                index={index}
                isActive={activeIndex === index}
                isPlaying={playingIndex === index && isAudioPlaying}
                isDragging={dragIdx === index}
                isDragOver={overIdx === index}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onClick={handleTrackClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            ))}
          </ul>
        </div>
      </main>

      {/* Player — always visible */}
      <PlayerBar
        project={playingIndex >= 0 ? tracks[playingIndex] : null}
        audio={currentAudio}
        hasTracks={tracks.some(track => !!track.audioUrl)}
        error={playbackError}
        isPlaying={isAudioPlaying}
        onPlayPause={handlePlayerPlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  );
};

export default MusicPortfolio;
