export type StoryCard = {
  slug: string;
  title: string;
  summary: string | null;
  location: string | null;
  eventType: string | null;
  alertLevel: string | null;
  path: string;
};

export type StoryPoint = { lat: number; lon: number };

export function coordinatesFromLocation(location: string | null | undefined): StoryPoint | null {
  if (!location) return null;
  const match = location.match(/(\d+(?:\.\d+)?)\s*°?\s*([NS])\b[\s,;/]*(\d+(?:\.\d+)?)\s*°?\s*([EW])\b/i);
  if (!match) return null;
  let lat = Number(match[1]);
  let lon = Number(match[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (match[2].toUpperCase() === 'S') lat = -lat;
  if (match[4].toUpperCase() === 'W') lon = -lon;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

export function parseStoryIndex(data: unknown): StoryCard[] {
  if (!data || typeof data !== 'object') return [];
  const rows = (data as { stories?: unknown }).stories;
  if (!Array.isArray(rows)) return [];
  const stories: StoryCard[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const slug = typeof item.slug === 'string' ? item.slug : '';
    const title = typeof item.title === 'string' ? item.title : '';
    if (!slug || !title) continue;
    const explicit = typeof item.path === 'string' ? item.path : '';
    stories.push({
      slug,
      title,
      summary: typeof item.summary === 'string' ? item.summary : null,
      location: typeof item.location === 'string' ? item.location : null,
      eventType: typeof item.event_type === 'string' ? item.event_type : null,
      alertLevel: typeof item.alert_level === 'string' ? item.alert_level : null,
      path: explicit || `/stories/${slug}.md`,
    });
  }
  return stories;
}

export function layersForEvent(eventType: string | null): string[] {
  const kind = (eventType || '').toLowerCase();
  if (kind.includes('cyclone') || kind.includes('storm')) return ['weather-cyclones'];
  if (kind.includes('earthquake')) return ['earthquakes'];
  if (kind.includes('fire')) return ['local-firms', 'fire-perimeters'];
  if (kind.includes('flood')) return ['weather-radar'];
  return ['flights', 'ais-live-vessels', 'earthquakes'];
}
