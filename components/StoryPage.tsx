'use client';

import Link from 'next/link';
import GlobePanel from './GlobePanel';
import { useStories } from './StoryBrowser';

export default function StoryPage({ slug }: { slug: string }) {
  const stories = useStories();
  const story = stories.find((item) => item.slug === slug);
  if (stories.length && !story) {
    return (
      <section>
        <h2>This story is not in the index</h2>
        <p>
          <Link href="/press">Press room</Link>
        </p>
      </section>
    );
  }
  return (
    <section>
      <p>
        <Link href="/press">Press room</Link>
      </p>
      <h2>{story?.title || 'Story'}</h2>
      {story?.alertLevel ? <p className="kicker">{story.alertLevel}</p> : null}
      {story?.location ? <p>{story.location}</p> : null}
      {story?.summary ? <p>{story.summary}</p> : null}
      {story ? (
        <p>
          <a href={story.path}>Source file</a>
          {' · '}
          <Link href={`/war-room?story=${story.slug}`}>Open in the war room</Link>
        </p>
      ) : null}
      <GlobePanel storySlug={slug} />
    </section>
  );
}
