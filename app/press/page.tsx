import Link from 'next/link';
import ClaimList from '@/components/ClaimList';
import StoryVisual from '@/components/StoryVisual';
import { formatDeskDate, labelize, storyBadge, storyDateline, updatedLabel } from '@/lib/content';
import { resolveStoryImage } from '@/lib/images';
import { claimsForRoom } from '@/lib/desk';
import { loadClaims, loadStories } from '@/lib/published';

export default function PressPage() {
  const { generatedAt, stories } = loadStories();
  const claims = loadClaims();
  return (
    <section className="room">
      <p className="kicker">Press room</p>
      <h2>Published stories</h2>
      <p>{generatedAt ? `Index updated ${formatDeskDate(generatedAt) || generatedAt}. ` : ''}A story with a status other than published stays off this desk.</p>
      {stories.length === 0 ? (
        <div className="empty" role="status">
          <strong>No stories published yet</strong>
          <p>An empty index is a quiet desk, not an error.</p>
        </div>
      ) : null}
      <ul className="stories">
        {stories.map((story) => {
          const badge = storyBadge(story.doc?.alertLevel || story.card.alertLevel, story.doc?.severity);
          const when = storyDateline(story.doc, story.card);
          const updated = updatedLabel(story.doc?.updated || story.card.updated);
          const image = resolveStoryImage(story.doc, story.card);
          return (
            <li key={story.card.slug}>
              <Link href={`/press/${story.card.slug}`}>
                <StoryVisual
                  image={image}
                  slug={story.card.slug}
                  eventType={story.doc?.eventType || story.card.eventType}
                  verdictType={null}
                  title={story.card.title}
                  variant="thumb"
                />
                <div>
                  {badge ? <span className={`badge badge--${badge.band}`}>{badge.label}</span> : null}
                  <h3>{story.card.title}</h3>
                  <p>
                    {labelize(story.doc?.eventType || story.card.eventType)}
                    {when ? ` · ${when}` : ''}
                  </p>
                  {updated ? <p>{updated}</p> : null}
                  {story.card.summary ? <p>{story.card.summary}</p> : null}
                  {story.missing ? <p>The story file is missing.</p> : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <ClaimList claims={claimsForRoom(claims, 'press')} catalog={claims} title="Claims filed to the press room" />
    </section>
  );
}
