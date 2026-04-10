'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

// ── Types ────────────────────────────────────────────────────────

interface Project {
  id: number;
  artist: string;
  songName: string;
  year: string;
  image?: string;
  audioUrl?: string;
}

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
  onProjectHover?: (project: Project) => void;
  onProjectLeave?: () => void;
  onContainerLeave?: () => void;
  onIdleStart?: () => void;
}

// ── Time display ─────────────────────────────────────────────────

const TimeDisplay = ({ CONFIG = {} as Config }) => {
  const [time, setTime] = useState({ hours: '', minutes: '', dayPeriod: '' });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: CONFIG.timeZone,
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }).formatToParts(now);
      setTime({
        hours: parts.find((p) => p.type === 'hour')?.value || '',
        minutes: parts.find((p) => p.type === 'minute')?.value || '',
        dayPeriod: parts.find((p) => p.type === 'dayPeriod')?.value || '',
      });
    };
    update();
    const id = setInterval(update, CONFIG.timeUpdateInterval ?? 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time className="time-blink-wrap">
      {time.hours}<span className="time-blink">:</span>{time.minutes} {time.dayPeriod}
    </time>
  );
};

// ── Track row ────────────────────────────────────────────────────

interface TrackRowProps {
  project: Project;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onMouseEnter: (index: number, imageUrl: string) => void;
  onMouseLeave: () => void;
  onClick: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}

const TrackRow = React.forwardRef<HTMLLIElement, TrackRowProps>(
  ({ project, index, isActive, isPlaying, isDragging, isDragOver, onMouseEnter, onMouseLeave, onClick, onDragStart, onDragOver, onDrop, onDragEnd }, ref) => {
    const songRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      if (!songRef.current) return;
      if (isActive) {
        gsap.killTweensOf(songRef.current);
        gsap.to(songRef.current, {
          duration: 0.8,
          scrambleText: {
            text: project.songName,
            chars: 'qwerty1337h@ck3r',
            revealDelay: 0.3,
            speed: 0.4,
          },
        });
      } else {
        gsap.killTweensOf(songRef.current);
        songRef.current.textContent = project.songName;
      }
    }, [isActive, project.songName]);

    return (
      <li
        ref={ref}
        draggable
        className={`track-row${isActive ? ' active' : ''}${isDragOver ? ' drag-over' : ''}`}
        onMouseEnter={() => onMouseEnter(index, project.image ?? '')}
        onMouseLeave={onMouseLeave}
        onClick={() => project.audioUrl && onClick(index)}
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={() => onDrop(index)}
        onDragEnd={onDragEnd}
        style={{
          cursor: project.audioUrl ? 'pointer' : 'default',
          opacity: isDragging ? 0.3 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <span className="track-num">{isPlaying ? '▶' : String(index + 1).padStart(2, '0')}</span>
        <span className="track-artist track-col-artist">{project.artist}</span>
        <span className="track-name-wrap">
          <span ref={songRef} className="track-name-text">{project.songName}</span>
        </span>
        <span>
          <span className="label-tag">{project.year}</span>
        </span>
      </li>
    );
  }
);
TrackRow.displayName = 'TrackRow';

// ── Player bar ───────────────────────────────────────────────────

const fmt = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

interface PlayerBarProps {
  project: Project | null;
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  eqGains: { bass: number; mid: number; treble: number };
  onEqChange: (band: 'bass' | 'mid' | 'treble', value: number) => void;
}

const PlayerBar = ({ project, audio, isPlaying, onPlayPause, onNext, onPrev, eqGains, onEqChange }: PlayerBarProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if ('mediaSession' in navigator && audio.duration && !isNaN(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: Math.min(audio.currentTime, audio.duration),
          });
        } catch { /* ignore */ }
      }
    };
    const onDur  = () => setDuration(audio.duration);
    const onEnd  = () => { setCurrentTime(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDur);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDur);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audio]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const progressStyle = {
    background: `linear-gradient(to right,
      rgba(240,236,227,0.75) 0%,
      rgba(240,236,227,0.75) ${progress}%,
      rgba(240,236,227,0.12) ${progress}%,
      rgba(240,236,227,0.12) 100%)`,
  };

  const volumeStyle = {
    background: `linear-gradient(to right,
      rgba(240,236,227,0.75) 0%,
      rgba(240,236,227,0.75) ${volume * 100}%,
      rgba(240,236,227,0.12) ${volume * 100}%,
      rgba(240,236,227,0.12) 100%)`,
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audio) audio.currentTime = t;
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audio) audio.volume = v;
  };

  const trackName = project?.songName ?? '—';
  const artist    = project?.artist ?? '';

  const eqSliderStyle = (val: number) => {
    const pct = ((val + 12) / 24) * 100;
    return {
      background: `linear-gradient(to right,
        rgba(240,236,227,0.75) 0%,
        rgba(240,236,227,0.75) ${pct}%,
        rgba(240,236,227,0.12) ${pct}%,
        rgba(240,236,227,0.12) 100%)`,
    };
  };

  return (
    <div className="player-bar">
      {/* Row 1: info + time */}
      <div className="player-info-row">
        <span className="player-track-name">{trackName}</span>
        {artist && <><span className="player-sep">—</span><span className="player-artist">{artist}</span></>}
        <span className="player-spacer" />
        <span className="player-time">{fmt(currentTime)} / {fmt(duration)}</span>
      </div>

      {/* Row 2: controls + progress + volume */}
      <div className="player-controls-row">
        <button className="player-btn" onClick={onPrev} disabled={!project} aria-label="Previous track">
          &#9664;&#9664;
        </button>
        <button className="player-btn" onClick={onPlayPause} disabled={!project}>
          {isPlaying ? '■' : '▶'}
        </button>
        <button className="player-btn" onClick={onNext} disabled={!project} aria-label="Next track">
          &#9654;&#9654;
        </button>
        <div className="player-progress">
          <input
            type="range"
            className="player-slider"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            style={progressStyle}
            onChange={handleSeek}
            disabled={!project}
          />
        </div>
        <div className="player-volume">
          <span>vol</span>
          <input
            type="range"
            className="player-slider player-volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            style={volumeStyle}
            onChange={handleVolume}
          />
        </div>
      </div>

      {/* Row 3: EQ */}
      <div className="player-eq-row">
        {(['bass', 'mid', 'treble'] as const).map((band) => (
          <div key={band} className="player-eq-band">
            <span className="player-eq-label">{band}</span>
            <input
              type="range"
              className="player-slider player-eq-slider"
              min={-12}
              max={12}
              step={0.5}
              value={eqGains[band]}
              style={eqSliderStyle(eqGains[band])}
              onChange={(e) => onEqChange(band, parseFloat(e.target.value))}
            />
            <span className="player-eq-val">{eqGains[band] > 0 ? '+' : ''}{eqGains[band]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────

interface MusicPortfolioProps {
  PROJECTS_DATA?: Project[];
  LOCATION?: Location;
  CALLBACKS?: Callbacks;
  CONFIG?: Config;
  SOCIAL_LINKS?: SocialLinks;
}

const MusicPortfolio = ({
  PROJECTS_DATA = [],
  LOCATION = {},
  CALLBACKS = {},
  CONFIG = {},
  SOCIAL_LINKS = {},
}: MusicPortfolioProps) => {
  const [tracks, setTracks] = useState<Project[]>(PROJECTS_DATA);
  const [activeIndex,    setActiveIndex]    = useState(-1);
  const [playingIndex,   setPlayingIndex]   = useState(-1);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
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
  const tracksRef       = useRef<Project[]>(PROJECTS_DATA);

  // EQ
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const bassRef        = useRef<BiquadFilterNode | null>(null);
  const midRef         = useRef<BiquadFilterNode | null>(null);
  const trebleRef      = useRef<BiquadFilterNode | null>(null);
  const [eqGains, setEqGains] = useState({ bass: 0, mid: 0, treble: 0 });

  const initEQ = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();

    // Keep AudioContext alive in background with a looping silent buffer
    const silentBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const silentSrc = ctx.createBufferSource();
    silentSrc.buffer = silentBuf;
    silentSrc.loop = true;
    silentSrc.connect(ctx.destination);
    silentSrc.start();

    // Auto-resume if the OS suspends the context
    ctx.onstatechange = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    };

    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 250;
    bass.gain.value = 0;

    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = 0;

    const treble = ctx.createBiquadFilter();
    treble.type = 'highshelf';
    treble.frequency.value = 4000;
    treble.gain.value = 0;

    bass.connect(mid);
    mid.connect(treble);
    treble.connect(ctx.destination);

    audioCtxRef.current = ctx;
    bassRef.current = bass;
    midRef.current = mid;
    trebleRef.current = treble;
  }, []);

  const handleEqChange = useCallback((band: 'bass' | 'mid' | 'treble', value: number) => {
    setEqGains(prev => ({ ...prev, [band]: value }));
    const map = { bass: bassRef, mid: midRef, treble: trebleRef };
    if (map[band].current) map[band].current!.gain.value = value;
  }, []);

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
      const ordered = order.map(id => byId.get(id)).filter(Boolean) as Project[];
      // Append any new tracks not in saved order
      for (const t of PROJECTS_DATA) {
        if (!order.includes(t.id)) ordered.push(t);
      }
      if (ordered.length > 0) setTracks(ordered);
    } catch { /* ignore */ }
  }, []);

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
      localStorage.setItem('nicoq-track-order', JSON.stringify(updated.map(t => t.id)));
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
    if (idleAnimRef.current) return;
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
  }, [activeIndex, startIdle, CONFIG.idleDelay]);

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
  const updateMediaSession = useCallback((project: Project) => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: project.songName,
      artist: project.artist,
      artwork: project.image
        ? [{ src: project.image, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
  }, []);

  // ── Audio playback (defined before bindMediaSessionActions so it can reference it)
  const handleTrackClickInner = useCallback((index: number) => {
    const list = tracksRef.current;
    const project = list[index];
    if (!project?.audioUrl) return;

    audioRef.current?.pause();
    initEQ();

    const audio = new Audio(project.audioUrl);
    audioRef.current = audio;
    setCurrentAudio(audio);

    // Connect through EQ chain
    if (audioCtxRef.current && bassRef.current) {
      audioCtxRef.current.resume();
      const source = audioCtxRef.current.createMediaElementSource(audio);
      source.connect(bassRef.current);
    }

    audio.play();
    setPlayingIndex(index);
    playingIndexRef.current = index;
    setIsAudioPlaying(true);
    updateMediaSession(project);
    audio.addEventListener('ended', () => {
      setPlayingIndex(-1);
      playingIndexRef.current = -1;
      setIsAudioPlaying(false);
    });
  }, [updateMediaSession, initEQ]);

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
      audioRef.current?.play();
      setIsAudioPlaying(true);
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

  // ── Resume AudioContext when page becomes visible again (fix background audio)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleTrackClick = useCallback((index: number) => {
    const list = tracksRef.current;
    const project = list[index];
    if (!project?.audioUrl) return;

    if (playingIndexRef.current === index) {
      if (audioRef.current?.paused) {
        audioRef.current.play(); setIsAudioPlaying(true);
      } else {
        audioRef.current?.pause(); setIsAudioPlaying(false);
      }
      return;
    }

    handleTrackClickInner(index);
  }, [handleTrackClickInner]);

  const handlePlayerPlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play(); setIsAudioPlaying(true);
    } else {
      audioRef.current.pause(); setIsAudioPlaying(false);
    }
  }, []);

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
                isPlaying={playingIndex === index}
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
        isPlaying={isAudioPlaying}
        onPlayPause={handlePlayerPlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        eqGains={eqGains}
        onEqChange={handleEqChange}
      />
    </div>
  );
};

export default MusicPortfolio;
