import assert from 'node:assert/strict';
import { DURATION, EASE, SPRINGS, cssSpring, springFromFeel, springSolver } from './springs.js';

assert.equal(EASE.enter.css, 'cubic-bezier(0,0,.2,1)');
assert.equal(EASE.exit.css, 'cubic-bezier(.4,0,1,1)');
assert.equal(EASE.standard.css, 'cubic-bezier(.2,0,0,1)');
assert.equal(EASE.enter.gsap, 'power3.out');
assert.equal(SPRINGS.smooth.duration, 0.6);
assert.equal(DURATION.medium, 0.35);

const atRest = springSolver(springFromFeel({ duration: 0.5, bounce: 0 }));
assert.ok(atRest(0) < 0.05);
assert.ok(atRest(2) > 0.99);

const css = cssSpring(SPRINGS.snappy);
assert.ok(css.duration > 0);
assert.ok(css.easing.startsWith('linear(') || css.fallback.startsWith('cubic-bezier'));

console.log('motion-blitz spring presets passed');
