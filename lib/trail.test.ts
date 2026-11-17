import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseStoryMarkdown } from './content.ts';
import { parseTrail, resolveTrail } from './trail.ts';

const fixture = parseStoryMarkdown(fs.readFileSync(path.join(process.cwd(), 'lib/fixtures/trail-story.md'), 'utf8'));
const steps = parseTrail(fixture.trail);
assert.equal(steps.length, 7);
assert.deepEqual(
  steps.map((step) => step.stageName),
  ['Origin signal', 'Origin signal', 'X triangulation', 'X triangulation', 'Primary record', 'Primary record', 'Primary record'],
);
assert.equal(steps[0].sourceHref, null);
assert.equal(steps[0].platform, 'example.com');
assert.equal(steps[0].status, 'unverified');
assert.equal(steps[0].at, '1:40 PM ET Nov 13');
assert.equal(steps[1].sourceHref, null);
assert.equal(steps[1].platform, 'example forum');
assert.equal(steps[2].sourceHref, 'https://x.com/example/status/1');
assert.equal(steps[2].status, 'verified');
assert.equal(steps[4].sourceHref, 'https://www.faa.gov/newsroom/example');
assert.equal(steps[5].status, 'disproven');
assert.equal(steps[5].sourceHref, null);
assert.equal(steps[6].status, 'neutral');

const fromJson = parseTrail(JSON.parse('[{"stage":0,"label":"Example lead","source":"https://old.reddit.com/r/example","status":"unverified"}]'));
assert.equal(fromJson[0].sourceHref, null);
assert.equal(fromJson[0].platform, 'old.reddit.com');
assert.equal(fromJson[0].stageName, 'Origin signal');

assert.deepEqual(parseTrail(null), []);
assert.deepEqual(parseTrail(undefined), []);
assert.deepEqual(resolveTrail(null, undefined, []), []);

const published = parseStoryMarkdown(
  fs.readFileSync(path.join(process.cwd(), 'public/stories/faa-nationwide-ground-stop-telecom-outage-nov-2026.md'), 'utf8'),
);
assert.equal(published.trail, null);
assert.deepEqual(resolveTrail(published.trail), []);

const borrowed = resolveTrail(null, fromJson);
assert.equal(borrowed.length, 1);
assert.equal(borrowed[0].sourceHref, null);

console.log('trail tests passed');
