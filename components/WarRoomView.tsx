'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GlobePanel from './GlobePanel';

function Globe() {
  const story = useSearchParams().get('story');
  return <GlobePanel storySlug={story} />;
}

export default function WarRoomView() {
  return (
    <Suspense fallback={<p>Loading the war room.</p>}>
      <Globe />
    </Suspense>
  );
}
