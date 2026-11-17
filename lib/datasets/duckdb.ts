import { PUBLIC_DATASETS, STORY_COUNT_SQL, countStoriesInIndex, type PublicDataset } from './catalog.ts';

export { PUBLIC_DATASETS, STORY_COUNT_SQL, countStoriesInIndex };
export type { PublicDataset };

type DuckDbModule = typeof import('@duckdb/duckdb-wasm');

type AsyncDuckDB = InstanceType<DuckDbModule['AsyncDuckDB']>;

let opening: Promise<AsyncDuckDB> | null = null;

/**
 * Load DuckDB-Wasm only when a caller asks. The WASM binary and worker are
 * fetched from the package's jsDelivr bundles at runtime so they stay out of
 * the first-load JS budget.
 */
export async function loadDuckDB(): Promise<AsyncDuckDB> {
  if (!opening) opening = openDuckDB();
  return opening;
}

async function openDuckDB(): Promise<AsyncDuckDB> {
  const duckdb = await import('@duckdb/duckdb-wasm');
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }),
  );
  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  return db;
}

export async function queryJsonDataset(publicPath: string, sql: string): Promise<unknown[]> {
  const dataset = PUBLIC_DATASETS.find((item) => item.path === publicPath);
  if (!dataset) {
    throw new Error(`Refusing to load ${publicPath}: it is not a shipped public dataset.`);
  }
  const response = await fetch(dataset.path);
  if (!response.ok) {
    throw new Error(`Could not fetch ${dataset.path} (${response.status}).`);
  }
  const buffer = new Uint8Array(await response.arrayBuffer());
  const db = await loadDuckDB();
  const name = 'dataset.json';
  await db.registerFileBuffer(name, buffer);
  const conn = await db.connect();
  try {
    await conn.query(`CREATE OR REPLACE TABLE index_json AS SELECT * FROM read_json('${name}', format='auto', auto_detect=true)`);
    const result = await conn.query(sql);
    return result.toArray().map((row) => row.toJSON ? row.toJSON() : row);
  } finally {
    await conn.close();
  }
}

/** One real query against the shipped story index. */
export async function queryPublishedStoryCount(): Promise<number> {
  const rows = await queryJsonDataset('/stories/index.json', STORY_COUNT_SQL);
  const first = rows[0] as { n?: number } | undefined;
  const n = Number(first?.n);
  if (!Number.isFinite(n)) throw new Error('DuckDB did not return a story count.');
  return n;
}
