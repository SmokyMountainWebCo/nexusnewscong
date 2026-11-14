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

const draft = parseStoryMarkdown(fs.readFileSync(path.join(process.cwd(), 'lib/fixtures/faa-ground-stop.md'), 'utf8'));
const faa = resolveInvestigation({
  confidence: draft.confidence,
  conclusions: draft.conclusions,
  canaries: draft.canaries,
  developing: draft.developing,
  asOf: draft.asOf,
  body: draft.body,
});
assert.equal(draft.conclusions, null);
assert.equal(faa.developing, true);
assert.equal(faa.asOf, '2026-11-14T00:30Z (7:30 PM ET Nov 13)');
assert.equal(faa.conclusions.length, 3);
assert.equal(faa.conclusions[0].tone, 'high');
assert.match(faa.conclusions[0].text, /separate outages/);
assert.equal(faa.conclusions[1].tone, 'medium');
assert.equal(faa.conclusions[2].tone, 'low');
assert.match(faa.conclusions[2].text, /coincidental timing/);
assert.deepEqual(faa.sections.map((section) => section.title), [
  '1. The surface story',
  '2. What the records show',
  '3. Who has a stake',
  '4. What coverage is missing',
  '5. Conclusions',
]);
assert.equal(faa.canaries.length, 2);
assert.equal(faa.canaries[0].when, 'Nov 14-30, 2026');
assert.deepEqual(
  faa.canaries[0].sourceParts.filter((part) => part.href).map((part) => part.href),
  ['https://faa.gov/newsroom/statements/general-statements', 'https://fly.faa.gov'],
);
assert.match(faa.canaries[0].sourceParts.map((part) => part.text).join(''), /ATCSCC advisories/);
assert.equal(faa.canaries[1].sourceParts.find((part) => part.href)?.href, 'https://status.cloud.microsoft');
assert.match(faa.canaries[1].sourceParts.map((part) => part.text).join(''), /@MSFT365Status/);
assert.equal(faa.canaries[1].sourceParts.find((part) => part.text.includes('@MSFT365Status'))?.href, null);

console.log('investigation tests passed');
