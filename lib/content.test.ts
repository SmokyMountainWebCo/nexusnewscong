import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { formatDeskDate, isPublished, parseMarkdown, parseStoryIndex, parseStoryMarkdown, storyBadge, storyDateline, stripMatchingHeading } from './content.ts';

const root = process.cwd();
const index = JSON.parse(fs.readFileSync(path.join(root, 'public/stories/index.json'), 'utf8'));
const parsedIndex = parseStoryIndex(index);
const botswana = parsedIndex.stories.find((story) => story.slug === 'botswana-mozambique-forest-fires-oct-2026');
assert.ok(botswana);
assert.equal(botswana.path, '/stories/botswana-mozambique-forest-fires-oct-2026.md');
assert.equal(botswana.confidence, null);
assert.equal(botswana.canaries, null);

const raw = fs.readFileSync(path.join(root, 'public/stories/botswana-mozambique-forest-fires-oct-2026.md'), 'utf8');
const doc = parseStoryMarkdown(raw);
assert.equal(isPublished(doc), true);
assert.equal(storyBadge(doc.alertLevel, doc.severity).band, 'green');
assert.equal(storyBadge(null, 8).band, 'red');
assert.equal(storyBadge(null, null).label, 'Unrated');
const stripped = stripMatchingHeading(doc.body, doc.title);
assert.equal(stripped.startsWith('#'), false);
assert.ok(parseMarkdown(stripped).some((block) => block.t === 'p'));

assert.equal(formatDeskDate('2026-10-16'), 'October 16, 2026');
assert.equal(formatDeskDate('2026-10-16T19:30:00Z'), 'Oct 16, 2026, 7:30 PM UTC');
assert.equal(storyDateline({ date: '2026-10-01', updated: '2026-10-16T23:50:00Z', timestamp: '2026-01-01T00:00:00Z' }), 'October 1, 2026');

const draft = parseStoryMarkdown('---\nstatus: draft\ntitle: Hidden\n---\n\nSecret');
assert.equal(isPublished(draft), false);
const inference = parseMarkdown('Inference: the model is not a count.');
assert.equal(inference[0].t === 'p' && inference[0].inference, true);

console.log('content checks passed');
