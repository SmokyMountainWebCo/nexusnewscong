import Link from 'next/link';
import ClaimList from '@/components/ClaimList';
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
    <section className="room">
      <p className="kicker">Conspiracy room</p>
      <h2>Claims and checks</h2>
      <p>Stories tagged fact-check, misinformation, or conspiracy are listed here. Notes you type stay in this browser.</p>
      {quiet ? <p>Coverage for this beat has not been published.</p> : null}
      {stories.length ? (
        <ul className="stories">
          {stories.map((story) => (
            <li key={story.slug} data-reveal>
              <Link className={factCheckCardClass(story)} href={`/press/${story.slug}`}>
                <FactCheckMark story={story} />
                <h3>{story.title}</h3>
                <p>{labelize(story.eventType)}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <ClaimList claims={roomClaims} catalog={claims} title="Claims filed here" />
      <SessionChat />
    </section>
  );
}
