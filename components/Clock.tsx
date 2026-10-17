'use client';

import { useEffect, useState } from 'react';
import { formatDeskClock } from '@/lib/content';

export default function Clock() {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => setLabel(formatDeskClock(new Date()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time className="nx-clock" suppressHydrationWarning>
      <span className="nx-live" aria-hidden="true" />
      {label || '—'}
    </time>
  );
}
