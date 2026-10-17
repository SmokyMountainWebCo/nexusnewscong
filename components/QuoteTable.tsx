import { bandFromSeverity, formatDeskDate } from '@/lib/content';
import type { StoryQuote } from '@/lib/desk';

function changeLabel(change: number | null): string {
  if (change == null) return 'n/a';
  const rounded = Math.round(change * 100) / 100;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

export default function QuoteTable({ quotes, storyAsOf }: { quotes: StoryQuote[]; storyAsOf: string | null }) {
  if (!quotes.length) return null;
  const storyWhen = formatDeskDate(storyAsOf);
  return (
    <div className="nx-table-wrap">
      {storyWhen ? <p className="nx-asof">As of {storyWhen}</p> : null}
      <table className="nx-quote-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Last</th>
            <th scope="col">Prev close</th>
            <th scope="col">Change</th>
            <th scope="col">As of</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote, index) => {
            const band = bandFromSeverity(quote.severity);
            const when = formatDeskDate(quote.asOf || storyAsOf);
            return (
              <tr key={`${quote.name}-${index}`}>
                <th scope="row" data-label="Name">{quote.name}</th>
                <td data-label="Last">{quote.last ?? '—'}</td>
                <td data-label="Prev close">{quote.prevClose ?? '—'}</td>
                <td data-label="Change">
                  <span
                    className={`nx-chip nx-chip--${band}`}
                    title={quote.severity != null ? `Severity ${quote.severity} of 10` : undefined}
                  >
                    {changeLabel(quote.changePct)}
                  </span>
                </td>
                <td data-label="As of">{when ?? '—'}</td>
                <td data-label="Source">
                  {quote.url ? (
                    <a href={quote.url} target="_blank" rel="noopener noreferrer">
                      Source
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
