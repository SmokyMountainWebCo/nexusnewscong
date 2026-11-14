import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseMarkdown, parseStoryMarkdown } from './content.ts';
import { parseCanaries, resolveInvestigation } from './investigation.ts';

const raw = fs.readFileSync(path.join(process.cwd(), 'lib/fixtures/investigation-story.md'), 'utf8');
const doc = parseStoryMarkdown(raw);
const view = resolveInvestigation({ confidence: doc.confidence, conclusions: doc.conclusions, canaries: doc.canaries, body: doc.body });

assert.equal(view.active, true);
assert.deepEqual(view.sections.map((section) => section.title), [
  'Surface narrative',
  'Primary evidence',
  'Who benefits',
  'What coverage is leaving out',
  'Bottom line / conclusions',
]);
assert.equal(view.conclusions.length, 3);
assert.equal(view.conclusions[0].tone, 'high');
assert.equal(view.conclusions[0].label, 'High');
assert.equal(view.conclusions[1].tone, 'medium');
assert.equal(view.conclusions[2].tone, 'low');
assert.match(view.conclusions[0].text, /Typhoon Warning/);
assert.equal(view.canaries.length, 3);
assert.equal(view.canaries[0].when, '2026-10-18 to 2026-11-16');
assert.match(view.canaries[0].sourceUrl || '', /^https:\/\/ghs\.guam\.gov\//);
assert.equal(view.canaries[1].when, '2026-10-17 to 2026-12-01');
assert.match(view.canaries[1].sourceUrl || '', /redcross\.org/);
assert.equal(view.canaries[2].when, '2026-11-01');
assert.equal(view.canaries[2].sourceLabel, 'GDACS');
assert.equal(view.canaries[2].sourceUrl, null);

const evidence = view.sections.find((section) => section.id === 'evidence');
const blocks = parseMarkdown(evidence?.body || '');
assert.equal(blocks.some((block) => block.t === 'quote'), true);
assert.equal(blocks.some((block) => block.t === 'p' && block.inference), true);

const shared = resolveInvestigation({ confidence: 'Medium', conclusions: ['One', 'Two'], canaries: null, body: 'Plain body' });
assert.equal(shared.conclusions.every((item) => item.tone === 'medium'), true);
assert.equal(shared.sections.length, 0);
assert.equal(shared.storyLabel, null);

const storyLevel = resolveInvestigation({ confidence: 'High', conclusions: null, canaries: [], body: 'No special headings.' });
assert.equal(storyLevel.storyTone, 'high');
assert.equal(storyLevel.conclusions.length, 0);
assert.equal(storyLevel.canaries.length, 0);

const plain = resolveInvestigation({ confidence: null, conclusions: null, canaries: null, body: 'A normal story stays on the normal layout.' });
assert.equal(plain.active, false);
assert.equal(plain.sections.length, 0);

const stringCanary = parseCanaries(['Port watch | 2026-12-01 | NOAA']);
assert.equal(stringCanary[0].indicator, 'Port watch');
assert.equal(stringCanary[0].when, '2026-12-01');
assert.equal(stringCanary[0].sourceLabel, 'NOAA');

console.log('investigation tests passed');
