export type StoryImageFields = {
  image?: unknown;
  imageAlt?: unknown;
  imageCredit?: unknown;
  imageLicense?: unknown;
  imageSourceUrl?: unknown;
};

export type StoryImage = {
  src: string;
  alt: string;
  credit: string | null;
  license: string | null;
  sourceUrl: string | null;
};

export type CoverTone = 'debunk' | 'confirmation' | 'mixed' | 'neutral';

function asText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

export function storyImageSrc(value: string | null): string | null {
  if (!value) return null;
  if (/^https:\/\//i.test(value)) return value;
  if (value.startsWith('/stories/img/')) return value;
  const file = value.replace(/^\/+/, '').replace(/^stories\/img\//, '').replace(/^img\//, '');
  if (!file || file.includes('..') || file.includes('\\')) return null;
  return `/stories/img/${file}`;
}

export function resolveStoryImage(...sources: Array<StoryImageFields | null | undefined>): StoryImage | null {
  for (const source of sources) {
    if (!source) continue;
    const src = storyImageSrc(asText(source.image));
    if (!src) continue;
    const sourceUrl = asText(source.imageSourceUrl);
    return {
      src,
      alt: asText(source.imageAlt) || 'Story image',
      credit: asText(source.imageCredit),
      license: asText(source.imageLicense),
      sourceUrl: sourceUrl && /^https:\/\//i.test(sourceUrl) ? sourceUrl : null,
    };
  }
  return null;
}

export function coverTone(eventType: string | null | undefined, verdictType: string | null | undefined): CoverTone {
  const verdict = (verdictType || '').toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (verdict === 'debunk') return 'debunk';
  if (verdict === 'confirmation') return 'confirmation';
  if (verdict === 'mixed') return 'mixed';
  return 'neutral';
}

export function coverLabel(eventType: string | null | undefined, verdictType: string | null | undefined): string {
  const tone = coverTone(eventType, verdictType);
  if (tone === 'debunk') return 'Debunked';
  if (tone === 'confirmation') return 'Confirmed';
  if (tone === 'mixed') return 'Mixed';
  const kind = (eventType || 'story').replace(/[_-]+/g, ' ').trim();
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function coverSeed(slug: string): number {
  let hash = 0;
  for (const char of slug) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash;
}
