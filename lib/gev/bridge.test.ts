import assert from 'node:assert/strict';
import { GevBridge } from './bridge.ts';
import { gevEmbedUrl, gevOrigin, viewMessage } from './protocol.ts';

assert.equal(gevOrigin('http://localhost:4173'), 'http://localhost:4173');
assert.equal(gevEmbedUrl('http://localhost:4173'), 'http://localhost:4173/?embed=1');
assert.equal(gevEmbedUrl('http://localhost:4173/?welcome=0'), 'http://localhost:4173/?welcome=0&embed=1');

const posted: unknown[] = [];
const target = {
  postMessage(message: unknown, origin: string) {
    posted.push({ message, origin });
  },
} as unknown as Window;

let ready = false;
let last: { id: number | null; ok: boolean } | null = null;
const bridge = new GevBridge(target, 'http://localhost:4173', (status, isReady) => {
  ready = isReady;
  if (status) last = status;
});

const queued = bridge.send({ camera: { lat: 13.4, lon: 144.8 } });
assert.equal(queued, null);
assert.equal(posted.length, 0);

bridge.handle({ origin: 'https://evil.example', data: { type: 'gev:ready' } });
assert.equal(ready, false);

bridge.handle({ origin: 'http://localhost:4173', data: { type: 'gev:ready' } });
assert.equal(ready, true);
assert.equal(posted.length, 1);
assert.deepEqual((posted[0] as { message: unknown }).message, viewMessage(1, { camera: { lat: 13.4, lon: 144.8 } }));

const sent = bridge.send({ camera: { lat: -12.2, lon: -163.5 }, layers: ['weather-cyclones'] });
assert.equal(sent, 2);

bridge.handle({
  origin: 'http://localhost:4173',
  data: { type: 'gev:view-applied', id: 2, ok: true, steps: [{ step: 'camera', ok: true }] },
});
assert.equal(last?.id, 2);
assert.equal(last?.ok, true);

bridge.handle({
  origin: 'http://localhost:9999',
  data: { type: 'gev:view-applied', id: 9, ok: false, error: 'nope' },
});
assert.equal(last?.id, 2);

bridge.handle({
  origin: 'http://localhost:4173',
  source: {},
  data: { type: 'gev:view-applied', id: 7, ok: false, error: 'wrong window' },
});
assert.equal(last?.id, 2);

console.log('gev bridge tests passed');
