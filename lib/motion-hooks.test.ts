import assert from 'node:assert/strict';
import { EASE } from './motion-blitz/springs.js';
import { bindMotionHooks, intensityFor, isMotionKind, parseSeverity } from './motion-hooks.ts';

assert.equal(parseSeverity(undefined), 3);
assert.equal(parseSeverity('1'), 1);
assert.equal(parseSeverity('5'), 5);
assert.equal(parseSeverity('9'), 5);
assert.equal(parseSeverity('nope'), 3);
assert.equal(isMotionKind('headline'), true);
assert.equal(isMotionKind('map'), false);

const soft = intensityFor('1', 'headline');
const hard = intensityFor('5', 'headline');
assert.ok(hard.travel > soft.travel);
assert.ok(hard.duration > soft.duration);
assert.equal(intensityFor('3', 'headline').ease, EASE.enter.css);
assert.equal(intensityFor('3', 'badge').ease, EASE.overshoot.css);

// No matching nodes: must no-op and still return a disposer.
const emptyRoot = { querySelectorAll: () => [] } as unknown as ParentNode;
const stop = bindMotionHooks(emptyRoot, { reduced: true });
assert.equal(typeof stop, 'function');
stop();

console.log('motion hook tests passed');
