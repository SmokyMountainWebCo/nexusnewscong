import type { TrailStep } from '@/lib/trail';

const STATUS_LABEL: Record<TrailStep['status'], string | null> = {
  verified: 'Verified',
  unverified: 'Unverified',
  disproven: 'Disproven',
  neutral: null,
};

function Step({ step }: { step: TrailStep }) {
  const statusLabel = STATUS_LABEL[step.status];
  return (
    <li
      className={`trail__step trail__step--${step.stage}${step.status === 'disproven' ? ' is-disproven' : ''}`}
      style={{ gridColumn: step.stage + 1 }}
      aria-label={`${step.stageName}, ${statusLabel || 'status not set'}. ${step.label}`}
    >
      <p className="trail__stage">{step.stageName}</p>
      {statusLabel ? <span className={`trail__status trail__status--${step.status}`}>{statusLabel}</span> : null}
      <p className="trail__label">{step.label}</p>
      {step.at ? <p className="trail__when">{step.at}</p> : null}
      {step.stage === 0 ? (
        <>
          {step.platform ? <p className="trail__platform">{step.platform}</p> : null}
          <p className="trail__lead">Lead only, not a source</p>
        </>
      ) : step.sourceHref ? (
        <a className={step.stage === 2 ? 'trail__link trail__link--primary' : 'trail__link'} href={step.sourceHref} target="_blank" rel="noopener noreferrer">
          {step.sourceLabel}
        </a>
      ) : step.sourceLabel ? (
        <p className="trail__platform">{step.sourceLabel}</p>
      ) : null}
    </li>
  );
}

export default function VerificationTrail({ steps }: { steps: TrailStep[] }) {
  if (!steps.length) return null;
  const visible = steps.length > 6 ? steps.slice(0, 6) : steps;
  const extra = steps.length > 6 ? steps.slice(6) : [];
  return (
    <section className="trail" aria-label="Origin and verification trail">
      <h3>Origin &amp; Verification Trail</h3>
      <div className="trail__stages" aria-hidden="true">
        <span>Origin signal</span>
        <span>X triangulation</span>
        <span>Primary record</span>
      </div>
      <ol className="trail__steps">
        {visible.map((step, index) => (
          <Step key={`${step.stage}-${index}`} step={step} />
        ))}
      </ol>
      {extra.length ? (
        <details className="trail__more">
          <summary>
            Show {extra.length} more {extra.length === 1 ? 'step' : 'steps'}
          </summary>
          <ol className="trail__steps" start={visible.length + 1}>
            {extra.map((step, index) => (
              <Step key={`more-${step.stage}-${index}`} step={step} />
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
