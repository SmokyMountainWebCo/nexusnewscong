import { formatDeskDate } from '@/lib/content';
import type { Claim } from '@/lib/desk';

export default function ClaimList({ claims, catalog, title }: { claims: Claim[]; catalog?: Claim[]; title?: string }) {
  if (!claims.length) return null;
  const byId = new Map((catalog || claims).map((claim) => [claim.id, claim]));
  return (
    <section className="nx-claims" aria-label={title || 'Claims'}>
      {title ? <h3>{title}</h3> : null}
      <ul>
        {claims.map((claim) => (
          <li key={claim.id} className="nx-claim">
            <p>{claim.text}</p>
            <p className="nx-meta">
              {claim.confidence != null ? <span className="nx-confidence">Confidence {claim.confidence}</span> : null}
              {claim.timestamp ? ` · ${formatDeskDate(claim.timestamp) || claim.timestamp}` : ''}
            </p>
            {claim.contradictions.length ? (
              <p className="nx-flag" role="status">
                Contradiction flagged
                {claim.contradictions.map((id) => (
                  <span key={id}> {id}{byId.get(id)?.text ? `: ${byId.get(id)?.text}` : ''}</span>
                ))}
              </p>
            ) : null}
            {claim.sources.length ? (
              <ol className="nx-source-links">
                {claim.sources.map((source) =>
                  source.url ? (
                    <li key={source.url}>
                      <a href={source.url}>{source.name || source.url}</a>
                    </li>
                  ) : null
                )}
              </ol>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
