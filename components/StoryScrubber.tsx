'use client';

import { useEffect, useState } from 'react';
import { changedParagraphs, type HistoryFile, type HistoryVersion } from '@/lib/chronicle';

export default function StoryScrubber({ slug }: { slug: string }) {
  const [versions, setVersions] = useState<HistoryVersion[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancel = false;
    fetch(`/stories/history/${slug}.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: HistoryFile | null) => {
        if (cancel) return;
        const next = data?.versions || [];
        setVersions(next);
        setIndex(Math.max(next.length - 1, 0));
      })
      .catch(() => {
        if (!cancel) setVersions([]);
      });
    return () => {
      cancel = true;
    };
  }, [slug]);

  if (!versions) return null;
  if (versions.length < 2) {
    return (
      <p className="scrubber scrubber--quiet" data-motion="scrubber" data-state="closed">
        No revisions yet
      </p>
    );
  }

  const selected = versions[index];
  const current = versions[versions.length - 1];
  const changed = new Set(changedParagraphs(selected.body, current.body));
  const atEnd = index === versions.length - 1;

  return (
    <section className="scrubber" data-motion="scrubber" data-state={atEnd ? 'closed' : 'active'} aria-label="Story revisions">
      <div className="scrubber__head">
        <h3>Revisions</h3>
        <p>
          {new Date(selected.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC
          {atEnd ? ' · Current' : ''}
        </p>
      </div>
      <input
        type="range"
        min={0}
        max={versions.length - 1}
        value={index}
        aria-valuetext={`Revision ${index + 1} of ${versions.length}`}
        onChange={(event) => setIndex(Number(event.target.value))}
      />
      <ol className="scrubber__ticks">
        {versions.map((version, tick) => (
          <li key={version.sha}>
            <button type="button" aria-current={tick === index ? 'true' : undefined} onClick={() => setIndex(tick)}>
              {tick + 1}
            </button>
          </li>
        ))}
      </ol>
      <h4>{selected.title}</h4>
      {selected.updateNote ? <p className="scrubber__note">{selected.updateNote}</p> : null}
      <div className="scrubber__body">
        {selected.body.split(/\n\s*\n/).map((paragraph, paragraphIndex) => {
          const clean = paragraph.replace(/\s+/g, ' ').trim();
          if (!clean) return null;
          const marked = !atEnd && changed.has(clean);
          return (
            <p key={paragraphIndex} className={marked ? 'is-changed' : undefined}>
              {paragraph.trim()}
            </p>
          );
        })}
      </div>
    </section>
  );
}
