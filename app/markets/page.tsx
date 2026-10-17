import Link from 'next/link';
import ClaimList from '@/components/ClaimList';
import DeskShell from '@/components/DeskShell';
import MarketsMapLoader from '@/components/MarketsMapLoader';
import QuoteTable from '@/components/QuoteTable';
import { feedUnavailableLabel, formatDeskDate, labelize } from '@/lib/content';
import { claimsForRoom, marketStories, quotesForStory, type MarketQuote } from '@/lib/desk';
import { loadClaims, loadMarkets, loadSearch } from '@/lib/published';

function changeClass(change: number | null): string {
  if (change == null || change === 0) return 'nx-chip';
  return change > 0 ? 'nx-chip nx-chip--up' : 'nx-chip nx-chip--down';
}

function changeLabel(change: number | null): string {
  if (change == null) return 'n/a';
  const rounded = Math.round(change * 100) / 100;
  const text = String(rounded);
  return `${rounded > 0 ? '+' : ''}${text}%`;
}

function QuoteRow({ quote }: { quote: MarketQuote }) {
  return (
    <li className="nx-quote">
      <div>
        <strong>{quote.name}</strong>
        <p className="nx-meta">
          {quote.price ? `Last ${quote.price}` : 'Last price not published'}
          {quote.severity != null ? ` · ${quote.severity}/10` : ''}
          {quote.asOf ? ` · as of ${formatDeskDate(quote.asOf)}` : ''}
          {quote.lat == null || quote.lng == null ? ' · no map point' : ''}
        </p>
      </div>
      <span className={changeClass(quote.changePct)}>{changeLabel(quote.changePct)}</span>
    </li>
  );
}

export default function MarketsPage() {
  const claims = loadClaims();
  const roomClaims = claimsForRoom(claims, 'markets');
  const stories = marketStories(loadSearch());
  const markets = loadMarkets();
  const quotes = markets.quotes;
  const mapped = quotes.filter((quote) => quote.lat != null && quote.lng != null);
  const quiet = !markets.present && roomClaims.length === 0 && stories.length === 0;
  const unavailable = markets.present && markets.feedStatus === 'unavailable';
  return (
    <DeskShell current="markets">
      <p className="nx-kicker">Market movers</p>
      <h2 className="nx-title">Quotes and market stories</h2>
      <p className="nx-deck">
        Each trading day can publish one market movers story. Its quote table lists every pair, including ones with no map point. A story without a quotes array uses its own last price, previous close, change, as-of time, and source.
      </p>
      {unavailable ? (
        <p className="nx-feed-note" role="status">
          {feedUnavailableLabel('Markets')}
        </p>
      ) : null}
      {quiet ? (
        <div className="nx-empty" role="status">
          <strong>Coverage for this beat has not been published</strong>
          It starts when a markets layer, a market story, or a market claim is filed.
        </div>
      ) : null}
      {markets.present && quotes.length === 0 && !unavailable ? (
        <div className="nx-empty" role="status">
          <strong>No current quotes</strong>
          The markets file is present and the feed is healthy.
        </div>
      ) : null}
      {mapped.length ? <MarketsMapLoader quotes={mapped} /> : null}
      {quotes.length ? (
        <section className="nx-block">
          <h3>Quotes</h3>
          <ul className="nx-quote-list">
            {quotes.map((quote) => (
              <QuoteRow key={quote.id} quote={quote} />
            ))}
          </ul>
        </section>
      ) : null}
      {stories.length ? (
        <section className="nx-block">
          <h3>Market stories</h3>
          <ul className="nx-story-list">
            {stories.map((story) => (
              <li key={story.slug} className="nx-story-card">
                <h3>
                  <Link href={`/press/${story.slug}`}>{story.title}</Link>
                </h3>
                <p className="nx-meta">
                  {labelize(story.eventType)}
                  {story.asOf ? ` · as of ${formatDeskDate(story.asOf)}` : ''}
                  {story.location ? ` · ${story.location}` : ''}
                </p>
                <QuoteTable quotes={quotesForStory(story)} storyAsOf={story.asOf} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ClaimList claims={roomClaims} catalog={claims} title="Market claims" />
    </DeskShell>
  );
}
