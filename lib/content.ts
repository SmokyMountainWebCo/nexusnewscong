// Parsers for publisher files. No network and no Supabase.
// Stories: public/stories/index.json + public/stories/<slug>.md
// Optional investigation fields: confidence, conclusions, canaries.

export type AlertBand = 'green' | 'orange' | 'red' | 'unknown';

export type StoryCard = {
  slug: string;
  title: string;
  date: string | null;
  timestamp: string | null;
  eventType: string | null;
  alertLevel: string | null;
  alertNote: string | null;
  summary: string | null;
  path: string;
  tags: string[];
  updated: string | null;
  updateNote: string | null;
  location: string | null;
  confidence: unknown;
  conclusions: unknown;
  canaries: unknown;
  developing: unknown;
  asOf: string | null;
  trail: unknown;
  image: string | null;
  imageAlt: string | null;
  imageCredit: string | null;
  imageLicense: string | null;
  imageSourceUrl: string | null;
  related: RelatedItem[];
};

export type StoryDoc = {
  title: string | null;
  status: string | null;
  alertLevel: string | null;
  alertNote: string | null;
  severity: number | null;
  eventType: string | null;
  date: string | null;
  timestamp: string | null;
  location: string | null;
  locations: string[];
  sources: string[];
  tags: string[];
  briefId: string | null;
  updated: string | null;
  updateNote: string | null;
  confidence: unknown;
  conclusions: unknown;
  canaries: unknown;
  developing: unknown;
  asOf: string | null;
  trail: unknown;
  image: string | null;
  imageAlt: string | null;
  imageCredit: string | null;
  imageLicense: string | null;
  imageSourceUrl: string | null;
  related: RelatedItem[];
  body: string;
};

export type RelatedItem = {
  slug: string;
  reason: string;
  strength: number | null;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function bandFromSeverity(score: number | null): AlertBand {
  if (score == null || !Number.isFinite(score)) return 'unknown';
  if (score >= 1 && score <= 3) return 'green';
  if (score >= 4 && score <= 6) return 'orange';
  if (score >= 7 && score <= 10) return 'red';
  return 'unknown';
}

export function bandFromAlertLabel(label: string | null | undefined): AlertBand | null {
  if (!label) return null;
  const text = label.toLowerCase();
  if (/\bred\b/.test(text)) return 'red';
  if (/\borange\b/.test(text)) return 'orange';
  if (/\bgreen\b/.test(text)) return 'green';
  return null;
}

/** First none/green/orange/red token. "none (no GDACS-type alert…)" is none. */
export function alertLevelToken(label: string | null | undefined): string | null {
  if (!label) return null;
  const match = label.match(/\b(none|green|orange|red)\b/i);
  return match ? match[1] : null;
}

function levelLabel(token: string): string {
  const lower = token.toLowerCase();
  if (lower === 'green') return 'Green';
  if (lower === 'orange') return 'Orange';
  if (lower === 'red') return 'Red';
  return token;
}

export function storyBadge(alertLevel: unknown, severity: unknown): { label: string; band: AlertBand } | null {
  const token = alertLevelToken(asString(alertLevel));
  if (token?.toLowerCase() === 'none') return null;
  if (token) {
    const band = bandFromAlertLabel(token) ?? bandFromSeverity(asScore(severity));
    return { label: levelLabel(token), band };
  }
  const score = asScore(severity);
  const band = bandFromSeverity(score);
  if (band === 'green') return { label: 'Green', band };
  if (band === 'orange') return { label: 'Orange', band };
  if (band === 'red') return { label: 'Red', band };
  return { label: 'Unrated', band: 'unknown' };
}


export function labelize(value: string | null | undefined): string {
  if (!value || !value.trim()) return 'Event';
  const spaced = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function updatedLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return `Updated ${formatDeskDate(raw) || raw}`;
}



type WhenSource = {
  date?: string | null;
  updated?: string | null;
  timestamp?: string | null;
};

export function storyDateline(...sources: Array<WhenSource | null | undefined>): string | null {
  const present = sources.filter((source): source is WhenSource => Boolean(source));
  const pick = (key: keyof WhenSource) => {
    for (const source of present) {
      const value = source[key];
      if (!value) continue;
      return formatDeskDate(value) || value;
    }
    return null;
  };
  return pick('date') || pick('updated') || pick('timestamp');
}

export function formatDeskClock(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function formatDeskDate(raw: string | null): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    if (!month || month < 1 || month > 12) return raw;
    return `${MONTHS_LONG[month - 1]} ${day}, ${year}`;
  }
  return formatUtc(raw);
}

export function formatTimestamp(raw: string | null): string {
  if (!raw) return 'Time not provided';
  return formatUtc(raw) ?? raw;
}


export function parseStoryIndex(data: unknown): { generatedAt: string | null; stories: StoryCard[] } {
  if (!data || typeof data !== 'object') return { generatedAt: null, stories: [] };
  const record = data as Record<string, unknown>;
  const rows = Array.isArray(record.stories) ? record.stories : [];
  const stories: StoryCard[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const slug = asString(item.slug);
    const title = asString(item.title);
    const explicitPath = asString(item.path);
    const path = explicitPath
      ? explicitPath.startsWith('/')
        ? explicitPath
        : `/${explicitPath}`
      : slug
        ? `/stories/${slug}.md`
        : null;
    if (!title || !path) continue;
    stories.push({
      slug: slug || path,
      title,
      date: asString(item.date),
      timestamp: asString(item.timestamp),
      eventType: asString(item.event_type),
      alertLevel: asString(item.alert_level),
      alertNote: asString(item.alert_note),
      summary: asString(item.summary),
      path,
      tags: asStringList(item.tags),
      updated: asString(item.updated),
      updateNote: asString(item.update_note),
      location: asString(item.location),
      confidence: item.confidence ?? null,
      conclusions: item.conclusions ?? null,
      canaries: item.canaries ?? null,
      developing: item.developing ?? null,
      asOf: asString(item.as_of),
      trail: item.trail ?? null,
      image: asString(item.image),
      imageAlt: asString(item.image_alt),
      imageCredit: asString(item.image_credit),
      imageLicense: asString(item.image_license),
      imageSourceUrl: asString(item.image_source_url),
      related: parseRelated(item.related),
    });
  }
  return { generatedAt: asString(record.generated_at), stories };
}

export function parseStoryMarkdown(raw: string): StoryDoc {
  const text = raw.replace(/^\uFEFF/, '');
  let fm = '';
  let body = text;
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) {
      fm = text.slice(3, end).replace(/^\r?\n/, '');
      body = text.slice(end + 4).replace(/^\r?\n/, '');
    }
  }
  const data = parseSimpleYaml(fm);
  const sources = uniqueHttp([
    ...asStringList(data.sources),
    ...asStringList(data.source_urls),
  ]);
  return {
    title: asString(data.title),
    status: asString(data.status),
    alertLevel: asString(data.alert_level),
    alertNote: asString(data.alert_note),
    severity: asScore(data.severity),
    eventType: asString(data.event_type),
    date: asString(data.date),
    timestamp: asString(data.timestamp),
    location: asString(data.location),
    locations: asStringList(data.locations),
    sources,
    tags: asStringList(data.tags),
    briefId: asString(data.brief_id),
    updated: asString(data.updated),
    updateNote: asString(data.update_note),
    confidence: data.confidence ?? null,
    conclusions: data.conclusions ?? null,
    canaries: data.canaries ?? null,
    developing: data.developing ?? null,
    asOf: asString(data.as_of),
    trail: data.trail ?? null,
    image: asString(data.image),
    imageAlt: asString(data.image_alt),
    imageCredit: asString(data.image_credit),
    imageLicense: asString(data.image_license),
    imageSourceUrl: asString(data.image_source_url),
    related: parseRelated(data.related),
    body: body.trim(),
  };
}

const RELATED_REASONS = new Set(['shared_event', 'same_location', 'follow_up']);

export function parseRelated(value: unknown): RelatedItem[] {
  if (!Array.isArray(value)) return [];
  const items: RelatedItem[] = [];
  for (const row of value) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const item = row as Record<string, unknown>;
    const slug = asString(item.slug);
    if (!slug) continue;
    const rawReason = asString(item.reason) || '';
    const reason = rawReason.toLowerCase().replace(/[\s-]+/g, '_');
    const strength = asScore(item.strength);
    items.push({
      slug,
      reason: RELATED_REASONS.has(reason) ? reason : rawReason || 'related',
      strength: strength != null && strength >= 1 && strength <= 3 ? Math.round(strength) : null,
    });
  }
  return items;
}

export function isPublished(doc: StoryDoc | null): boolean {
  if (!doc || doc.status == null) return true;
  return doc.status.trim().toLowerCase() === 'published';
}


export type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong'; v: string }
  | { t: 'em'; v: string }
  | { t: 'code'; v: string }
  | { t: 'link'; v: string; href: string };

export type Block =
  | { t: 'h'; level: 2 | 3 | 4; inlines: Inline[] }
  | { t: 'p'; inlines: Inline[]; inference?: boolean }
  | { t: 'ul'; items: Inline[][] }
  | { t: 'ol'; items: Inline[][] }
  | { t: 'quote'; inlines: Inline[] }
  | { t: 'hr' };

export function stripMatchingHeading(body: string, title: string | null): string {
  if (!title) return body.trim();
  const lines = body.replace(/^\uFEFF/, '').split(/\r?\n/);
  let index = 0;
  while (index < lines.length && !lines[index].trim()) index += 1;
  const match = /^(#{1,6})\s+(.*)$/.exec(lines[index] || '');
  if (!match) return body.trim();
  if (match[2].trim().toLowerCase() !== title.trim().toLowerCase()) return body.trim();
  return lines.slice(index + 1).join('\n').trim();
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ');
    blocks.push({ t: 'p', inlines: parseInlines(text), inference: /^inference\s*:/i.test(text.trim()) });
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push({
      t: list.ordered ? 'ol' : 'ul',
      items: list.items.map((item) => parseInlines(item)),
    });
    list = null;
  };
  const flushQuote = () => {
    if (!quote) return;
    blocks.push({ t: 'quote', inlines: parseInlines(quote.join(' ')) });
    quote = null;
  };
  const flush = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      flush();
      blocks.push({ t: 'hr' });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      const rawLevel = heading[1].length;
      const mapped: 2 | 3 | 4 = rawLevel <= 2 ? 2 : rawLevel === 3 ? 3 : 4;
      blocks.push({ t: 'h', level: mapped, inlines: parseInlines(heading[2]) });
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (bullet || ordered) {
      flushParagraph();
      flushQuote();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push((bullet || ordered)![1]);
      continue;
    }
    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushList();
      quote = quote || [];
      quote.push(trimmed.replace(/^>\s?/, ''));
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }
  flush();
  return blocks;
}

export function parseInlines(input: string): Inline[] {
  const re = /(`[^`]+`)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const out: Inline[] = [];
  let cursor = 0;
  for (const match of input.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > cursor) out.push({ t: 'text', v: input.slice(cursor, index) });
    if (match[1]) out.push({ t: 'code', v: match[1].slice(1, -1) });
    else if (match[2] && match[3]) {
      const href = safeHttp(match[3]) || (match[3].startsWith('/') ? match[3] : null);
      if (href) out.push({ t: 'link', v: match[2], href });
      else out.push({ t: 'text', v: match[0] });
    } else if (match[4]) out.push({ t: 'strong', v: match[4] });
    else if (match[5]) out.push({ t: 'em', v: match[5] });
    cursor = index + match[0].length;
  }
  if (cursor < input.length) out.push({ t: 'text', v: input.slice(cursor) });
  return out;
}

function parseSimpleYaml(fm: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let current: string | null = null;
  for (const line of fm.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const nested = /^\s+([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (nested && current && Array.isArray(out[current]) && !line.trimStart().startsWith('-')) {
      const list = out[current] as unknown[];
      const last = list[list.length - 1];
      if (last && typeof last === 'object' && !Array.isArray(last)) {
        (last as Record<string, unknown>)[nested[1]] = nested[2].trim() ? coerceScalar(nested[2]) : '';
        continue;
      }
    }
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && current) {
      const existing = Array.isArray(out[current]) ? (out[current] as unknown[]) : [];
      const kvItem = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(item[1]);
      if (kvItem) existing.push({ [kvItem[1]]: kvItem[2].trim() ? coerceScalar(kvItem[2]) : '' });
      else existing.push(unquote(item[1]));
      out[current] = existing;
      continue;
    }
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    current = kv[1];
    out[current] = kv[2].trim() ? coerceScalar(kv[2]) : [];
  }
  return out;
}

function coerceScalar(value: string): unknown {
  const text = unquote(value);
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text.startsWith('[')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

function unquote(value: string): string {
  const text = value.trim();
  if (
    (text.startsWith("'") && text.endsWith("'") && text.length >= 2) ||
    (text.startsWith('"') && text.endsWith('"') && text.length >= 2)
  ) {
    return text.slice(1, -1);
  }
  return text;
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

function uniqueHttp(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const href = safeHttp(value);
    if (!href || seen.has(href)) continue;
    seen.add(href);
    out.push(href);
  }
  return out;
}

export function safeHttp(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
  } catch {
    return null;
  }
  return null;
}

function formatUtc(raw: string): string | null {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const month = MONTHS[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${month} ${day}, ${year}, ${hour12}:${minutes} ${suffix} UTC`;
}
