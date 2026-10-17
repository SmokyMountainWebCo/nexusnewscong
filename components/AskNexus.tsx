'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  emptyCorpus,
  parseBriefsFile,
  parseClaimsFile,
  parseSearchIndex,
  parseSourcesFile,
  searchDesk,
  suggestedQuestions,
  type AskHit,
  type DeskCorpus,
} from '@/lib/desk';
import { parseStoryIndex, parseStoryMarkdown } from '@/lib/content';

async function readJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function loadCorpus(): Promise<DeskCorpus> {
  const [search, claims, briefs, sources] = await Promise.all([
    readJson('/stories/search.json'),
    readJson('/kb/claims.json'),
    readJson('/stories/briefs.json'),
    readJson('/stories/sources.json'),
  ]);
  let stories = parseSearchIndex(search);
  if (!stories.length) {
    const index = parseStoryIndex(await readJson('/stories/index.json'));
    const loaded = await Promise.all(
      index.stories.map(async (card) => {
        try {
          const response = await fetch(card.path, { cache: 'no-store' });
          if (!response.ok) return null;
          const doc = parseStoryMarkdown(await response.text());
          return {
            slug: card.slug,
            title: doc.title || card.title,
            location: doc.location,
            severity: doc.severity,
            alertLevel: doc.alertLevel || card.alertLevel,
            eventType: doc.eventType || card.eventType,
            timestamp: doc.timestamp || card.timestamp,
            updated: doc.updated || card.updated,
            updateNote: doc.updateNote || card.updateNote,
            sourceUrls: doc.sources,
            tags: doc.tags.length ? doc.tags : card.tags,
            asOf: null,
            verdictType: null,
            rating: null,
            quoteName: null,
            last: null,
            prevClose: null,
            changePct: null,
            quoteUrl: null,
            quotes: [],
            body: doc.body,
          };
        } catch {
          return null;
        }
      })
    );
    stories = loaded.filter((story): story is NonNullable<typeof story> => Boolean(story));
  }
  return {
    stories,
    claims: parseClaimsFile(claims).claims,
    briefs: parseBriefsFile(briefs),
    sources: parseSourcesFile(sources),
  };
}

export default function AskNexus() {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [corpus, setCorpus] = useState<DeskCorpus | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<AskHit[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || corpus) return;
    let cancel = false;
    loadCorpus()
      .then((next) => {
        if (!cancel) setCorpus(next);
      })
      .catch(() => {
        if (!cancel) {
          setCorpus(emptyCorpus());
          setError('The published search files could not be read.');
        }
      });
    return () => {
      cancel = true;
    };
  }, [open, corpus]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previously = document.activeElement as HTMLElement | null;
    const focusable = () =>
      [...(dialog?.querySelectorAll<HTMLElement>('button, input, a[href]') || [])].filter((el) => !el.hasAttribute('disabled'));
    focusable()[1]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previously?.focus();
    };
  }, [open]);

  const ask = (value: string) => {
    const next = value.trim();
    setQuery(next);
    if (!corpus) return;
    setHits(searchDesk(corpus, next));
  };

  const suggestions = corpus ? suggestedQuestions(corpus) : [];

  return (
    <>
      <button type="button" className="nx-ask" onClick={() => setOpen(true)}>
        Ask Nexus
      </button>
      {open ? (
        <div className="nx-dialog-back" onMouseDown={() => setOpen(false)}>
          <div
            className="nx-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            ref={dialogRef}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="nx-dialog__bar">
              <h2 id={titleId}>Ask Nexus</h2>
              <button type="button" className="nx-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="nx-thread" aria-live="polite">
              {!corpus ? <p className="nx-status">Reading the published files…</p> : null}
              {error ? <p className="nx-error" role="alert">{error}</p> : null}
              {suggestions.length ? (
                <div className="nx-questions">
                  <p className="nx-kicker">Suggested questions</p>
                  {suggestions.slice(0, 5).map((question) => (
                    <button key={question} type="button" className="nx-text-btn" onClick={() => ask(question)}>
                      {question}
                    </button>
                  ))}
                </div>
              ) : null}
              {hits && hits.length === 0 ? <p className="nx-status">Nothing in the published files matches that.</p> : null}
              {hits?.map((hit) =>
                hit.kind === 'story' ? (
                  <article key={`story-${hit.slug}`} className="nx-ask-hit">
                    <p className="nx-kicker">Story</p>
                    <h3><a href={`/press/${hit.slug}/`}>{hit.title}</a></h3>
                    <p>{hit.excerpt}</p>
                    <p className="nx-meta">
                      {[hit.alertLevel, hit.severity != null ? `${hit.severity}/10` : null].filter(Boolean).join(' · ')}
                    </p>
                    {hit.findings.length ? (
                      <ul className="nx-findings">
                        {hit.findings.map((finding) => <li key={finding}>{finding}</li>)}
                      </ul>
                    ) : null}
                    {hit.sources.length ? (
                      <ol className="nx-source-links">
                        {hit.sources.map((source) => (
                          <li key={source.url}><a href={source.url}>{source.label}</a></li>
                        ))}
                      </ol>
                    ) : null}
                  </article>
                ) : (
                  <article key={`claim-${hit.id}`} className="nx-ask-hit">
                    <p className="nx-kicker">Claim · {hit.room || 'desk'}</p>
                    <h3>{hit.text}</h3>
                    <p className="nx-meta">
                      {hit.confidence != null ? <span className="nx-confidence">Confidence {hit.confidence}</span> : 'Confidence not scored'}
                    </p>
                    {hit.contradictions.length ? (
                      <p className="nx-flag" role="status">
                        Contradiction flagged
                        {hit.contradictions.map((item) => (
                          <span key={item.id}> {item.id}{item.text ? `: ${item.text}` : ''}</span>
                        ))}
                      </p>
                    ) : null}
                    {hit.sources.length ? (
                      <ol className="nx-source-links">
                        {hit.sources.map((source) => (
                          <li key={source.url}><a href={source.url}>{source.label}</a></li>
                        ))}
                      </ol>
                    ) : null}
                  </article>
                )
              )}
            </div>
            <form
              className="nx-composer"
              onSubmit={(event) => {
                event.preventDefault();
                ask(query);
              }}
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stories and claims"
                aria-label="Ask Nexus"
              />
              <button type="submit" className="nx-btn" disabled={!corpus}>
                Search
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
