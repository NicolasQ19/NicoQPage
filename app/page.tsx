'use client';

import MusicPortfolio from '@/components/ui/music-portfolio';
import tracksData from '@/tracks.json';

export default function Home() {
  const projectsData = tracksData;

  const config = {
    timeUpdateInterval: 1000,
    idleDelay: 4000,
    debounceDelay: 100,
  };

  const socialLinks = {
    spotify: 'https://open.spotify.com/user/31fnupv2wzoqfgbdpw3gin6mk7da?si=xAWXR_CxSkGM59yRvd8TMA',
    instagram: 'https://www.instagram.com/_nico_quintana_?igsh=bzdjeG04bGt4dDFj&utm_source=qr',
    soundcloud: 'https://soundcloud.com/matias-nicolas-302245090',
  };

  const location = {
    display: false,
  };

  return (
    <MusicPortfolio
      PROJECTS_DATA={projectsData}
      CONFIG={config}
      SOCIAL_LINKS={socialLinks}
      LOCATION={location}
    />
  );
}
