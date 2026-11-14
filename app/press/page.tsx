import Link from 'next/link';
import ClaimList from '@/components/ClaimList';
import { formatDeskDate, labelize, storyBadge, storyDateline, updatedLabel } from '@/lib/content';
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
      {stories.length === 0 ? <p>No stories published yet.</p> : null}
      <ul className="stories">
        {stories.map((story) => {
          const badge = storyBadge(story.doc?.alertLevel || story.card.alertLevel, story.doc?.severity);
          const when = storyDateline(story.doc, story.card);
          const updated = updatedLabel(story.doc?.updated || story.card.updated);
          return (
            <li key={story.card.slug}>
              <Link href={`/press/${story.card.slug}`}>
                <span className={`badge badge--${badge.band}`}>{badge.label}</span>
                <h3>{story.card.title}</h3>
                <p>
                  {labelize(story.doc?.eventType || story.card.eventType)}
                  {when ? ` · ${when}` : ''}
                </p>
                {updated ? <p>{updated}</p> : null}
                {story.card.summary ? <p>{story.card.summary}</p> : null}
                {story.missing ? <p>The story file is missing.</p> : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <ClaimList claims={claimsForRoom(claims, 'press')} catalog={claims} title="Claims filed to the press room" />
    </section>
  );
}
