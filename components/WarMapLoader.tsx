'use client';

import dynamic from 'next/dynamic';

const WarMap = dynamic(() => import('./WarMap'), {
  ssr: false,
  loading: () => <div className="nx-map-fallback" role="status">Loading map…</div>,
});

export default function WarMapLoader() {
  return <WarMap />;
}
