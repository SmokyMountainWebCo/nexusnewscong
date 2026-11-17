import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseStoryMarkdown } from './content.ts';
import { coverLabel, coverTone, resolveStoryImage, storyImageSrc } from './images.ts';

assert.equal(storyImageSrc('img/tower.jpg'), '/stories/img/tower.jpg');
assert.equal(storyImageSrc('/stories/img/tower.jpg'), '/stories/img/tower.jpg');
assert.equal(storyImageSrc('https://example.com/a.jpg'), 'https://example.com/a.jpg');
assert.equal(storyImageSrc('../secret.jpg'), null);
assert.equal(resolveStoryImage(null, { image: null }, {}), null);

const faa = parseStoryMarkdown(
  fs.readFileSync(path.join(process.cwd(), 'public/stories/faa-nationwide-ground-stop-telecom-outage-nov-2026.md'), 'utf8'),
);
const faaImage = resolveStoryImage(faa);
assert.equal(faaImage?.src, '/stories/img/faa-anchorage-artcc.jpg');
assert.match(faaImage?.license || '', /Public domain/);
assert.match(faaImage?.sourceUrl || '', /^https:\/\/commons\.wikimedia\.org\//);

const check = parseStoryMarkdown(
  fs.readFileSync(path.join(process.cwd(), 'public/stories/factcheck-nov-17-blackout-hoax.md'), 'utf8'),
);
assert.equal(resolveStoryImage(check)?.src, '/stories/img/fema-ipaws-demonstration.jpg');

assert.equal(coverTone('fact-check', 'debunk'), 'debunk');
assert.equal(coverTone('fact-check', 'confirmation'), 'confirmation');
assert.equal(coverTone('fact-check', 'mixed'), 'mixed');
assert.equal(coverTone('tropical_cyclone', null), 'neutral');
assert.equal(coverLabel('infrastructure_outage', null), 'Infrastructure outage');
assert.equal(coverLabel('fact-check', 'debunk'), 'Debunked');

const fromIndex = resolveStoryImage(
  { image: null },
  { image: '/stories/img/later.jpg', imageAlt: 'Later', imageCredit: 'Desk', imageLicense: 'Example', imageSourceUrl: 'http://insecure.example/a' },
);
assert.equal(fromIndex?.alt, 'Later');
assert.equal(fromIndex?.sourceUrl, null);

console.log('image tests passed');
