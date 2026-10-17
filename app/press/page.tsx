import Link from 'next/link';
import ClaimList from '@/components/ClaimList';
import DeskShell from '@/components/DeskShell';
import { formatDeskDate, labelize, storyBadge, storyDateline, updatedLabel } from '@/lib/content';
import { claimsForRoom } from '@/lib/desk';
import { loadClaims, loadStories } from '@/lib/published';

export default function PressPage() {
  const { generatedAt, stories } = loadStories();
  const claims = loadClaims();
  return (
    <DeskShell current="press">
      <p className="nx-kicker">Press room</p>
      <h2 className="nx-title">Published stories</h2>
      <p className="nx-deck">
        {generatedAt ? `Index updated ${formatDeskDate(generatedAt) || generatedAt}. ` : ''}
        Each story has its own page. A story with a status other than published stays off this desk.
      </p>
      {stories.length === 0 ? (
        <div className="nx-empty" role="status">
          <strong>No stories published yet</strong>
          An empty index is a quiet desk, not an error.
        </div>
      ) : (
        <ul className="nx-story-list">
          {stories.map((story) => {
            const badge = storyBadge(story.doc?.alertLevel || story.card.alertLevel, story.doc?.severity);
            const when = storyDateline(story.doc, story.card);
            const updated = updatedLabel(story.doc?.updated || story.card.updated);
            return (
              <li key={story.card.slug}>
                <Link className="nx-story-card" href={`/press/${story.card.slug}`}>
                  <span className={`nx-badge nx-badge--${badge.band}`}>{badge.label}</span>
                  <h3>{story.card.title}</h3>
                  <p className="nx-meta">
                    {labelize(story.doc?.eventType || story.card.eventType)}
                    {when ? ` · ${when}` : ''}
                  </p>
                  {updated ? <p className="nx-updated">{updated}</p> : null}
                  {story.card.summary ? <p>{story.card.summary}</p> : null}
                  {story.missing ? <p>The story file is missing.</p> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <ClaimList claims={claimsForRoom(claims, 'press')} catalog={claims} title="Claims filed to the press room" />
    </DeskShell>
  );
}
