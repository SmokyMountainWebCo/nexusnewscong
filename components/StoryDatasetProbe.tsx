'use client';

import { useState } from 'react';

/**
 * On-demand DuckDB-Wasm hook against the shipped public/stories/index.json.
 * The WASM engine is imported only after a reader asks to run the query.
 */
export default function StoryDatasetProbe({ fallbackCount }: { fallbackCount: number }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const run = async () => {
    setStatus('loading');
    setMessage('Loading DuckDB-Wasm…');
    try {
      const { queryPublishedStoryCount } = await import('@/lib/datasets/duckdb.ts');
      const n = await queryPublishedStoryCount();
      setStatus('ready');
      setMessage(`DuckDB read public/stories/index.json and counted ${n} published ${n === 1 ? 'story' : 'stories'}.`);
    } catch (error) {
      setStatus('error');
      setMessage(
        `DuckDB-Wasm could not run in this browser (${error instanceof Error ? error.message : 'unknown error'}). The shipped index already on this page lists ${fallbackCount} ${fallbackCount === 1 ? 'story' : 'stories'}.`,
      );
    }
  };

  return (
    <div className="dataset-probe">
      <p>
        Story datasets shipped in <code>public/</code> are JSON only. There is no CSV or Parquet file to load.
      </p>
      <button type="button" className="nx-btn" onClick={() => void run()} disabled={status === 'loading'}>
        {status === 'loading' ? 'Querying index…' : 'Query the story index with DuckDB'}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
