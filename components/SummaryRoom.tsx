import Link from 'next/link';
import ClaimList from './ClaimList';
import StoryVisual from './StoryVisual';
import { labelize, storyBadge, storyDateline } from '@/lib/content';
import { resolveStoryImage } from '@/lib/images';
import { claimsForRoom } from '@/lib/desk';
import { loadClaims, loadStories } from '@/lib/published';

export default function SummaryRoom() {
  const { stories } = loadStories();
  const claims = loadClaims();
  const lead = stories[0];
  const badge = lead ? storyBadge(lead.doc?.alertLevel || lead.card.alertLevel, lead.doc?.severity) : null;
  const bands = { green: 0, orange: 0, red: 0, unknown: 0 };
  for (const story of stories) {
    const counted = storyBadge(story.doc?.alertLevel || story.card.alertLevel, story.doc?.severity ?? null);
    bands[counted?.band ?? 'unknown'] += 1;
  }
  return (
    <section className="room">
      <p className="kicker">Summary</p>
      <h2>Live global summary</h2>
      {!lead ? (
        <div className="empty" role="status">
          <strong>No published brief yet</strong>
          <p>When a story is added to the index, it will lead this page.</p>
        </div>
      ) : (
        <article className="lead">
          <StoryVisual
            image={resolveStoryImage(lead.doc, lead.card)}
            slug={lead.card.slug}
            eventType={lead.doc?.eventType || lead.card.eventType}
            verdictType={null}
            title={lead.doc?.title || lead.card.title}
            variant="hero"
          />
          <div>
            {badge ? <p className={`badge badge--${badge.band}`}>{badge.label}</p> : null}
            <p className="story__dateline">
              {labelize(lead.doc?.eventType || lead.card.eventType)}
              {' · '}
              {storyDateline(lead.doc, lead.card) || 'Date not provided'}
            </p>
            <h3>{lead.doc?.title || lead.card.title}</h3>
            <p>{lead.card.summary || 'No summary in the index.'}</p>
            <p>
              <Link href={`/press/${lead.card.slug}`}>Read in the press room</Link>
            </p>
          </div>
        </article>
      )}
      <section>
        <h3>From the published files</h3>
        <ul>
          <li>
            {stories.length} published {stories.length === 1 ? 'story' : 'stories'}
          </li>
          <li>
            {bands.red} red · {bands.orange} orange · {bands.green} green
            {bands.unknown ? ` · ${bands.unknown} unrated` : ''}
          </li>
        </ul>
      </section>
      {stories.length ? (
        <section>
          <h3>Timeline</h3>
          <ol className="stories timeline">
            {stories.map((story) => (
              <li key={story.card.slug}>
                <Link href={`/press/${story.card.slug}`}>
                  <StoryVisual
                    image={resolveStoryImage(story.doc, story.card)}
                    slug={story.card.slug}
                    eventType={story.doc?.eventType || story.card.eventType}
                    verdictType={null}
                    title={story.card.title}
                    variant="thumb"
                  />
                  <div>
                    <h3>{story.card.title}</h3>
                    <p>
                      {storyDateline(story.doc, story.card) || 'Date not provided'}
                      {' · '}
                      {labelize(story.doc?.eventType || story.card.eventType)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <ClaimList claims={claimsForRoom(claims, 'summary')} catalog={claims} title="Claims filed to the summary" />
    </section>
  );
}
