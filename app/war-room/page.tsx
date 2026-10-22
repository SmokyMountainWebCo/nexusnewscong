'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GlobePanel from '@/components/GlobePanel';

function WarRoom() {
  const story = useSearchParams().get('story');
  return (
    <section className="room">
      <p className="kicker">War room</p>
      <h2>Real-time threat intelligence</h2>
      <GlobePanel storySlug={story} />
    </section>
  );
}

export default function WarRoomPage() {
  return (
    <Suspense fallback={<p>Loading the war room.</p>}>
      <WarRoom />
    </Suspense>
  );
}
