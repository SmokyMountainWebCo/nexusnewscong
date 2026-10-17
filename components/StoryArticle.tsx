import Link from 'next/link';
import MarkdownBody from './MarkdownBody';
import FactCheckMark from './FactCheckMark';
import QuoteTable from './QuoteTable';
import { formatDeskDate, labelize, storyBadge, storyDateline, stripMatchingHeading, updatedLabel } from '@/lib/content';
import type { LoadedStory } from '@/lib/published';
import { isFactCheckStory, quotesForStory, type SearchStory, type SourcePack } from '@/lib/desk';

export default function StoryArticle({
  story,
  pack,
  questions,
  market,
}: {
  story: LoadedStory;
  pack: SourcePack | null;
  questions: string[];
  market?: SearchStory | null;
}) {
  if (story.missing || !story.doc) {
    return (
      <article className="nx-story">
        <p><Link className="nx-text-btn" href="/press">All stories</Link></p>
        <h2 className="nx-story__title">{story.card.title}</h2>
        <div className="nx-empty" role="status">
          <strong>This story file is missing</strong>
          The index lists {story.card.path}, and that file is not in the publish.
        </div>
      </article>
    );
  }
  const doc = story.doc;
  const badge = storyBadge(doc.alertLevel || story.card.alertLevel, doc.severity);
  const alertNote = doc.alertNote || story.card.alertNote;
  const updatedText = updatedLabel(doc.updated || story.card.updated);
  const updateNote = doc.updateNote || story.card.updateNote;
  const title = doc.title || story.card.title;
  const places = doc.locations.length ? doc.locations : doc.location ? [doc.location] : [];
  const when = storyDateline(doc, story.card);
  const body = stripMatchingHeading(doc.body, title);
  const sources = pack?.sources.length
    ? pack.sources
    : doc.sources.map((url) => ({ label: url, url }));
  return (
    <article className="nx-story">
      <p><Link className="nx-text-btn" href="/press">All stories</Link></p>
      {updatedText || updateNote ? (
        <aside className="nx-update" role="note">
          {updatedText ? <p className="nx-update__when">{updatedText}</p> : null}
          {updateNote ? <p>{updateNote}</p> : null}
        </aside>
      ) : null}
      <div className="nx-alert-row">
        <span className={`nx-badge nx-badge--${badge.band}`} title={alertNote || undefined} aria-describedby={alertNote ? 'alert-note' : undefined}>
          {badge.label}
        </span>
        {alertNote ? <p className="nx-alert-note" id="alert-note">{alertNote}</p> : null}
      </div>
      {market && isFactCheckStory(market) ? <FactCheckMark story={market} /> : null}
      <h2 className="nx-story__title">{title}</h2>
      <p className="nx-dateline">
        {[labelize(doc.eventType || story.card.eventType), when, places.join(' · ')].filter(Boolean).join(' — ')}
        {doc.severity != null ? ` — Severity ${doc.severity}/10` : ''}
        {market?.asOf ? ` — As of ${formatDeskDate(market.asOf) || market.asOf}` : ''}
      </p>
      {market ? <QuoteTable quotes={quotesForStory(market)} storyAsOf={market.asOf} /> : null}
      {pack?.keyFindings.length ? (
        <section className="nx-findings-block" aria-label="Key findings">
          <h3>Key findings</h3>
          <ul className="nx-findings">
            {pack.keyFindings.map((finding) => <li key={finding}>{finding}</li>)}
          </ul>
        </section>
      ) : null}
      {questions.length ? (
        <section className="nx-questions" aria-label="Suggested questions">
          <h3>Suggested questions</h3>
          <ul>
            {questions.map((question) => <li key={question}>{question}</li>)}
          </ul>
        </section>
      ) : null}
      {body ? <MarkdownBody source={body} /> : <p>This file has no body yet.</p>}
      {sources.length ? (
        <div className="nx-sources">
          <h3>Sources</h3>
          <ol>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {doc.briefId ? <p className="nx-meta">Brief {doc.briefId}</p> : null}
    </article>
  );
}
