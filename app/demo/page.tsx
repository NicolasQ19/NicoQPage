'use client';

import MusicPortfolio from '@/components/ui/music-portfolio';

export default function DemoOne() {
  const projectsData = [
    {
      id: 1,
      artist: 'NicoQ',
      songName: 'LONELY BOY',
      year: '2024',
      image:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
    },
    {
      id: 2,
      artist: 'NicoQ',
      songName: 'IN YOUR MEMORY',
      year: '2024',
      image:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80',
    },
    {
      id: 3,
      artist: 'NicoQ',
      songName: 'WHO AM I?',
      year: '2023',
      image:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80',
    },
    {
      id: 4,
      artist: 'NicoQ',
      songName: 'SINGLE MOM',
      year: '2023',
      image:
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
    },
    {
      id: 5,
      artist: 'NicoQ',
      songName: 'GHOST',
      year: '2023',
      image:
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&q=80',
    },
    {
      id: 6,
      artist: 'NicoQ',
      songName: 'DIFFICULTY',
      year: '2022',
      image:
        'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1200&q=80',
    },
  ];

  const config = {
    timeZone: 'America/New_York',
    timeUpdateInterval: 1000,
    idleDelay: 4000,
    debounceDelay: 100,
  };

  const socialLinks = {
    spotify: 'https://open.spotify.com',
    email: 'mailto:hi@example.com',
    x: 'https://x.com',
  };

  const location = {
    latitude: '40.7128° N',
    longitude: '74.0060° W',
    display: true,
  };

  const callbacks = {
    onProjectHover: (project: { artist: string }) =>
      console.log('Hovering:', project),
    onProjectLeave: () => console.log('Left project'),
    onContainerLeave: () => console.log('Left container'),
    onIdleStart: () => console.log('Idle animation started'),
    onThemeChange: (theme: string) => console.log(`Theme changed to: ${theme}`),
  };

  return (
    <MusicPortfolio
      PROJECTS_DATA={projectsData}
      CONFIG={config}
      SOCIAL_LINKS={socialLinks}
      LOCATION={location}
      CALLBACKS={callbacks}
    />
  );
}
