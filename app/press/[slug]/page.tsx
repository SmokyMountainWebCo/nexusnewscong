'use client';

import { useParams } from 'next/navigation';
import StoryPage from '@/components/StoryPage';

export default function PressStoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  return (
    <section className="room">
      <StoryPage slug={slug || ''} />
    </section>
  );
}
