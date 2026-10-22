import assert from 'node:assert/strict';
import { coordinatesFromLocation, layersForEvent } from './stories.ts';

assert.deepEqual(coordinatesFromLocation('storm centre 12.2S 163.5W at 162100Z'), { lat: -12.2, lon: -163.5 });
assert.deepEqual(coordinatesFromLocation('approx. 12.0N 149.6E, open ocean'), { lat: 12, lon: 149.6 });
assert.deepEqual(coordinatesFromLocation('approx. 20.99S, 178.77W'), { lat: -20.99, lon: -178.77 });
assert.equal(coordinatesFromLocation('Tripoli, Libya'), null);
assert.deepEqual(layersForEvent('tropical_cyclone'), ['weather-cyclones']);
assert.deepEqual(layersForEvent('forest_fire'), ['local-firms', 'fire-perimeters']);
assert.deepEqual(layersForEvent('earthquake'), ['earthquakes']);

console.log('story coordinate tests passed');
