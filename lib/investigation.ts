import { formatDeskDate } from './content.ts';

// Investigation layout fields. Compliance may publish them on the markdown
// front-matter, on public/stories/index.json, or on public/stories/search.json.
// Missing confidence and canaries leave the normal story layout in place.

export type ConfidenceTone = 'low' | 'medium' | 'high' | 'other';

export type Conclusion = {
  text: string;
  tone: ConfidenceTone | null;
  label: string | null;
};

export type SourcePiece = {
  text: string;
  href: string | null;
};

export type Canary = {
  indicator: string;
  when: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  sourceParts: SourcePiece[];
};

export type InvestigationSection = {
  id: 'surface' | 'evidence' | 'benefits' | 'omission' | 'bottom';
  title: string;
  body: string;
};

export type InvestigationView = {
  active: boolean;
  developing: boolean;
  asOf: string | null;
  storyTone: ConfidenceTone | null;
  storyLabel: string | null;
  conclusions: Conclusion[];
  canaries: Canary[];
  intro: string;
  sections: InvestigationSection[];
};

type FieldSource = {
  confidence?: unknown;
  conclusions?: unknown;
  canaries?: unknown;
  body?: string | null;
  developing?: unknown;
  asOf?: unknown;
} | null | undefined;

export function confidenceTone(value: string | null | undefined): ConfidenceTone | null {
  const text = (value || '').trim().toLowerCase();
  if (text === 'low') return 'low';
  if (text === 'medium') return 'medium';
  if (text === 'high') return 'high';
  if (!text) return null;
  return 'other';
}

export function confidenceLabel(value: string | null | undefined): string | null {
  const tone = confidenceTone(value);
  if (tone === 'low') return 'Low';
  if (tone === 'medium') return 'Medium';
  if (tone === 'high') return 'High';
  const raw = (value || '').trim();
  return raw || null;
}

function asText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asText).filter((item): item is string => Boolean(item));
  const one = asText(value);
  return one ? [one] : [];
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

function firstFilled(...values: unknown[]): unknown {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    return value;
  }
  return null;
}

function conclusionFromObject(value: Record<string, unknown>): Conclusion | null {
  const text = asText(value.conclusion) || asText(value.text) || asText(value.claim);
  const level = asText(value.level) || asText(value.confidence) || asText(value.rating);
  if (!text && !level) return null;
  return { text: text || '', tone: confidenceTone(level), label: confidenceLabel(level) };
}

const ISO_TIME = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)$/;

function formatEastern(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h12',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return `${pick('month')} ${pick('day')}, ${pick('year')}, ${pick('hour')}:${pick('minute')} ${pick('dayPeriod')} ET`;
}

export function displayAsOf(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const text = raw.trim();
  const noted = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)\s*\(([^)]+)\)\s*$/.exec(text);
  if (noted) return noted[2].trim();
  if (ISO_TIME.test(text)) return formatEastern(text) || text;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return formatDeskDate(text) || text;
  return text;
}

const CONFIDENCE_BULLET = /^\s*[-*+]\s+(?:\*\*|__)?\s*(high|medium|low)\s+confidence\b/i;

/** Drop section bullets that only restate a front-matter confidence level. */
export function splitConfidenceBullets(source: string): { before: string; after: string; removed: boolean } {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let first = -1;
  let last = -1;
  lines.forEach((line, index) => {
    if (!CONFIDENCE_BULLET.test(line)) return;
    if (first < 0) first = index;
    last = index;
  });
  if (first < 0) return { before: source.trim(), after: '', removed: false };
  return {
    before: lines.slice(0, first).join('\n').trim(),
    after: lines.slice(last + 1).join('\n').trim(),
    removed: true,
  };
}

function asFlag(value: unknown): boolean {
  if (value === true) return true;
  const text = asText(value);
  return text === 'true' || text === 'yes' || text === '1';
}

export function parseConclusions(conclusions: unknown, confidence: unknown): { story: Conclusion | null; items: Conclusion[] } {
  if (Array.isArray(confidence) && confidence.some((item) => item && typeof item === 'object')) {
    const texts = stringList(conclusions);
    const items = confidence
      .map((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const parsed = conclusionFromObject(item as Record<string, unknown>);
          if (!parsed) return null;
          return { ...parsed, text: parsed.text || texts[index] || '' };
        }
        const level = asText(item);
        if (!level && !texts[index]) return null;
        return {
          text: texts[index] || '',
          tone: confidenceTone(level),
          label: confidenceLabel(level),
        };
      })
      .filter((item): item is Conclusion => Boolean(item));
    return { story: null, items };
  }
  const texts = stringList(conclusions);
  const levels = Array.isArray(confidence) ? confidence.map(asText).filter((item): item is string => Boolean(item)) : [];
  const single = !Array.isArray(confidence) ? asText(confidence) : null;
  if (!texts.length && levels.length === 0) {
    return {
      story: single ? { text: '', tone: confidenceTone(single), label: confidenceLabel(single) } : null,
      items: [],
    };
  }
  if (!texts.length && levels.length) {
    return {
      story: null,
      items: levels.map((level) => ({ text: '', tone: confidenceTone(level), label: confidenceLabel(level) })),
    };
  }
  const labels = levels.length ? levels : single ? texts.map(() => single) : [];
  return {
    story: null,
    items: texts.map((text, index) => {
      const label = labels[index] ?? null;
      return { text, tone: confidenceTone(label), label: confidenceLabel(label) };
    }),
  };
}

function whenFromText(value: string): string | null {
  const range = value.match(/\b(\d{4}-\d{2}-\d{2})\s*(?:to|–|—|\/)\s*(\d{4}-\d{2}-\d{2})\b/);
  if (range) return `${range[1]} to ${range[2]}`;
  const day = value.match(/\b\d{4}-\d{2}-\d{2}(?:T[0-9:.Z+-]+)?\b/);
  if (day) return day[0];
  const window = value.match(/\b\d{1,3}\s*[–-]\s*\d{1,3}\s*days\b/i);
  return window ? window[0] : null;
}

function urlFromText(value: string): string | null {
  const match = value.match(/https?:\/\/[^\s)]+/i);
  return match ? safeHttp(match[0].replace(/[.,;]+$/, '')) : null;
}

function linkedHref(token: string): string | null {
  const cleaned = token.replace(/[.,)]+$/, '');
  const bare = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?$/i.test(cleaned);
  const href = /^https?:\/\//i.test(cleaned) ? safeHttp(cleaned) : bare ? safeHttp(`https://${cleaned}`) : null;
  if (!href) return null;
  const pathless = !/^(?:https?:\/\/)?[^/\s]+\/./.test(cleaned);
  return pathless && href.endsWith('/') ? href.slice(0, -1) : href;
}

/** Split a source line into text and links. Bare domains and paths gain https://. */
export function sourcePieces(raw: string): SourcePiece[] {
  const pieces: SourcePiece[] = [];
  const segments = raw.split(';');
  segments.forEach((segment, index) => {
    if (index > 0) pieces.push({ text: '; ', href: null });
    const re = /(?:https?:\/\/[^\s;]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s;]*)?)/gi;
    let last = 0;
    for (const match of segment.matchAll(re)) {
      const at = match.index ?? 0;
      if (at > last) pieces.push({ text: segment.slice(last, at), href: null });
      const href = linkedHref(match[0]);
      const text = match[0].replace(/[.,)]+$/, '');
      pieces.push(href ? { text, href } : { text: match[0], href: null });
      last = at + match[0].length;
    }
    if (last < segment.length) pieces.push({ text: segment.slice(last), href: null });
  });
  return pieces.filter((piece) => piece.text.length > 0);
}

export function parseCanary(value: unknown): Canary | null {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const parts = text.split(/\s+\|\s+/).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const source = parts[parts.length - 1];
      const when = parts.length >= 3 ? parts[parts.length - 2] : whenFromText(parts[1]);
      const indicator = parts.slice(0, parts.length >= 3 ? -2 : -1).join(' | ') || parts[0];
      const pieces = sourcePieces(source);
      const url = pieces.find((piece) => piece.href)?.href || safeHttp(source) || urlFromText(source);
      return {
        indicator,
        when: when || null,
        sourceUrl: url,
        sourceLabel: url ? source.replace(url, '').trim() || null : source,
        sourceParts: pieces,
      };
    }
    const url = urlFromText(text);
    return {
      indicator: url ? text.replace(url, '').replace(/[|–—-]\s*$/, '').trim() || text : text,
      when: whenFromText(text),
      sourceUrl: url,
      sourceLabel: null,
      sourceParts: url ? sourcePieces(text) : [],
    };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const when = asText(item.window) || asText(item.when) || asText(item.date) || asText(item.time) || asText(item.as_of) || asText(item.timeframe);
  const source = item.source && typeof item.source === 'object' && !Array.isArray(item.source) ? (item.source as Record<string, unknown>) : null;
  const sourceText = asText(item.source) || asText(source?.url) || asText(source?.label) || asText(source?.name);
  const explicitUrl = safeHttp(asText(item.url) || asText(item.href) || asText(item.source_url) || asText(source?.url));
  const pieces = sourceText ? sourcePieces(sourceText) : [];
  const sourceUrl = explicitUrl || pieces.find((piece) => piece.href)?.href || null;
  const sourceLabel = asText(item.label) || asText(item.source_label) || asText(source?.label) || asText(source?.name) || (sourceUrl && sourceText === sourceUrl ? null : sourceText);
  const indicator = asText(item.indicator) || asText(item.text) || asText(item.watch) || asText(item.signal) || asText(item.name) || when || sourceLabel || sourceText;
  if (!indicator) return null;
  const parts = pieces.length ? pieces : sourceLabel ? [{ text: sourceLabel, href: null }] : [];
  return { indicator, when, sourceUrl, sourceLabel, sourceParts: parts };
}

export function parseCanaries(value: unknown): Canary[] {
  if (!Array.isArray(value)) {
    const one = parseCanary(value);
    return one ? [one] : [];
  }
  return value.map(parseCanary).filter((item): item is Canary => Boolean(item));
}

function sectionId(heading: string): InvestigationSection['id'] | null {
  const text = heading.trim().toLowerCase().replace(/[.:]+$/g, '');
  const numbered = /^(\d+)\s*[.)]\s*(.*)$/.exec(text);
  const number = numbered ? Number(numbered[1]) : null;
  const rest = (numbered ? numbered[2] : text).trim();
  if (number === 1 || /\bsurface\b/.test(rest)) return 'surface';
  if (number === 2 || /\brecords\b/.test(rest) || /\bevidence\b/.test(rest)) return 'evidence';
  if (number === 3 || /\bstake\b/.test(rest) || /\bbenefit/.test(rest) || /cui bono/.test(rest)) return 'benefits';
  if (number === 4 || /\bmissing\b/.test(rest) || /\bomission\b/.test(rest) || /leaving out/.test(rest)) return 'omission';
  if (number === 5 || /\bconclusion/.test(rest) || /bottom line/.test(rest)) return 'bottom';
  return null;
}

export function splitInvestigationSections(body: string): { intro: string; sections: InvestigationSection[] } {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const intro: string[] = [];
  const sections: InvestigationSection[] = [];
  let current: { id: InvestigationSection['id']; title: string; lines: string[] } | null = null;
  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    const id = heading ? sectionId(heading[2]) : null;
    if (id) {
      if (current) sections.push({ id: current.id, title: current.title, body: current.lines.join('\n').trim() });
      current = { id, title: (heading?.[2] || '').trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
    else intro.push(line);
  }
  if (current) sections.push({ id: current.id, title: current.title, body: current.lines.join('\n').trim() });
  return { intro: intro.join('\n').trim(), sections };
}

export function resolveInvestigation(...sources: FieldSource[]): InvestigationView {
  const confidence = firstFilled(...sources.map((source) => source?.confidence));
  const conclusions = firstFilled(...sources.map((source) => source?.conclusions));
  const canaries = firstFilled(...sources.map((source) => source?.canaries));
  const body = sources.map((source) => source?.body).find((value) => typeof value === 'string' && value.trim()) || '';
  const asOfRaw = sources.map((source) => asText(source?.asOf)).find((value) => Boolean(value)) || null;
  const parsed = parseConclusions(conclusions, confidence);
  const items = parseCanaries(canaries);
  const split = splitInvestigationSections(body);
  const developing = sources.some((source) => asFlag(source?.developing));
  const active = Boolean(parsed.story || parsed.items.length || items.length);
  return {
    active: active || split.sections.length > 0 || developing,
    developing,
    asOf: displayAsOf(asOfRaw),
    storyTone: parsed.story?.tone ?? null,
    storyLabel: parsed.story?.label ?? null,
    conclusions: parsed.items,
    canaries: items,
    intro: split.intro,
    sections: split.sections,
  };
}
