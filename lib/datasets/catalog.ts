/**
 * Real story datasets already shipped under public/.
 * There are no CSV, Parquet, or Arrow files in public/ today.
 * This list is the inventory — do not invent additional data files.
 */
export type DatasetFormat = 'json';

export type PublicDataset = {
  path: string;
  file: string;
  format: DatasetFormat;
  description: string;
};

export const PUBLIC_DATASETS: PublicDataset[] = [
  { path: '/stories/index.json', file: 'public/stories/index.json', format: 'json', description: 'Published story index' },
  { path: '/stories/search.json', file: 'public/stories/search.json', format: 'json', description: 'Ask Nexus search index' },
  { path: '/search-index.json', file: 'public/search-index.json', format: 'json', description: 'Command palette search index' },
  { path: '/stories/sources.json', file: 'public/stories/sources.json', format: 'json', description: 'Source packs' },
  { path: '/stories/briefs.json', file: 'public/stories/briefs.json', format: 'json', description: 'Briefs filed to stories' },
  { path: '/kb/claims.json', file: 'public/kb/claims.json', format: 'json', description: 'Knowledge-base claims' },
];

/** Revision histories shipped as JSON under public/stories/history/. Not invented. */
export const HISTORY_DIR = 'public/stories/history';

/** Count published stories from the already-shipped index shape. */
export function countStoriesInIndex(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const rows = (data as { stories?: unknown }).stories;
  return Array.isArray(rows) ? rows.length : null;
}

export const STORY_COUNT_SQL = `SELECT CAST(json_array_length(stories) AS INTEGER) AS n FROM index_json`;
