import DeskShell from '@/components/DeskShell';
import StoryArticle from '@/components/StoryArticle';
import { loadBriefs, loadSearch, loadSourcePacks, loadStories, storyFromSearch } from '@/lib/published';

export function generateStaticParams() {
  const slugs = new Set<string>();
  for (const story of loadStories().stories) slugs.add(story.card.slug);
  for (const story of loadSearch()) slugs.add(story.slug);
  return [...slugs].map((slug) => ({ slug }));
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const indexed = loadStories().stories.find((item) => item.card.slug === slug) || null;
  const market = loadSearch().find((item) => item.slug === slug) || null;
  const story = indexed && !indexed.missing ? indexed : market ? storyFromSearch(market) : indexed;
  const pack = loadSourcePacks()[slug] || null;
  const questions = loadBriefs()[slug] || [];
  return (
    <DeskShell current="press">
      {story ? (
        <StoryArticle story={story} pack={pack} questions={questions} market={market} />
      ) : (
        <div className="nx-empty" role="status">
          <strong>This story is not in the index</strong>
        </div>
      )}
    </DeskShell>
  );
}
