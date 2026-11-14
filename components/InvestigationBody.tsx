import MarkdownBody from './MarkdownBody';
import type { Canary, Conclusion, InvestigationView } from '@/lib/investigation';

function Badge({ tone, label }: { tone: Conclusion['tone']; label: string | null }) {
  if (!label) return null;
  return <span className={`confidence confidence--${tone || 'other'}`}>{label}</span>;
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
            {canary.sourceUrl ? (
              <a href={canary.sourceUrl} target="_blank" rel="noopener noreferrer">
                {canary.sourceLabel || canary.sourceUrl}
              </a>
            ) : canary.sourceLabel ? (
              <span>{canary.sourceLabel}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
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
          {bottom?.body ? <MarkdownBody source={bottom.body} /> : null}
          <Conclusions items={view.conclusions} />
        </section>
      ) : null}
      <CanaryList canaries={view.canaries} />
    </div>
  );
}
