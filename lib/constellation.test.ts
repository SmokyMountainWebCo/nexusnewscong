import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseRelated, parseStoryMarkdown } from './content.ts';
import { graphFromStories, nodePosition } from './constellation.ts';

assert.deepEqual(parseRelated(undefined), []);
assert.deepEqual(parseRelated('nope'), []);
assert.deepEqual(parseRelated([{ reason: 'shared_event', strength: 2 }]), []);

const yamlList = parseStoryMarkdown(`---
title: Alpha
slug: alpha
status: published
related:
  - slug: beta
    reason: shared_event
    strength: 2
  - slug: missing
    reason: same_location
    strength: 1
---

Body
`);
assert.deepEqual(yamlList.related, [
  { slug: 'beta', reason: 'shared_event', strength: 2 },
  { slug: 'missing', reason: 'same_location', strength: 1 },
]);

const graph = graphFromStories([
  { slug: 'alpha', title: 'Alpha', related: yamlList.related, severity: 2 },
  { slug: 'beta', title: 'Beta', related: [], severity: 4 },
]);
assert.equal(graph.nodes.length, 2);
assert.equal(graph.hasEditorLinks, true);
assert.deepEqual(graph.edges, [
  { from: 'alpha', to: 'beta', reason: 'shared_event', strength: 2 },
]);

const isolated = graphFromStories([
  { slug: 'alpha', title: 'Alpha', related: [], severity: 1 },
  { slug: 'beta', title: 'Beta', related: [], severity: 1 },
]);
assert.equal(isolated.hasEditorLinks, false);
assert.deepEqual(isolated.edges, []);

const a = nodePosition('alpha', 0, 3);
const b = nodePosition('alpha', 0, 3);
assert.deepEqual(a, b);
assert.ok(Math.abs(a[0] ** 2 + a[1] ** 2 + a[2] ** 2 - 1) < 1e-6);

const root = path.join(process.cwd(), 'public/stories');
const files = fs.readdirSync(root).filter((name) => name.endsWith('.md'));
assert.ok(files.length >= 1);
let editorLinks = 0;
for (const file of files) {
  const doc = parseStoryMarkdown(fs.readFileSync(path.join(root, file), 'utf8'));
  editorLinks += doc.related.length;
}
assert.equal(editorLinks, 0, 'no published story has related: yet; graph should stay edgeless');

console.log('constellation tests passed');
