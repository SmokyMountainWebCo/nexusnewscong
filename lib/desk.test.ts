import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  factCheckLabel,
  factCheckStories,
  isFactCheckStory,
  marketStories,
  parseMarketLayer,
  parseSearchIndex,
  quotesForStory,
  searchDesk,
} from './desk.ts';

const root = process.cwd();
const search = parseSearchIndex(JSON.parse(fs.readFileSync(path.join(root, 'public/stories/search.json'), 'utf8')));
assert.ok(search.length > 0);
assert.equal(search.every((story) => typeof story.asOf === 'string' || story.asOf === null), true);

const marketFile = parseSearchIndex([
  {
    slug: 'btc-note',
    title: 'Bitcoin slips against the dollar',
    event_type: 'market',
    as_of: '2026-10-16T18:00:00Z',
    tags: [],
    body: 'A market note with no map point.',
  },
  {
    slug: 'check-note',
    title: 'A circulating claim',
    event_type: 'fact-check',
    rating: 'Pants on Fire',
    body: 'Listed without coordinates.',
  },
]);

const markets = marketStories(marketFile);
assert.equal(markets.length, 1);
assert.equal(markets[0].slug, 'btc-note');
assert.equal(markets[0].asOf, '2026-10-16T18:00:00Z');

const daily = parseSearchIndex([
  {
    slug: 'movers-oct-16',
    title: 'Market movers for Oct 16',
    event_type: 'market movers',
    as_of: '2026-10-16T20:00:00Z',
    severity: 8,
    quotes: [
      { name: 'BTC/USD', last: 67000, prev_close: 68000, change_pct: -1.47, as_of: '2026-10-16T19:30:00Z', url: 'https://example.com/btc' },
      { name: 'EUR/USD', last: '1.08', prev_close: '1.07', change_pct: 0.4, severity: 2, url: 'javascript:alert(1)' },
    ],
  },
  {
    slug: 'one-quote',
    title: 'Single print',
    event_type: 'market',
    as_of: '2026-10-16T12:00:00Z',
    severity: 5,
    name: 'CL',
    last: 80.5,
    prev_close: 79,
    change_pct: 1.9,
    url: 'https://example.com/cl',
  },
]);
assert.equal(marketStories(daily).length, 2);
const table = quotesForStory(daily[0]);
assert.equal(table.length, 2);
assert.equal(table[0].name, 'BTC/USD');
assert.equal(table[0].last, '67000');
assert.equal(table[0].prevClose, '68000');
assert.equal(table[0].changePct, -1.47);
assert.equal(table[0].asOf, '2026-10-16T19:30:00Z');
assert.equal(table[0].url, 'https://example.com/btc');
assert.equal(table[0].severity, 8);
assert.equal(table[1].severity, 2);
assert.equal(table[1].url, null);
assert.equal(daily[0].asOf, '2026-10-16T20:00:00Z');
const fallback = quotesForStory(daily[1]);
assert.equal(fallback.length, 1);
assert.equal(fallback[0].name, 'CL');
assert.equal(fallback[0].prevClose, '79');
assert.equal(fallback[0].changePct, 1.9);
assert.equal(fallback[0].severity, 5);
assert.equal(fallback[0].url, 'https://example.com/cl');
assert.equal(quotesForStory(marketFile[0]).length, 0);

const checks = factCheckStories(marketFile);
assert.equal(checks.length, 1);
assert.equal(checks[0].rating, 'Pants on Fire');
assert.equal(factCheckLabel(checks[0].verdictType).label, 'Fact-check');
assert.equal(factCheckLabel(checks[0].verdictType).tone, 'unset');

const verdicts = parseSearchIndex([
  { slug: 'debunked-claim', title: 'A debunked claim', event_type: 'fact-check', verdict_type: 'debunk', rating: 'False' },
  { slug: 'confirmed-claim', title: 'A confirmed claim', event_type: 'fact_check', verdict_type: 'confirmation', rating: 'True' },
  { slug: 'open-claim', title: 'An open check', tags: ['fact-check'], rating: null },
]);
assert.equal(factCheckLabel(verdicts[0].verdictType).label, 'Debunked');
assert.equal(factCheckLabel(verdicts[0].verdictType).tone, 'debunk');
assert.equal(verdicts[0].rating, 'False');
assert.equal(factCheckLabel(verdicts[1].verdictType).label, 'Confirmed');
assert.equal(factCheckLabel('Confirmation').tone, 'confirmation');
assert.equal(verdicts[2].rating, null);
assert.equal(factCheckLabel(verdicts[2].verdictType).label, 'Fact-check');
assert.equal(isFactCheckStory(verdicts[2]), true);
assert.equal(isFactCheckStory(marketFile[0]), false);

const layer = parseMarketLayer({
  type: 'FeatureCollection',
  feed_status: 'ok',
  features: [
    {
      type: 'Feature',
      geometry: null,
      properties: { name: 'BTC/USD', last_price: 67000.5, change_pct: -1.25, severity_score: 4, as_of: '2026-10-16T18:00:00Z' },
    },
    {
      type: 'Feature',
      properties: { symbol: 'EUR/USD', price: '1.08', change: '+0.4%' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.0, 40.7] },
      properties: { quote: 'NYMEX', last: 80, percent_change: 1.1 },
    },
  ],
});

assert.equal(layer.present, true);
assert.equal(layer.quotes.length, 3);
assert.equal(layer.quotes[0].name, 'BTC/USD');
assert.equal(layer.quotes[0].lat, null);
assert.equal(layer.quotes[0].changePct, -1.25);
assert.equal(layer.quotes[1].name, 'EUR/USD');
assert.equal(layer.quotes[1].lng, null);
assert.equal(layer.quotes[1].changePct, 0.4);
assert.equal(layer.quotes[2].lat, 40.7);
assert.equal(layer.quotes[2].lng, -74);

const down = parseMarketLayer({ type: 'FeatureCollection', feed_status: 'unavailable', features: [] });
assert.equal(down.feedStatus, 'unavailable');
assert.equal(parseMarketLayer(null).present, false);

const hit = searchDesk(
  { stories: marketFile, claims: [], briefs: {}, sources: {} },
  'bitcoin',
);
assert.equal(hit.some((item) => item.kind === 'story' && item.slug === 'btc-note'), true);

console.log('desk tests passed');
