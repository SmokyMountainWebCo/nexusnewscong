import assert from 'node:assert/strict';
import { parseRelated, parseStoryMarkdown } from './content.ts';
import { decideHistory, headlineWeight, rankSearch, roomFor, scoreSearch, searchEntry, severityStep, versionsFromSnapshots } from './chronicle.ts';

assert.equal(roomFor('fact-check', []), 'conspiracy');
assert.equal(roomFor('market movers', []), 'markets');
assert.equal(roomFor('tropical_cyclone', []), 'press');

const entries = [
  searchEntry({ title: 'Champi nears Guam', slug: 'champi', eventType: 'tropical_cyclone', summary: 'A typhoon east of Guam', tags: ['storm'], date: '2026-10-16' }),
  searchEntry({ title: 'Market movers', slug: 'markets-day', eventType: 'market', summary: 'Dow and Nasdaq', tags: ['market'], date: '2026-10-16' }),
];
assert.ok(scoreSearch(entries[0], 'guam') > scoreSearch(entries[1], 'guam'));
assert.equal(rankSearch(entries, 'nasdaq')[0].slug, 'markets-day');
assert.deepEqual(rankSearch(entries, 'z'), []);

const versions = versionsFromSnapshots([
  { sha: 'bbb', at: '2026-11-14T00:00:00Z', raw: '---\ntitle: Second\nupdate_note: Revised\n---\n\nSecond body' },
  { sha: 'aaa', at: '2026-11-13T00:00:00Z', raw: '---\ntitle: First\n---\n\nFirst body' },
  { sha: 'ccc', at: '2026-11-14T01:00:00Z', raw: '---\ntitle: Second\nupdate_note: Revised\n---\n\nSecond body' },
]);
assert.equal(versions.length, 2);
assert.equal(versions[0].title, 'First');
assert.equal(versions[1].sha, 'bbb');
assert.equal(versions[1].updateNote, 'Revised');

assert.equal(severityStep(8, 'infrastructure_outage', null), 4);
assert.equal(severityStep(1, 'flood', null), 1);
assert.equal(severityStep(6, 'fact-check', 'debunk'), null);
assert.equal(severityStep(9, 'investigation', 'debunk'), null);
assert.equal(headlineWeight(null), 560);
assert.equal(headlineWeight(5), 760);

const related = parseRelated([
  { slug: 'faa-story', reason: 'shared_event', strength: 3 },
  { slug: 'later', reason: 'follow-up', strength: '2' },
  { slug: '', reason: 'same_location' },
]);
assert.equal(related.length, 2);
assert.equal(related[0].reason, 'shared_event');
assert.equal(related[0].strength, 3);
assert.equal(related[1].reason, 'follow_up');
assert.equal(related[1].strength, 2);
assert.deepEqual(parseRelated(undefined), []);

const withRelated = parseStoryMarkdown(`---
title: Example
related:
  - slug: other-story
    reason: same_location
    strength: 1
---

Body`);
assert.equal(withRelated.related[0].slug, 'other-story');
assert.equal(withRelated.related[0].reason, 'same_location');

const committed = [
  { sha: 'aaa', at: '2026-11-13T00:00:00Z', title: 'First', body: 'First body', updateNote: null, updated: null },
  { sha: 'bbb', at: '2026-11-14T00:00:00Z', title: 'Second', body: 'Second body', updateNote: 'Revised', updated: null },
];
const current = { sha: 'current', at: '2026-11-17T00:00:00Z', title: 'Second', body: 'Second body', updateNote: 'Revised', updated: null };
const noGit = decideHistory({ repo: false, committed, fromGit: [], current });
assert.equal(noGit.write, false);
assert.deepEqual(noGit.versions.map((version) => version.sha), ['aaa', 'bbb']);

const noGitNew = decideHistory({ repo: false, committed: null, fromGit: [], current });
assert.equal(noGitNew.write, true);
assert.deepEqual(noGitNew.versions.map((version) => version.sha), ['current']);

const shallow = decideHistory({ repo: true, committed, fromGit: [committed[1]], current });
assert.equal(shallow.write, false);
assert.equal(shallow.versions.length, 2);

const extended = decideHistory({
  repo: true,
  committed,
  fromGit: [committed[1], { sha: 'ccc', at: '2026-11-15T00:00:00Z', title: 'Third', body: 'Third body', updateNote: null, updated: null }],
  current,
});
assert.equal(extended.write, true);
assert.deepEqual(extended.versions.map((version) => version.sha), ['aaa', 'bbb', 'ccc']);

console.log('chronicle tests passed');
