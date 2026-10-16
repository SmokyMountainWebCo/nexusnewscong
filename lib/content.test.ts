import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  bandFromSeverity,
  eventWindowFromBotNote,
  feedUnavailableLabel,
  isPublished,
  parseLayerCollection,
  parseMarkdown,
  parseStoryIndex,
  parseStoryMarkdown,
  storyBadge,
  stripMatchingHeading,
  updatedLabel,
} from './content.ts';

const root = process.cwd();
const index = JSON.parse(fs.readFileSync(path.join(root, 'public/stories/index.json'), 'utf8'));
const parsedIndex = parseStoryIndex(index);
const botswanaCard = parsedIndex.stories.find((story) => story.slug === 'botswana-mozambique-forest-fires-oct-2026');
assert.ok(botswanaCard);
assert.equal(botswanaCard.path, '/stories/botswana-mozambique-forest-fires-oct-2026.md');
assert.match(botswanaCard.alertLevel || '', /Green/);

const raw = fs.readFileSync(
  path.join(root, 'public/stories/botswana-mozambique-forest-fires-oct-2026.md'),
  'utf8'
);
const doc = parseStoryMarkdown(raw);
assert.equal(isPublished(doc), true);
assert.ok(doc.sources.length >= 5);
assert.match(doc.body, /Botswana/);
assert.equal(storyBadge(doc.alertLevel, doc.severity).band, 'green');
assert.match(storyBadge(doc.alertLevel, null).label, /Green/);
assert.equal(storyBadge(null, 4).label, 'Orange');
assert.equal(storyBadge(null, 2).band, 'green');
assert.equal(storyBadge(null, 8).band, 'red');
assert.equal(storyBadge(null, null).label, 'Unrated');
const stripped = stripMatchingHeading(doc.body, doc.title);
assert.equal(stripped.startsWith('#'), false);
const blocks = parseMarkdown(stripped);
assert.ok(blocks.some((block) => block.t === 'p'));

const conflict = parseLayerCollection(
  JSON.parse(fs.readFileSync(path.join(root, 'public/layers/conflict_events.geojson'), 'utf8')),
  'conflict'
);
assert.equal(conflict.broken, false);
assert.equal(conflict.events.length, 0);
assert.equal(conflict.feedStatus, 'unavailable');
assert.equal(feedUnavailableLabel('Conflict'), 'Conflict feed temporarily unavailable');

const disaster = parseLayerCollection(
  JSON.parse(fs.readFileSync(path.join(root, 'public/layers/disaster_events.geojson'), 'utf8')),
  'disaster'
);
assert.equal(disaster.events.length, 13);
assert.equal(disaster.feedStatus, 'ok');
assert.equal(feedUnavailableLabel('Disaster'), 'Disaster feed temporarily unavailable');
assert.ok(disaster.events.every((event) => event.eventWindow));
const orange = disaster.events.find((event) => event.severity === 4);
assert.equal(orange?.band, 'orange');
assert.match(orange?.eventWindow || '', /Oct 7, 2026/);
const green = disaster.events.find((event) => event.severity === 2);
assert.equal(green?.band, 'green');
assert.equal(bandFromSeverity(3), 'green');
assert.equal(bandFromSeverity(6), 'orange');
assert.equal(bandFromSeverity(7), 'red');
assert.equal(bandFromSeverity(null), 'unknown');
assert.equal(bandFromSeverity(0), 'unknown');

const missing = parseLayerCollection(
  {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: null, properties: { id: 'x', summary: 'no geometry' } },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10, 20] },
        properties: { severity_score: '5', source_url: 'javascript:alert(1)', verified: false },
      },
    ],
  },
  'disaster'
);
assert.equal(missing.skipped, 1);
assert.equal(missing.events.length, 1);
assert.equal(missing.events[0].band, 'orange');
assert.equal(missing.events[0].sourceUrl, null);
assert.equal(missing.events[0].verified, false);
assert.equal(missing.events[0].summary, null);
assert.equal(missing.events[0].eventWindow, null);
assert.equal(missing.feedStatus, 'ok');

const okEmpty = parseLayerCollection({ type: 'FeatureCollection', feed_status: 'ok', features: [] }, 'conflict');
assert.equal(okEmpty.feedStatus, 'ok');
assert.equal(okEmpty.events.length, 0);

const metadataOnly = parseLayerCollection(
  { type: 'FeatureCollection', metadata: { feed_status: 'unavailable' }, features: [] },
  'disaster'
);
assert.equal(metadataOnly.feedStatus, 'unavailable');

const mirrored = parseLayerCollection(
  {
    type: 'FeatureCollection',
    feed_status: 'unavailable',
    metadata: { feed_status: 'unavailable' },
    features: [],
  },
  'conflict'
);
assert.equal(mirrored.feedStatus, 'unavailable');

const otherValue = parseLayerCollection({ type: 'FeatureCollection', feed_status: 'down', features: [] }, 'conflict');
assert.equal(otherValue.feedStatus, 'ok');

const draft = parseStoryMarkdown('---\nstatus: draft\ntitle: Hidden\n---\n\nSecret');
assert.equal(isPublished(draft), false);
const later = parseStoryMarkdown('---\ntitle: Waiting on status\nseverity: 9\n---\n\nBody');
assert.equal(isPublished(later), true);
assert.equal(storyBadge(later.alertLevel, later.severity).label, 'Red');

const corrected = parseStoryMarkdown(`---
title: Corrected
status: published
updated: 2026-10-16T18:30:00Z
update_note: Burned area revised after a later pass.
alert_note: Stays Green because expected impact is still low.
---

Body`);
assert.equal(corrected.updated, '2026-10-16T18:30:00Z');
assert.equal(corrected.updateNote, 'Burned area revised after a later pass.');
assert.equal(corrected.alertNote, 'Stays Green because expected impact is still low.');
assert.equal(updatedLabel(corrected.updated), 'Updated Oct 16, 2026, 6:30 PM UTC');
assert.equal(updatedLabel(null), null);

const indexed = parseStoryIndex({
  stories: [
    {
      slug: 'corrected',
      title: 'Corrected',
      path: '/stories/corrected.md',
      updated: '2026-10-16T18:30:00Z',
      update_note: 'Index note',
      alert_note: 'Index alert note',
    },
  ],
});
assert.equal(indexed.stories[0].updateNote, 'Index note');
assert.equal(indexed.stories[0].alertNote, 'Index alert note');
assert.equal(doc.updated, '2026-10-16T16:23:00Z');
assert.match(doc.updateNote || '', /Zambezia/);
assert.equal(doc.alertNote, null);

console.log('content checks passed');
