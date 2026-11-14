import Link from 'next/link';
import ClaimList from './ClaimList';
import { labelize, storyBadge, storyDateline } from '@/lib/content';
import { claimsForRoom } from '@/lib/desk';
import { loadClaims, loadStories } from '@/lib/published';

export default function SummaryRoom() {
  const { stories } = loadStories();
  const claims = loadClaims();
  const lead = stories[0];
  const badge = lead ? storyBadge(lead.doc?.alertLevel || lead.card.alertLevel, lead.doc?.severity) : null;
  const bands = { green: 0, orange: 0, red: 0, unknown: 0 };
  for (const story of stories) {
    bands[storyBadge(story.doc?.alertLevel || story.card.alertLevel, story.doc?.severity ?? null).band] += 1;
  }
  return (
    <section className="room">
      <p className="kicker">Summary</p>
      <h2>Live global summary</h2>
      {!lead ? (
        <p>When a story is added to the index, it will lead this page.</p>
      ) : (
        <article className="lead">
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
          <ol className="timeline">
            {stories.map((story) => (
              <li key={story.card.slug}>
                <Link href={`/press/${story.card.slug}`}>{story.card.title}</Link>
                <span>
                  {' '}
                  {storyDateline(story.doc, story.card) || ''}
                  {' · '}
                  {labelize(story.doc?.eventType || story.card.eventType)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <ClaimList claims={claimsForRoom(claims, 'summary')} catalog={claims} title="Claims filed to the summary" />
    </section>
  );
}
