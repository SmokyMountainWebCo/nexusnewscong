import Link from 'next/link';
import ClaimList from '@/components/ClaimList';
import QuoteTable from '@/components/QuoteTable';
import { formatDeskDate, labelize } from '@/lib/content';
import { claimsForRoom, marketStories, quotesForStory } from '@/lib/desk';
import { loadClaims, loadSearch } from '@/lib/published';

export default function MarketsPage() {
  const claims = loadClaims();
  const roomClaims = claimsForRoom(claims, 'markets');
  const stories = marketStories(loadSearch());
  const quiet = roomClaims.length === 0 && stories.length === 0;
  return (
    <section className="room">
      <p className="kicker">Market movers</p>
      <h2>Quotes and market stories</h2>
      <p>
        A market movers story can carry a quotes table, including pairs with no map point. There is no markets map. The GeoJSON layers are not part of this desk.
      </p>
      {quiet ? <p>Coverage for this beat has not been published.</p> : null}
      {stories.length ? (
        <ul className="stories">
          {stories.map((story) => (
            <li key={story.slug} className="story-card" data-reveal>
              <h3>
                <Link href={`/press/${story.slug}`}>{story.title}</Link>
              </h3>
              <p>
                {labelize(story.eventType)}
                {story.asOf ? ` · as of ${formatDeskDate(story.asOf) || story.asOf}` : ''}
                {story.location ? ` · ${story.location}` : ''}
              </p>
              <QuoteTable quotes={quotesForStory(story)} storyAsOf={story.asOf} note={story.quotesNote} />
            </li>
          ))}
        </ul>
      ) : null}
      <ClaimList claims={roomClaims} catalog={claims} title="Market claims" />
    </section>
  );
}
