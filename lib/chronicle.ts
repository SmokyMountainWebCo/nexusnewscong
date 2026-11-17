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

function sameStoryContent(left: HistoryVersion, right: HistoryVersion): boolean {
  return left.title === right.title && left.body === right.body && left.updateNote === right.updateNote;
}

export function collapseIdenticalVersions(versions: HistoryVersion[]): HistoryVersion[] {
  const sorted = [...versions].sort((left, right) => left.at.localeCompare(right.at) || left.sha.localeCompare(right.sha));
  const kept: HistoryVersion[] = [];
  for (const version of sorted) {
    const previous = kept[kept.length - 1];
    if (previous && sameStoryContent(previous, version)) continue;
    kept.push(version);
  }
  return kept;
}

export function mergeHistory(committed: HistoryVersion[], fromGit: HistoryVersion[]): HistoryVersion[] {
  const bySha = new Map<string, HistoryVersion>();
  for (const version of committed) bySha.set(version.sha, version);
  for (const version of fromGit) bySha.set(version.sha, version);
  return collapseIdenticalVersions([...bySha.values()]);
}

/** Keep committed revisions when git is missing, shallow, or shorter. Never invent versions. */
export function decideHistory(input: {
  repo: boolean;
  committed: HistoryVersion[] | null;
  fromGit: HistoryVersion[];
  current: HistoryVersion | null;
}): { write: boolean; versions: HistoryVersion[] } {
  const committed = input.committed ?? [];
  if (!input.repo || !input.fromGit.length) {
    if (committed.length) return { write: false, versions: committed };
    return { write: Boolean(input.current), versions: input.current ? [input.current] : [] };
  }
  const merged = mergeHistory(committed, input.fromGit);
  if (!committed.length) return { write: true, versions: merged };
  const same = committed.length === merged.length && committed.every((version, index) => version.sha === merged[index].sha);
  if (same) return { write: false, versions: committed };
  return { write: true, versions: merged };
}

export function versionsFromSnapshots(snapshots: Array<{ sha: string; at: string; raw: string }>): HistoryVersion[] {
  const chronological = [...snapshots].sort((a, b) => a.at.localeCompare(b.at));
  const versions: HistoryVersion[] = [];
  for (const snapshot of chronological) {
    if (!snapshot.raw.trim()) continue;
    const version = versionFromMarkdown(snapshot.sha, snapshot.at, snapshot.raw);
    const previous = versions[versions.length - 1];
    if (previous && sameStoryContent(previous, version)) continue;
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
