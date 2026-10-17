'use client';

import dynamic from 'next/dynamic';
import type { MarketQuote } from '@/lib/desk';

const MarketsMap = dynamic(() => import('./MarketsMap'), { ssr: false });

export default function MarketsMapLoader({ quotes }: { quotes: MarketQuote[] }) {
  if (!quotes.length) return null;
  return <MarketsMap quotes={quotes} />;
}
