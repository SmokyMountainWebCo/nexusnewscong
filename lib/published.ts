import fs from 'fs';
import path from 'path';
import { isPublished, parseStoryIndex, parseStoryMarkdown, type StoryCard, type StoryDoc } from './content.ts';
import { parseBriefsFile, parseClaimsFile, parseSearchIndex, parseSourcesFile, type Claim, type SearchStory, type SourcePack } from './desk.ts';

export type LoadedStory = { card: StoryCard; doc: StoryDoc | null; missing: boolean };

export function storyFromSearch(story: SearchStory): LoadedStory {
  return {
    missing: false,
    card: {
      slug: story.slug,
      title: story.title,
      date: null,
      timestamp: story.timestamp,
      eventType: story.eventType,
      alertLevel: story.alertLevel,
      alertNote: null,
      summary: null,
      path: `/stories/${story.slug}.md`,
      tags: story.tags,
      updated: story.updated,
      updateNote: story.updateNote,
      location: story.location,
      confidence: story.confidence,
      conclusions: story.conclusions,
      canaries: story.canaries,
      developing: story.developing,
      asOf: story.asOf,
      trail: story.trail,
      image: story.image,
      imageAlt: story.imageAlt,
      imageCredit: story.imageCredit,
      imageLicense: story.imageLicense,
      imageSourceUrl: story.imageSourceUrl,
      related: story.related,
    },
    doc: {
      title: story.title,
      status: 'published',
      alertLevel: story.alertLevel,
      alertNote: null,
      severity: story.severity,
      eventType: story.eventType,
      date: null,
      timestamp: story.timestamp,
      location: story.location,
      locations: story.location ? [story.location] : [],
      sources: story.sourceUrls,
      tags: story.tags,
      briefId: null,
      updated: story.updated,
      updateNote: story.updateNote,
      confidence: story.confidence,
      conclusions: story.conclusions,
      canaries: story.canaries,
      developing: story.developing,
      asOf: story.asOf,
      trail: story.trail,
      image: story.image,
      imageAlt: story.imageAlt,
      imageCredit: story.imageCredit,
      imageLicense: story.imageLicense,
      imageSourceUrl: story.imageSourceUrl,
      related: story.related,
      body: story.body,
    },
  };
}

function readJson(relative: string): unknown | null {
  const file = path.join(/*turbopackIgnore: true*/ process.cwd(), relative);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function loadStories(): { generatedAt: string | null; stories: LoadedStory[] } {
  const parsed = parseStoryIndex(readJson('public/stories/index.json'));
  const stories = parsed.stories
    .map((card) => {
      const file = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', card.path.replace(/^\//, ''));
      if (!fs.existsSync(file)) return { card, doc: null, missing: true };
      return { card, doc: parseStoryMarkdown(fs.readFileSync(file, 'utf8')), missing: false };
    })
    .filter((story) => story.missing || isPublished(story.doc));
  return { generatedAt: parsed.generatedAt, stories };
}

export function loadSearch(): SearchStory[] {
  return parseSearchIndex(readJson('public/stories/search.json'));
}

export function loadClaims(): Claim[] {
  return parseClaimsFile(readJson('public/kb/claims.json')).claims;
}

export function loadBriefs(): Record<string, string[]> {
  return parseBriefsFile(readJson('public/stories/briefs.json'));
}

export function loadSourcePacks(): Record<string, SourcePack> {
  return parseSourcesFile(readJson('public/stories/sources.json'));
}
