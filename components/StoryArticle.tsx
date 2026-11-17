import Link from 'next/link';
import FactCheckMark from './FactCheckMark';
import FocusToggle from './FocusToggle';
import InvestigationBody from './InvestigationBody';
import MarkdownBody from './MarkdownBody';
import QuoteTable from './QuoteTable';
import StoryScrubber from './StoryScrubber';
import StoryVisual from './StoryVisual';
import VerificationTrail from './VerificationTrail';
import { headlineWeight, severityStep } from '@/lib/chronicle';
import { labelize, storyBadge, storyDateline, stripMatchingHeading, updatedLabel, type RelatedItem } from '@/lib/content';
import { isFactCheckStory, quotesForStory, type SearchStory, type SourcePack } from '@/lib/desk';
import { resolveInvestigation } from '@/lib/investigation';
import { resolveStoryImage } from '@/lib/images';
import { loadStories, type LoadedStory } from '@/lib/published';
import { resolveTrail, type TrailStep } from '@/lib/trail';

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
  const image = resolveStoryImage(
    {
      image: doc.image,
      imageAlt: doc.imageAlt,
      imageCredit: doc.imageCredit,
      imageLicense: doc.imageLicense,
      imageSourceUrl: doc.imageSourceUrl,
    },
    {
      image: story.card.image,
      imageAlt: story.card.imageAlt,
      imageCredit: story.card.imageCredit,
      imageLicense: story.card.imageLicense,
      imageSourceUrl: story.card.imageSourceUrl,
    },
    searchStory,
  );
  const verdict = searchStory?.verdictType || null;
  const severity = severityStep(doc.severity, doc.eventType || story.card.eventType, verdict);
  const related = doc.related.length ? doc.related : story.card.related.length ? story.card.related : searchStory?.related || [];
  const titles = new Map(loadStories().stories.map((item) => [item.card.slug, item.card.title]));
  const cards = marginCards(sources, trail);
  return (
    <article className="story">
      <StoryVisual image={image} slug={story.card.slug} eventType={doc.eventType || story.card.eventType} verdictType={verdict} title={title} variant="hero" />
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
      <div className="story__tools">
        <FocusToggle />
      </div>
      <h2 data-motion="headline" data-severity={severity ?? undefined} style={{ ['--headline-weight' as string]: String(headlineWeight(severity)) }}>
        {title}
      </h2>
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
      <div className="reading">
        <div className="reading__column">
          {investigationLayout ? <InvestigationBody view={{ ...investigation, intro: investigation.intro || (!investigation.sections.length ? body : investigation.intro) }} /> : body ? <MarkdownBody source={body} /> : <p>This file has no body yet.</p>}
          <RelatedList items={related} titles={titles} />
          <StoryScrubber slug={story.card.slug} />
        </div>
        <MarginNotes cards={cards} />
      </div>
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

type MarginCard = { label?: string; name?: string; url?: string; asOf?: string; confidence?: string };

function marginCards(sources: Array<{ label: string; url: string }>, trail: TrailStep[]): MarginCard[] {
  const cards: MarginCard[] = [];
  for (const step of trail) {
    const card: MarginCard = {};
    if (step.label) card.label = step.label;
    if (step.stage === 0) {
      if (step.platform) card.name = step.platform;
    } else if (step.sourceLabel && !step.sourceHref) {
      card.name = step.sourceLabel;
    }
    if (step.stage !== 0 && step.sourceHref) card.url = step.sourceHref;
    if (step.at) card.asOf = step.at;
    if (card.label || card.name || card.url || card.asOf) cards.push(card);
  }
  for (const source of sources) {
    cards.push({ name: source.label, url: source.url });
  }
  return cards.slice(0, 8);
}

function CardFields({ card }: { card: MarginCard }) {
  return (
    <>
      {card.label ? <strong>{card.label}</strong> : null}
      {card.name ? <span>{card.name}</span> : null}
      {card.asOf ? <span>As of {card.asOf}</span> : null}
      {card.confidence ? <span>{card.confidence}</span> : null}
      {card.url ? (
        <a href={card.url} target="_blank" rel="noopener noreferrer">
          Source
        </a>
      ) : null}
    </>
  );
}

function MarginNotes({ cards }: { cards: MarginCard[] }) {
  if (!cards.length) return null;
  return (
    <>
      <aside className="margin" aria-label="Margin notes">
        {cards.map((card, index) => (
          <article key={index} className="margin__card" data-motion="margin-card" data-state="closed">
            <CardFields card={card} />
          </article>
        ))}
      </aside>
      <ol className="footnotes">
        {cards.map((card, index) => (
          <li key={index}>
            <details data-motion="margin-card" data-state="closed">
              <summary>Note {index + 1}</summary>
              <CardFields card={card} />
            </details>
          </li>
        ))}
      </ol>
    </>
  );
}

function RelatedList({ items, titles }: { items: RelatedItem[]; titles: Map<string, string> }) {
  if (!items.length) return null;
  return (
    <section className="related" aria-label="Related stories">
      <h3>Related</h3>
      <ul>
        {items.map((item) => (
          <li key={`${item.slug}-${item.reason}`}>
            <Link href={`/press/${item.slug}/`}>{titles.get(item.slug) || item.slug}</Link>
            <span>
              {item.reason.replace(/_/g, ' ')}
              {item.strength ? ` · ${item.strength}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
