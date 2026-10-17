// In-browser desk search over the static publisher files.
// search.json, claims.json, and the optional briefs.json / sources.json / markets.geojson files.

export type FeedStatus = 'ok' | 'unavailable';

export type SearchStory = {
  slug: string;
  title: string;
  location: string | null;
  severity: number | null;
  alertLevel: string | null;
  eventType: string | null;
  timestamp: string | null;
  updated: string | null;
  updateNote: string | null;
  asOf: string | null;
  verdictType: string | null;
  rating: string | null;
  quoteName: string | null;
  last: string | null;
  prevClose: string | null;
  changePct: number | null;
  quoteUrl: string | null;
  quotes: StoryQuote[];
  sourceUrls: string[];
  tags: string[];
  body: string;
};

export type StoryQuote = {
  name: string;
  last: string | null;
  prevClose: string | null;
  changePct: number | null;
  asOf: string | null;
  url: string | null;
  severity: number | null;
};

export type MarketQuote = {
  id: string;
  name: string;
  price: string | null;
  changePct: number | null;
  severity: number | null;
  asOf: string | null;
  lat: number | null;
  lng: number | null;
};

export type MarketLayer = {
  present: boolean;
  feedStatus: FeedStatus;
  updated: string | null;
  quotes: MarketQuote[];
};

export type ClaimSource = {
  id: string | null;
  name: string | null;
  url: string | null;
};

export type Claim = {
  id: string;
  text: string;
  room: string;
  sources: ClaimSource[];
  timestamp: string | null;
  confidence: number | null;
  provenance: string | null;
  contradictions: string[];
};

export type SourceEntry = { label: string; url: string };

export type SourcePack = {
  keyFindings: string[];
  sources: SourceEntry[];
};

export type DeskCorpus = {
  stories: SearchStory[];
  claims: Claim[];
  briefs: Record<string, string[]>;
  sources: Record<string, SourcePack>;
};

export type StoryHit = {
  kind: 'story';
  score: number;
  slug: string;
  title: string;
  excerpt: string;
  alertLevel: string | null;
  severity: number | null;
  eventType: string | null;
  sources: SourceEntry[];
  findings: string[];
};

export type ClaimHit = {
  kind: 'claim';
  score: number;
  id: string;
  text: string;
  room: string;
  confidence: number | null;
  excerpt: string;
  sources: SourceEntry[];
  contradictions: { id: string; text: string | null }[];
};

export type AskHit = StoryHit | ClaimHit;

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'has', 'have', 'had', 'its', 'into', 'over', 'about', 'what', 'when', 'where', 'who', 'how', 'why']);

const ROOM_ALIASES: Record<string, string[]> = {
  summary: ['summary'],
  'war-room': ['war-room', 'war', 'conflict'],
  press: ['press', 'press-room'],
  markets: ['markets', 'market', 'market-movers'],
  'market-movers': ['markets', 'market', 'market-movers'],
  conspiracy: ['conspiracy', 'misinformation', 'disinformation', 'fact-check', 'factcheck'],
};

const BEAT_TAGS: Record<string, string[]> = {
  'market-movers': ['market', 'markets', 'market movers', 'finance', 'economy'],
  conspiracy: ['misinformation', 'disinformation', 'fact check', 'conspiracy', 'rumor', 'rumour'],
};

export function normalizeToken(value: string | null | undefined): string {
  return (value || '').toLowerCase().replace(/[_-]+/g, ' ').trim();
}

export function marketStories(stories: SearchStory[]): SearchStory[] {
  const tags = new Set(BEAT_TAGS['market-movers']);
  return stories.filter((story) => tags.has(normalizeToken(story.eventType)) || story.tags.some((tag) => tags.has(normalizeToken(tag))));
}

export function quotesForStory(story: SearchStory): StoryQuote[] {
  if (story.quotes.length) return story.quotes;
  if (!story.quoteName && !story.last && !story.prevClose && story.changePct == null && !story.quoteUrl) return [];
  return [{
    name: story.quoteName || story.title,
    last: story.last,
    prevClose: story.prevClose,
    changePct: story.changePct,
    asOf: story.asOf,
    url: story.quoteUrl,
    severity: story.severity,
  }];
}

export type FactCheckTone = 'debunk' | 'confirmation' | 'mixed' | 'unset';

export function isFactCheckStory(story: SearchStory): boolean {
  if (normalizeToken(story.eventType) === 'fact check') return true;
  return story.tags.some((tag) => normalizeToken(tag) === 'fact check');
}

export function factCheckLabel(verdictType: string | null): { tone: FactCheckTone; label: string } {
  const value = normalizeToken(verdictType);
  if (value === 'debunk') return { tone: 'debunk', label: 'Debunked' };
  if (value === 'confirmation') return { tone: 'confirmation', label: 'Confirmed' };
  if (value === 'mixed') return { tone: 'mixed', label: 'Mixed' };
  return { tone: 'unset', label: 'Fact-check' };
}

export function factCheckStories(stories: SearchStory[]): SearchStory[] {
  const tags = new Set(BEAT_TAGS.conspiracy);
  return stories.filter((story) => tags.has(normalizeToken(story.eventType)) || story.tags.some((tag) => tags.has(normalizeToken(tag))));
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asString).filter((item): item is string => Boolean(item));
  const one = asString(value);
  return one ? [one] : [];
}

function asScore(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function parseSearchIndex(data: unknown): SearchStory[] {
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { stories?: unknown }).stories)
      ? (data as { stories: unknown[] }).stories
      : [];
  const stories: SearchStory[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const slug = asString(item.slug);
    const title = asString(item.title);
    if (!slug || !title) continue;
    stories.push({
      slug,
      title,
      location: asString(item.location),
      severity: asScore(item.severity),
      alertLevel: asString(item.alert_level),
      eventType: asString(item.event_type),
      timestamp: asString(item.timestamp),
      updated: asString(item.updated),
      updateNote: asString(item.update_note),
      sourceUrls: asStringList(item.source_urls ?? item.sources),
      tags: asStringList(item.tags),
      asOf: asString(item.as_of),
      verdictType: asString(item.verdict_type),
      rating: item.rating == null ? null : asString(item.rating),
      quoteName: asString(item.name) || asString(item.quote) || asString(item.symbol),
      last: formatPrice(item.last ?? item.last_price ?? item.price),
      prevClose: formatPrice(item.prev_close ?? item.previous_close),
      changePct: asPercent(item.change_pct ?? item.pct_change ?? item.percent_change ?? item.change_percent ?? item.change),
      quoteUrl: safeHttp(asString(item.url)),
      quotes: parseQuoteList(item.quotes, asScore(item.severity)),
      body: asString(item.body) || asString(item.text) || '',
    });
  }
  return stories;
}

export function parseClaimsFile(data: unknown): { generatedAt: string | null; claims: Claim[] } {
  if (!data || typeof data !== 'object') return { generatedAt: null, claims: [] };
  const record = data as Record<string, unknown>;
  const rows = Array.isArray(record.claims) ? record.claims : Array.isArray(data) ? (data as unknown[]) : [];
  const claims: Claim[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const text = asString(item.text);
    const id = asString(item.id);
    if (!text || !id) continue;
    const sources = Array.isArray(item.sources)
      ? item.sources.map((source) => {
          if (!source || typeof source !== 'object') return null;
          const entry = source as Record<string, unknown>;
          const url = asString(entry.url);
          return {
            id: asString(entry.id),
            name: asString(entry.name) || asString(entry.label),
            url,
          };
        }).filter((source): source is ClaimSource => Boolean(source && source.url))
      : [];
    claims.push({
      id,
      text,
      room: (asString(item.room) || '').toLowerCase(),
      sources,
      timestamp: asString(item.timestamp),
      confidence: asScore(item.confidence),
      provenance: asString(item.provenance),
      contradictions: asStringList(item.contradictions),
    });
  }
  return { generatedAt: asString(record.generated_at), claims };
}

export function parseBriefsFile(data: unknown): Record<string, string[]> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const briefs: Record<string, string[]> = {};
  for (const [slug, value] of Object.entries(data as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const questions = asStringList((value as { key_questions?: unknown }).key_questions);
    if (questions.length) briefs[slug] = questions;
  }
  return briefs;
}

export function parseSourcesFile(data: unknown): Record<string, SourcePack> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const packs: Record<string, SourcePack> = {};
  for (const [slug, value] of Object.entries(data as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const record = value as Record<string, unknown>;
    const keyFindings = asStringList(record.key_findings);
    const sources = Array.isArray(record.sources)
      ? record.sources.map((source) => {
          if (!source || typeof source !== 'object') return null;
          const entry = source as Record<string, unknown>;
          const url = asString(entry.url);
          const label = asString(entry.label) || asString(entry.name) || url;
          if (!url || !label) return null;
          return { label, url };
        }).filter((source): source is SourceEntry => Boolean(source))
      : [];
    if (keyFindings.length || sources.length) packs[slug] = { keyFindings, sources };
  }
  return packs;
}

export function claimsForRoom(claims: Claim[], room: string): Claim[] {
  const aliases = new Set(ROOM_ALIASES[room] || [room.toLowerCase()]);
  return claims.filter((claim) => aliases.has(claim.room));
}

export function storiesForBeat(stories: SearchStory[], room: string): SearchStory[] {
  const tags = new Set(BEAT_TAGS[room] || []);
  if (!tags.size) return [];
  return stories.filter((story) => {
    const fields = [story.eventType, ...story.tags].filter((value): value is string => Boolean(value));
    return fields.some((field) => {
      const normalized = normalizeToken(field);
      return [...tags].some((tag) => {
        const needle = normalizeToken(tag);
        return normalized === needle || normalized.split(' ').includes(needle);
      });
    });
  });
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > 2) return 3;
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let i = 1; i <= right.length; i += 1) {
    let previous = rows[0];
    rows[0] = i;
    for (let j = 1; j <= left.length; j += 1) {
      const current = rows[j];
      const cost = left[j - 1] === right[i - 1] ? 0 : 1;
      rows[j] = Math.min(rows[j] + 1, rows[j - 1] + 1, previous + cost);
      previous = current;
    }
  }
  return rows[left.length];
}

function tokenHits(query: string[], haystack: string): number {
  if (!haystack) return 0;
  const hay = haystack.toLowerCase();
  const words = tokens(haystack);
  let hits = 0;
  for (const token of query) {
    if (hay.includes(token)) {
      hits += 1;
      continue;
    }
    if (token.length < 5) continue;
    const limit = token.length >= 8 ? 2 : 1;
    if (words.some((word) => editDistance(token, word) <= limit)) hits += 1;
  }
  return hits;
}

function excerptAround(text: string, query: string[]): string {
  const clean = text.replace(/^#{1,6}\s+/gm, '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let best = sentences[0] || clean;
  let bestScore = -1;
  for (const sentence of sentences) {
    const score = tokenHits(query, sentence);
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    }
  }
  if (best.length <= 280) return best;
  const lower = best.toLowerCase();
  const at = query.map((token) => lower.indexOf(token)).find((index) => index >= 0) ?? 0;
  const start = Math.max(0, at - 80);
  return `${start > 0 ? '…' : ''}${best.slice(start, start + 260).trim()}…`;
}

function storySources(story: SearchStory, pack: SourcePack | undefined): SourceEntry[] {
  if (pack?.sources.length) return pack.sources;
  return story.sourceUrls.map((url) => ({ label: url, url }));
}

export function suggestedQuestions(corpus: DeskCorpus): string[] {
  const fromBriefs = Object.values(corpus.briefs).flat();
  if (fromBriefs.length) return fromBriefs.slice(0, 6);
  return corpus.stories.slice(0, 4).map((story) => `What is published on ${story.title}?`);
}

export function searchDesk(corpus: DeskCorpus, rawQuery: string): AskHit[] {
  const query = tokens(rawQuery);
  if (!query.length) return [];
  const phrase = rawQuery.trim().toLowerCase();
  const hits: AskHit[] = [];

  for (const story of corpus.stories) {
    const pack = corpus.sources[story.slug];
    const findings = pack?.keyFindings || [];
    const questions = corpus.briefs[story.slug] || [];
    const fields: Array<[string, number]> = [
      [story.title, 6],
      [story.eventType || '', 4],
      [story.location || '', 3],
      [story.alertLevel || '', 2],
      [story.tags.join(' '), 4],
      [findings.join(' '), 5],
      [questions.join(' '), 5],
      [story.body, 2],
    ];
    let score = 0;
    for (const [text, weight] of fields) {
      score += tokenHits(query, text) * weight;
    }
    if (phrase.length > 3 && `${story.title} ${story.body}`.toLowerCase().includes(phrase)) score += 8;
    if (score < 2) continue;
    hits.push({
      kind: 'story',
      score,
      slug: story.slug,
      title: story.title,
      excerpt: excerptAround(findings[0] || story.body || story.title, query),
      alertLevel: story.alertLevel,
      severity: story.severity,
      eventType: story.eventType,
      sources: storySources(story, pack).slice(0, 4),
      findings: findings.slice(0, 3),
    });
  }

  const byId = new Map(corpus.claims.map((claim) => [claim.id, claim]));
  for (const claim of corpus.claims) {
    let score = tokenHits(query, claim.text) * 5;
    score += tokenHits(query, claim.room) * 2;
    if (phrase.length > 3 && claim.text.toLowerCase().includes(phrase)) score += 8;
    if (score < 2) continue;
    hits.push({
      kind: 'claim',
      score,
      id: claim.id,
      text: claim.text,
      room: claim.room,
      confidence: claim.confidence,
      excerpt: excerptAround(claim.text, query),
      sources: claim.sources.map((source) => ({ label: source.name || source.url || 'Source', url: source.url || '' })).filter((source) => source.url),
      contradictions: claim.contradictions.map((id) => ({ id, text: byId.get(id)?.text || null })),
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function emptyCorpus(): DeskCorpus {
  return { stories: [], claims: [], briefs: {}, sources: {} };
}

function feedStatusOf(top: unknown, meta: unknown): FeedStatus {
  const primary = asString(top) ?? asString(meta);
  return primary?.toLowerCase() === 'unavailable' ? 'unavailable' : 'ok';
}

function safeHttp(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
  } catch {
    return null;
  }
  return null;
}

function parseQuoteList(value: unknown, storySeverity: number | null): StoryQuote[] {
  if (!Array.isArray(value)) return [];
  const quotes: StoryQuote[] = [];
  for (const row of value) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const name = asString(item.name) || asString(item.quote) || asString(item.symbol);
    if (!name) continue;
    quotes.push({
      name,
      last: formatPrice(item.last ?? item.last_price ?? item.price),
      prevClose: formatPrice(item.prev_close ?? item.previous_close),
      changePct: asPercent(item.change_pct ?? item.pct_change ?? item.percent_change ?? item.change_percent ?? item.change),
      asOf: asString(item.as_of),
      url: safeHttp(asString(item.url) || asString(item.source_url)),
      severity: asScore(item.severity ?? item.severity_score) ?? storySeverity,
    });
  }
  return quotes;
}

function asPercent(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const number = Number(value.replace(/%/g, '').replace(/,/g, '').trim());
    return Number.isFinite(number) ? number : null;
  }
  return null;
}

function formatPrice(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const rounded = Math.round(value * 10000) / 10000;
    return String(rounded);
  }
  return asString(value);
}

function pointFromGeometry(geometry: unknown): { lat: number; lng: number } | null {
  if (!geometry || typeof geometry !== 'object') return null;
  const geo = geometry as { type?: string; coordinates?: unknown };
  const pair = (value: unknown) => {
    if (!Array.isArray(value) || value.length < 2) return null;
    const lng = Number(value[0]);
    const lat = Number(value[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  };
  if (geo.type === 'Point') return pair(geo.coordinates);
  if (geo.type === 'MultiPoint' && Array.isArray(geo.coordinates)) {
    for (const item of geo.coordinates) {
      const hit = pair(item);
      if (hit) return hit;
    }
  }
  return null;
}

export function parseMarketLayer(data: unknown): MarketLayer {
  if (!data || typeof data !== 'object') return { present: false, feedStatus: 'ok', updated: null, quotes: [] };
  const record = data as Record<string, unknown>;
  const meta = record.metadata && typeof record.metadata === 'object' ? (record.metadata as Record<string, unknown>) : {};
  const features = Array.isArray(record.features) ? record.features : [];
  const quotes: MarketQuote[] = [];
  features.forEach((feature, index) => {
    if (!feature || typeof feature !== 'object') return;
    const item = feature as { geometry?: unknown; properties?: unknown };
    const props = item.properties && typeof item.properties === 'object' ? (item.properties as Record<string, unknown>) : {};
    const name = asString(props.name) || asString(props.quote) || asString(props.symbol) || asString(props.pair) || asString(props.ticker);
    if (!name) return;
    const point = pointFromGeometry(item.geometry);
    quotes.push({
      id: asString(props.id) || `${name}-${index}`,
      name,
      price: formatPrice(props.last_price ?? props.last ?? props.price),
      changePct: asPercent(props.change_pct ?? props.pct_change ?? props.percent_change ?? props.change_percent ?? props.change),
      severity: asScore(props.severity_score ?? props.severity),
      asOf: asString(props.as_of),
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
    });
  });
  return {
    present: true,
    feedStatus: feedStatusOf(record.feed_status, meta.feed_status),
    updated: asString(meta.last_updated),
    quotes,
  };
}
