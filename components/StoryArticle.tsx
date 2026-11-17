import Link from 'next/link';
import FactCheckMark from './FactCheckMark';
import InvestigationBody from './InvestigationBody';
import MarkdownBody from './MarkdownBody';
import QuoteTable from './QuoteTable';
import VerificationTrail from './VerificationTrail';
import { labelize, storyBadge, storyDateline, stripMatchingHeading, updatedLabel } from '@/lib/content';
import { isFactCheckStory, quotesForStory, type SearchStory, type SourcePack } from '@/lib/desk';
import { resolveInvestigation } from '@/lib/investigation';
import { resolveTrail } from '@/lib/trail';
import type { LoadedStory } from '@/lib/published';

export default function StoryArticle({
  story,
  pack,
  questions,
  searchStory,
}: {
  story: LoadedStory;
  pack: SourcePack | null;
  questions: string[];
  searchStory?: SearchStory | null;
}) {
  if (story.missing || !story.doc) {
    return (
      <article className="story">
        <p>
          <Link href="/press">All stories</Link>
        </p>
        <h2>{story.card.title}</h2>
        <p>The index lists {story.card.path}, and that file is not in the publish.</p>
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
  const sources = pack?.sources.length ? pack.sources : doc.sources.map((url) => ({ label: url, url }));
  const quotes = searchStory ? quotesForStory(searchStory) : [];
  const investigation = resolveInvestigation(
    { confidence: doc.confidence, conclusions: doc.conclusions, canaries: doc.canaries, developing: doc.developing, asOf: doc.asOf, body },
    { confidence: story.card.confidence, conclusions: story.card.conclusions, canaries: story.card.canaries, developing: story.card.developing, asOf: story.card.asOf },
    searchStory
      ? {
          confidence: searchStory.confidence,
          conclusions: searchStory.conclusions,
          canaries: searchStory.canaries,
          developing: searchStory.developing,
          asOf: searchStory.asOf,
          body: searchStory.body,
        }
      : null,
  );
  const investigationLayout = investigation.active;
  const trail = resolveTrail(doc.trail, story.card.trail, searchStory?.trail);
  return (
    <article className="story">
      <p>
        <Link href="/press">All stories</Link>
        {searchStory ? (
          <>
            {' · '}
            <Link href={`/war-room?story=${searchStory.slug}`}>Open in the war room</Link>
          </>
        ) : (
          <>
            {' · '}
            <Link href={`/war-room?story=${story.card.slug}`}>Open in the war room</Link>
          </>
        )}
      </p>
      {updatedText || updateNote ? (
        <aside className="story__update">
          {updatedText ? <p>{updatedText}</p> : null}
          {updateNote ? <p>{updateNote}</p> : null}
        </aside>
      ) : null}
      {badge ? <p className={`badge badge--${badge.band}`}>{badge.label}</p> : null}
      {alertNote ? <p className="story__note">{alertNote}</p> : null}
      {searchStory && isFactCheckStory(searchStory) ? <FactCheckMark story={searchStory} /> : null}
      <h2>{title}</h2>
      <p className="story__dateline">
        {[labelize(doc.eventType || story.card.eventType), when, places.join(' · ')].filter(Boolean).join(' — ')}
        {doc.severity != null ? ` — Severity ${doc.severity}/10` : ''}
        {!investigationLayout && investigation.asOf ? ` — As of ${investigation.asOf}` : ''}
      </p>
      {investigation.developing || (investigationLayout && investigation.asOf) ? (
        <p className="investigation__meta">
          {investigation.developing ? <span className="developing">Developing</span> : null}
          {investigationLayout && investigation.asOf ? <span>As of {investigation.asOf}</span> : null}
        </p>
      ) : null}
      <VerificationTrail steps={trail} />
      {quotes.length ? <QuoteTable quotes={quotes} storyAsOf={searchStory?.asOf || null} note={searchStory?.quotesNote} /> : null}
      {pack?.keyFindings.length ? (
        <section>
          <h3>Key findings</h3>
          <ul>
            {pack.keyFindings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {questions.length ? (
        <section>
          <h3>Suggested questions</h3>
          <ul>
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {investigationLayout ? <InvestigationBody view={{ ...investigation, intro: investigation.intro || (!investigation.sections.length ? body : investigation.intro) }} /> : body ? <MarkdownBody source={body} /> : <p>This file has no body yet.</p>}
      {sources.length ? (
        <div className="story__sources">
          <h3>Sources</h3>
          <ol>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {doc.briefId ? <p className="story__note">Brief {doc.briefId}</p> : null}
    </article>
  );
}
