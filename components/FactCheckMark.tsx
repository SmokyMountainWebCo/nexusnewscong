import { factCheckLabel, factCheckRating, isFactCheckStory, type SearchStory } from '@/lib/desk';

export function factCheckCardClass(story: SearchStory): string {
  if (!isFactCheckStory(story)) return 'nx-story-card';
  return `nx-story-card nx-story-card--${factCheckLabel(story.verdictType).tone}`;
}

export default function FactCheckMark({ story }: { story: SearchStory }) {
  if (!isFactCheckStory(story)) return null;
  const verdict = factCheckLabel(story.verdictType);
  const rating = factCheckRating(story.rating);
  return (
    <div className="nx-fact">
      <span className={`nx-verdict nx-verdict--${verdict.tone}`}>{verdict.label}</span>
      {rating ? <p className="nx-rating">{rating}</p> : null}
    </div>
  );
}
