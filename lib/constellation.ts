import type { RelatedItem } from './content.ts';

export type ConstellationNode = {
  slug: string;
  title: string;
  href: string;
  severity: number | null;
};

export type ConstellationEdge = {
  from: string;
  to: string;
  reason: string;
  strength: number | null;
};

export type ConstellationGraph = {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  /** True only when at least one editor-supplied `related` link points at a published story. */
  hasEditorLinks: boolean;
};

export type ConstellationStory = {
  slug: string;
  title: string;
  href?: string;
  severity?: number | null;
  related: RelatedItem[];
};

/**
 * Build the home-page constellation.
 * Edges come only from front-matter `related: [{ slug, reason, strength }]`.
 * Tags and entities are ignored. Links to unknown slugs are dropped.
 */
export function graphFromStories(stories: ConstellationStory[]): ConstellationGraph {
  const nodes: ConstellationNode[] = [];
  const slugs = new Set<string>();
  for (const story of stories) {
    if (!story.slug || !story.title) continue;
    if (slugs.has(story.slug)) continue;
    slugs.add(story.slug);
    nodes.push({
      slug: story.slug,
      title: story.title,
      href: story.href || `/press/${story.slug}/`,
      severity: story.severity ?? null,
    });
  }

  const edges: ConstellationEdge[] = [];
  const seen = new Set<string>();
  for (const story of stories) {
    if (!slugs.has(story.slug)) continue;
    for (const rel of story.related || []) {
      if (!rel?.slug || !slugs.has(rel.slug) || rel.slug === story.slug) continue;
      const key = `${story.slug}\0${rel.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        from: story.slug,
        to: rel.slug,
        reason: rel.reason,
        strength: rel.strength,
      });
    }
  }

  return { nodes, edges, hasEditorLinks: edges.length > 0 };
}

/** Deterministic unit-sphere placement so a given slug always sits in the same spot. */
export function nodePosition(slug: string, index: number, count: number): [number, number, number] {
  const n = Math.max(1, count);
  const i = index + 0.5;
  const y = 1 - (i / n) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = hashSlug(slug) * Math.PI * 2 + (index * 2.399963229728653);
  return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
}

function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    h = Math.imul(h ^ slug.charCodeAt(i), 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}
