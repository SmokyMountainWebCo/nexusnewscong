import Link from 'next/link';
import ClaimList from '@/components/ClaimList';
import DeskShell from '@/components/DeskShell';
import { bandFromSeverity, formatDeskDate, labelize, storyBadge, storyDateline } from '@/lib/content';
import { claimsForRoom } from '@/lib/desk';
import { loadClaims, loadLayers, loadStories } from '@/lib/published';

export default function SummaryPage() {
  const { stories } = loadStories();
  const claims = loadClaims();
  const layers = loadLayers();
  const lead = stories[0];
  const badge = lead ? storyBadge(lead.doc?.alertLevel || lead.card.alertLevel, lead.doc?.severity) : null;
  const bands = { green: 0, orange: 0, red: 0, unknown: 0 };
  for (const story of stories) {
    const band = storyBadge(story.doc?.alertLevel || story.card.alertLevel, story.doc?.severity ?? null).band;
    bands[band] += 1;
  }
  const layerBands = { green: 0, orange: 0, red: 0, unknown: 0 };
  for (const event of layers.disaster.events) layerBands[event.band] += 1;
  return (
    <DeskShell current="summary">
      <p className="nx-kicker">Live desk</p>
      <h2 className="nx-title">Global summary</h2>
      {!lead ? (
        <div className="nx-empty" role="status">
          <strong>No published brief yet</strong>
          When a story is added to the index, it will lead this page.
        </div>
      ) : (
        <article className="nx-lead">
          {badge ? <span className={`nx-badge nx-badge--${badge.band}`}>{badge.label}</span> : null}
          <p className="nx-meta">
            {labelize(lead.doc?.eventType || lead.card.eventType)}
            {' · '}
            {storyDateline(lead.doc, lead.card) || 'Date not provided'}
          </p>
          <h3>{lead.doc?.title || lead.card.title}</h3>
          <p>{lead.card.summary || lead.doc?.body.slice(0, 280) || 'No summary in the index.'}</p>
          <p><Link className="nx-text-btn" href={`/press/${lead.card.slug}`}>Read in the press room</Link></p>
        </article>
      )}
      <section className="nx-stats" aria-label="Desk counts">
        <h3>From the published files</h3>
        <ul>
          <li>{stories.length} published {stories.length === 1 ? 'story' : 'stories'}</li>
          <li>{bands.red} red · {bands.orange} orange · {bands.green} green{bands.unknown ? ` · ${bands.unknown} unrated` : ''}</li>
          <li>
            Disaster layer: {layers.disaster.events.length} events
            {layers.disaster.feedStatus === 'unavailable' ? ' · feed temporarily unavailable' : ''}
            {' · '}
            {layerBands.red} red, {layerBands.orange} orange, {layerBands.green} green
          </li>
          <li>
            Conflict layer: {layers.conflict.feedStatus === 'unavailable'
              ? 'feed temporarily unavailable'
              : layers.conflict.events.length === 0
                ? 'no current events'
                : `${layers.conflict.events.length} events`}
          </li>
        </ul>
      </section>
      {stories.length ? (
        <section className="nx-timeline" aria-label="Story timeline">
          <h3>Timeline</h3>
          <ol>
            {stories.map((story) => (
              <li key={story.card.slug}>
                <Link href={`/press/${story.card.slug}`}>{story.card.title}</Link>
                <span className="nx-meta">
                  {' '}
                  {storyDateline(story.doc, story.card) || formatDeskDate(story.card.timestamp) || ''}
                  {' · '}
                  {labelize(story.doc?.eventType || story.card.eventType)}
                  {story.doc?.severity != null ? ` · ${story.doc.severity}/10` : ''}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <ClaimList claims={claimsForRoom(claims, 'summary')} catalog={claims} title="Claims filed to the summary" />
    </DeskShell>
  );
}
