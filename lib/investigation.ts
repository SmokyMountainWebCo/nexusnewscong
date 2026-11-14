// Investigation layout fields. Compliance may publish them on the markdown
// front-matter, on public/stories/index.json, or on public/stories/search.json.
// Missing confidence and canaries leave the normal story layout in place.

export type ConfidenceTone = 'low' | 'medium' | 'high' | 'other';

export type Conclusion = {
  text: string;
  tone: ConfidenceTone | null;
  label: string | null;
};

export type Canary = {
  indicator: string;
  when: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
};

export type InvestigationSection = {
  id: 'surface' | 'evidence' | 'benefits' | 'omission' | 'bottom';
  title: string;
  body: string;
};

export type InvestigationView = {
  active: boolean;
  storyTone: ConfidenceTone | null;
  storyLabel: string | null;
  conclusions: Conclusion[];
  canaries: Canary[];
  intro: string;
  sections: InvestigationSection[];
};

const SECTION_TITLES: Record<InvestigationSection['id'], string> = {
  surface: 'Surface narrative',
  evidence: 'Primary evidence',
  benefits: 'Who benefits',
  omission: 'What coverage is leaving out',
  bottom: 'Bottom line / conclusions',
};

type FieldSource = {
  confidence?: unknown;
  conclusions?: unknown;
  canaries?: unknown;
  body?: string | null;
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

export function parseConclusions(conclusions: unknown, confidence: unknown): { story: Conclusion | null; items: Conclusion[] } {
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

export function parseCanary(value: unknown): Canary | null {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const parts = text.split(/\s+\|\s+/).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const source = parts[parts.length - 1];
      const when = parts.length >= 3 ? parts[parts.length - 2] : whenFromText(parts[1]);
      const indicator = parts.slice(0, parts.length >= 3 ? -2 : -1).join(' | ') || parts[0];
      const url = safeHttp(source) || urlFromText(source);
      return {
        indicator,
        when: when || null,
        sourceUrl: url,
        sourceLabel: url ? source.replace(url, '').trim() || null : source,
      };
    }
    const url = urlFromText(text);
    return {
      indicator: url ? text.replace(url, '').replace(/[|–—-]\s*$/, '').trim() || text : text,
      when: whenFromText(text),
      sourceUrl: url,
      sourceLabel: null,
    };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const indicator = asText(item.indicator) || asText(item.text) || asText(item.watch) || asText(item.signal) || asText(item.name);
  if (!indicator) return null;
  const when = asText(item.window) || asText(item.when) || asText(item.date) || asText(item.time) || asText(item.as_of) || asText(item.timeframe);
  const source = item.source && typeof item.source === 'object' && !Array.isArray(item.source) ? (item.source as Record<string, unknown>) : null;
  const sourceUrl = safeHttp(asText(item.url) || asText(item.href) || asText(item.source_url) || asText(source?.url) || asText(item.source));
  const sourceLabel = asText(item.label) || asText(item.source_label) || asText(source?.label) || asText(source?.name) || (sourceUrl ? null : asText(item.source));
  return { indicator, when, sourceUrl, sourceLabel };
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
  if (text === 'surface narrative') return 'surface';
  if (text === 'primary evidence') return 'evidence';
  if (text === 'who benefits') return 'benefits';
  if (text === 'what coverage is leaving out') return 'omission';
  if (text === 'bottom line / conclusions' || text === 'bottom line' || text === 'conclusions') return 'bottom';
  return null;
}

export function splitInvestigationSections(body: string): { intro: string; sections: InvestigationSection[] } {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const intro: string[] = [];
  const sections: InvestigationSection[] = [];
  let current: { id: InvestigationSection['id']; lines: string[] } | null = null;
  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    const id = heading ? sectionId(heading[2]) : null;
    if (id) {
      if (current) sections.push({ id: current.id, title: SECTION_TITLES[current.id], body: current.lines.join('\n').trim() });
      current = { id, lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
    else intro.push(line);
  }
  if (current) sections.push({ id: current.id, title: SECTION_TITLES[current.id], body: current.lines.join('\n').trim() });
  return { intro: intro.join('\n').trim(), sections };
}

export function resolveInvestigation(...sources: FieldSource[]): InvestigationView {
  const confidence = firstFilled(...sources.map((source) => source?.confidence));
  const conclusions = firstFilled(...sources.map((source) => source?.conclusions));
  const canaries = firstFilled(...sources.map((source) => source?.canaries));
  const body = sources.map((source) => source?.body).find((value) => typeof value === 'string' && value.trim()) || '';
  const parsed = parseConclusions(conclusions, confidence);
  const items = parseCanaries(canaries);
  const split = splitInvestigationSections(body);
  const active = Boolean(parsed.story || parsed.items.length || items.length);
  return {
    active: active || split.sections.length > 0,
    storyTone: parsed.story?.tone ?? null,
    storyLabel: parsed.story?.label ?? null,
    conclusions: parsed.items,
    canaries: items,
    intro: split.intro,
    sections: split.sections,
  };
}
