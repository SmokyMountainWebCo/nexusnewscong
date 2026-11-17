import { parseStoryMarkdown } from './content.ts';

export type SearchEntry = {
  title: string;
  slug: string;
  room: string;
  summary: string;
  tags: string[];
  date: string | null;
  href: string;
};

export type HistoryVersion = {
  sha: string;
  at: string;
  title: string;
  body: string;
  updateNote: string | null;
  updated: string | null;
};

export type HistoryFile = {
  slug: string;
  versions: HistoryVersion[];
};

export function roomFor(eventType: string | null | undefined, tags: string[]): string {
  const kind = (eventType || '').toLowerCase().replace(/[_-]+/g, ' ');
  const normalized = tags.map((tag) => tag.toLowerCase().replace(/[_-]+/g, ' '));
  if (kind === 'fact check' || normalized.includes('fact check') || normalized.includes('conspiracy')) return 'conspiracy';
  if (kind === 'market' || kind === 'market movers' || normalized.includes('market')) return 'markets';
  return 'press';
}

export function searchEntry(input: {
  title: string;
  slug: string;
  eventType?: string | null;
  summary?: string | null;
  tags?: string[];
  date?: string | null;
}): SearchEntry {
  return {
    title: input.title,
    slug: input.slug,
    room: roomFor(input.eventType, input.tags || []),
    summary: input.summary || '',
    tags: input.tags || [],
    date: input.date || null,
    href: `/press/${input.slug}/`,
  };
}

export function scoreSearch(entry: SearchEntry, rawQuery: string): number {
  const query = rawQuery.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!query) return 0;
  const tokens = query.split(/\s+/).filter((token) => token.length > 1);
  if (!tokens.length) return 0;
  const fields: Array<[string, number]> = [
    [entry.title, 6],
    [entry.tags.join(' '), 4],
    [entry.slug.replace(/-/g, ' '), 3],
    [entry.summary, 2],
    [entry.room, 1],
  ];
  let score = 0;
  for (const token of tokens) {
    for (const [text, weight] of fields) {
      const hay = text.toLowerCase();
      if (hay.includes(token)) score += weight;
    }
  }
  if (`${entry.title} ${entry.summary}`.toLowerCase().includes(query)) score += 4;
  return score;
}

export function rankSearch(entries: SearchEntry[], query: string): SearchEntry[] {
  return entries
    .map((entry) => ({ entry, score: scoreSearch(entry, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, 8)
    .map((item) => item.entry);
}

export function versionFromMarkdown(sha: string, at: string, raw: string): HistoryVersion {
  const doc = parseStoryMarkdown(raw);
  const title = doc.title || firstHeading(doc.body) || 'Untitled';
  return {
    sha,
    at,
    title,
    body: doc.body,
    updateNote: doc.updateNote,
    updated: doc.updated,
  };
}

export function versionsFromSnapshots(snapshots: Array<{ sha: string; at: string; raw: string }>): HistoryVersion[] {
  const chronological = [...snapshots].sort((a, b) => a.at.localeCompare(b.at));
  const versions: HistoryVersion[] = [];
  for (const snapshot of chronological) {
    if (!snapshot.raw.trim()) continue;
    const version = versionFromMarkdown(snapshot.sha, snapshot.at, snapshot.raw);
    const previous = versions[versions.length - 1];
    if (previous && previous.title === version.title && previous.body === version.body && previous.updateNote === version.updateNote) {
      continue;
    }
    versions.push(version);
  }
  return versions;
}

export function changedParagraphs(selected: string, current: string): string[] {
  const currentSet = new Set(paragraphs(current));
  return paragraphs(selected).filter((paragraph) => !currentSet.has(paragraph));
}

export function severityStep(score: number | null | undefined, eventType: string | null | undefined, verdict: string | null | undefined): number | null {
  const kind = (eventType || '').toLowerCase().replace(/[_-]+/g, ' ');
  const ruling = (verdict || '').toLowerCase();
  if (kind === 'fact check' || ruling === 'debunk' || ruling === 'confirmation' || ruling === 'mixed') return null;
  if (score == null || !Number.isFinite(score)) return null;
  const clamped = Math.max(1, Math.min(10, score));
  return Math.min(5, Math.max(1, Math.ceil(clamped / 2)));
}

export function headlineWeight(step: number | null): number {
  if (step == null) return 560;
  return 460 + step * 60;
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function firstHeading(body: string): string | null {
  const match = body.match(/^#{1,6}\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
