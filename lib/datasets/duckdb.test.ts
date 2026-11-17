import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { HISTORY_DIR, PUBLIC_DATASETS, countStoriesInIndex } from './catalog.ts';

const root = process.cwd();

assert.ok(PUBLIC_DATASETS.length >= 1);
for (const dataset of PUBLIC_DATASETS) {
  const file = path.join(root, dataset.file);
  assert.equal(dataset.format, 'json');
  assert.ok(fs.existsSync(file), `missing shipped dataset ${dataset.file}`);
}

const tabular = [];
for (const dir of ['public', 'public/stories', 'public/kb']) {
  const folder = path.join(root, dir);
  if (!fs.existsSync(folder)) continue;
  for (const name of fs.readdirSync(folder)) {
    if (/\.(csv|tsv|parquet|arrow|feather|duckdb)$/i.test(name)) tabular.push(path.join(dir, name));
  }
}
assert.deepEqual(tabular, [], 'do not invent tabular datasets; none exist in public/ today');

const index = JSON.parse(fs.readFileSync(path.join(root, 'public/stories/index.json'), 'utf8'));
const count = countStoriesInIndex(index);
assert.equal(count, index.stories.length);
assert.ok((count || 0) >= 1);

const historyDir = path.join(root, HISTORY_DIR);
if (fs.existsSync(historyDir)) {
  const history = fs.readdirSync(historyDir).filter((name) => name.endsWith('.json'));
  assert.ok(history.length >= 1, 'story revision JSON files exist in public/stories/history');
}


console.log(`duckdb catalog tests passed (${count} stories in public/stories/index.json; no parquet/csv in public/)`);
console.log('DuckDB-Wasm itself is loaded only on demand in the browser hook, not during this unit test.');
