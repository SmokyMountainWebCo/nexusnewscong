'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { parseStoryIndex, type StoryCard } from '@/lib/stories';

export function useStories(): StoryCard[] {
  const [stories, setStories] = useState<StoryCard[]>([]);
  useEffect(() => {
    fetch('/stories/index.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setStories(parseStoryIndex(data)))
      .catch(() => setStories([]));
  }, []);
  return stories;
}

export default function StoryBrowser() {
  const stories = useStories();
  return (
    <section>
      <p className="kicker">Press room</p>
      <h2>Raw feeds</h2>
      {stories.length === 0 ? <p>No published stories are in the index.</p> : null}
      <ul className="stories">
        {stories.map((story) => (
          <li key={story.slug}>
            <Link href={`/press/${story.slug}`}>
              <h3>{story.title}</h3>
              <p>{story.location || story.eventType || 'Story'}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
