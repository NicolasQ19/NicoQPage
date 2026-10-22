'use client';

import { useEffect, useState } from 'react';

interface Config { timeZone?: string; timeUpdateInterval?: number }

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
  }, [CONFIG.timeZone, CONFIG.timeUpdateInterval]);

  return (
    <time className="time-blink-wrap">
      {time.hours}<span className="time-blink">:</span>{time.minutes} {time.dayPeriod}
    </time>
  );
};

export default TimeDisplay;
