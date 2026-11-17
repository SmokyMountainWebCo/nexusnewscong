'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { rankSearch, type SearchEntry } from '@/lib/chronicle';

export default function CommandPalette() {
  const titleId = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [stories, setStories] = useState<SearchEntry[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancel = false;
    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancel || !data || !Array.isArray(data.stories)) return;
        setStories(data.stories as SearchEntry[]);
      })
      .catch(() => {
        if (!cancel) setStories([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => rankSearch(stories, query), [stories, query]);

  function go(entry: SearchEntry | undefined) {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  }

  return (
    <>
      <button
        type="button"
        className="desk__search"
        data-motion="search"
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen(true)}
      >
        Search
        <kbd>⌘K</kbd>
      </button>
      {open ? (
        <div className="cmdk" data-motion="search" data-state="open" onMouseDown={() => setOpen(false)}>
          <div
            className="cmdk__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={titleId}>Search stories</h2>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActive((index) => Math.max(index - 1, 0));
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  go(results[active]);
                }
              }}
              placeholder="Title, tag, or summary"
              aria-label="Search stories"
              aria-controls="cmdk-results"
              aria-activedescendant={results[active] ? `cmdk-${results[active].slug}` : undefined}
            />
            <ul id="cmdk-results" role="listbox" aria-label="Matching stories">
              {query && results.length === 0 ? <li className="cmdk__empty">No matching story.</li> : null}
              {results.map((entry, index) => (
                <li key={entry.slug} id={`cmdk-${entry.slug}`} role="option" aria-selected={index === active}>
                  <button type="button" onClick={() => go(entry)} onMouseEnter={() => setActive(index)}>
                    <strong>{entry.title}</strong>
                    <span>{[entry.room, entry.date].filter(Boolean).join(' · ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
