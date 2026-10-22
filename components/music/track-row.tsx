'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Disc3 } from 'lucide-react';
import type { Track } from '@/types/track';

gsap.registerPlugin(ScrambleTextPlugin);

interface TrackRowProps {
  project: Track;
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
        tabIndex={project.audioUrl ? 0 : undefined}
        aria-label={`${project.songName}, ${project.artist}, ${project.year}`}
        onKeyDown={e => { if (project.audioUrl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(index); } }}
        className={`track-row${isPlaying ? ' playing' : ''}${isActive ? ' active' : ''}${isDragOver ? ' drag-over' : ''}`}
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
        <span className="track-num">{isPlaying ? <span className="track-playing-icon" aria-label="Tema seleccionado"><Disc3 size={15} /></span> : String(index + 1).padStart(2, '0')}</span>
        <span className="track-artist track-col-artist">{project.artist}</span>
        <span className="track-name-wrap" title={project.songName}>
          <span ref={songRef} className="track-name-text">{project.songName}</span>
        </span>
        <span className="track-year">
          <span className="label-tag">{project.year}</span>
        </span>
      </li>
    );
  }
);
TrackRow.displayName = 'TrackRow';

export default TrackRow;
