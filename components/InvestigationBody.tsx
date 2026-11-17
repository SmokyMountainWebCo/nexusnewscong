import MarkdownBody from './MarkdownBody';
import { splitConfidenceBullets, type Canary, type Conclusion, type InvestigationView } from '@/lib/investigation';

function Badge({ tone, label }: { tone: Conclusion['tone']; label: string | null }) {
  if (!label) return null;
  return <span className={`confidence confidence--${tone || 'other'}`}>{label}</span>;
}

function CanarySource({ canary }: { canary: Canary }) {
  if (canary.sourceParts.length) {
    return (
      <p className="watch__source">
        {canary.sourceParts.map((part, index) =>
          part.href ? (
            <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">
              {part.text}
            </a>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </p>
    );
  }
  if (canary.sourceUrl) {
    return (
      <p className="watch__source">
        <a href={canary.sourceUrl} target="_blank" rel="noopener noreferrer">
          {canary.sourceLabel || canary.sourceUrl}
        </a>
      </p>
    );
  }
  if (canary.sourceLabel) return <p className="watch__source">{canary.sourceLabel}</p>;
  return null;
}

function CanaryList({ canaries }: { canaries: Canary[] }) {
  if (!canaries.length) return null;
  return (
    <section className="watch" aria-label="What to watch">
      <h3>What to watch (30–90 days)</h3>
      <ul>
        {canaries.map((canary, index) => (
          <li key={`${canary.indicator}-${index}`}>
            <p>{canary.indicator}</p>
            {canary.when ? <p className="watch__when">{canary.when}</p> : null}
            <CanarySource canary={canary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function BottomSection({ body, conclusions }: { body: string; conclusions: Conclusion[] }) {
  if (!conclusions.length) return body ? <MarkdownBody source={body} /> : null;
  const split = splitConfidenceBullets(body);
  return (
    <>
      {split.removed && split.before ? <MarkdownBody source={split.before} /> : null}
      {!split.removed && body ? <MarkdownBody source={body} /> : null}
      <Conclusions items={conclusions} />
      {split.removed && split.after ? <MarkdownBody source={split.after} /> : null}
    </>
  );
}

function Conclusions({ items }: { items: Conclusion[] }) {
  if (!items.length) return null;
  return (
    <ul className="conclusions">
      {items.map((item, index) => (
        <li key={`${item.text}-${index}`}>
          <Badge tone={item.tone} label={item.label} />
          {item.text ? <p>{item.text}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export default function InvestigationBody({ view }: { view: InvestigationView }) {
  const bottom = view.sections.find((section) => section.id === 'bottom');
  const others = view.sections.filter((section) => section.id !== 'bottom');
  return (
    <div className="investigation">
      {view.developing || view.asOf ? (
        <p className="investigation__meta">
          {view.developing ? <span className="developing">Developing</span> : null}
          {view.asOf ? <span>As of {view.asOf}</span> : null}
        </p>
      ) : null}
      {view.storyLabel ? (
        <p className="investigation__story-confidence">
          <Badge tone={view.storyTone} label={view.storyLabel} />
        </p>
      ) : null}
      {view.intro ? <MarkdownBody source={view.intro} /> : null}
      {others.map((section) => (
        <section key={section.id} className={`investigation__section investigation__section--${section.id}`}>
          <h3>{section.title}</h3>
          {section.body ? <MarkdownBody source={section.body} /> : null}
        </section>
      ))}
      {bottom || view.conclusions.length ? (
        <section className="investigation__section investigation__section--bottom">
          <h3>{bottom?.title || 'Bottom line / conclusions'}</h3>
          <BottomSection body={bottom?.body || ''} conclusions={view.conclusions} />
        </section>
      ) : null}
      <CanaryList canaries={view.canaries} />
    </div>
  );
}
