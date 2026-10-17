import Link from 'next/link';
import ClaimList from '@/components/ClaimList';
import DeskShell from '@/components/DeskShell';
import FactCheckMark, { factCheckCardClass } from '@/components/FactCheckMark';
import SessionChat from '@/components/SessionChat';
import { labelize } from '@/lib/content';
import { claimsForRoom, factCheckStories } from '@/lib/desk';
import { loadClaims, loadSearch } from '@/lib/published';

export default function ConspiracyPage() {
  const claims = loadClaims();
  const roomClaims = claimsForRoom(claims, 'conspiracy');
  const stories = factCheckStories(loadSearch());
  const quiet = roomClaims.length === 0 && stories.length === 0;
  return (
    <DeskShell current="conspiracy">
      <p className="nx-kicker">Conspiracy room</p>
      <h2 className="nx-title">Claims and checks</h2>
      <p className="nx-deck">
        Filed claims and stories tagged misinformation, fact-check, or conspiracy show up here. Notes you type stay in this browser.
      </p>
      {quiet ? (
        <div className="nx-empty" role="status">
          <strong>Coverage for this beat has not been published</strong>
          It starts when a story is tagged misinformation or fact-check, or a claim is filed to this room.
        </div>
      ) : null}
      {stories.length ? (
        <ul className="nx-story-list">
          {stories.map((story) => (
            <li key={story.slug}>
              <Link className={factCheckCardClass(story)} href={`/press/${story.slug}`}>
                <FactCheckMark story={story} />
                <h3>{story.title}</h3>
                <p className="nx-meta">{labelize(story.eventType)}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <ClaimList claims={roomClaims} catalog={claims} title="Claims filed here" />
      <SessionChat />
    </DeskShell>
  );
}
