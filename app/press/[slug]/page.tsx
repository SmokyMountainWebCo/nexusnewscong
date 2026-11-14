import GlobePanel from '@/components/GlobePanel';
import StoryArticle from '@/components/StoryArticle';
import { loadBriefs, loadSearch, loadSourcePacks, loadStories, storyFromSearch } from '@/lib/published';

export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = new Set<string>();
  for (const story of loadStories().stories) slugs.add(story.card.slug);
  for (const story of loadSearch()) slugs.add(story.slug);
  return [...slugs].map((slug) => ({ slug }));
}

export default async function PressStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const indexed = loadStories().stories.find((item) => item.card.slug === slug) || null;
  const searchStory = loadSearch().find((item) => item.slug === slug) || null;
  const story = indexed && !indexed.missing ? indexed : searchStory ? storyFromSearch(searchStory) : indexed;
  const pack = loadSourcePacks()[slug] || null;
  const questions = loadBriefs()[slug] || [];
  return (
    <section className="room">
      {story ? (
        <StoryArticle story={story} pack={pack} questions={questions} searchStory={searchStory} />
      ) : (
        <h2>This story is not in the index</h2>
      )}
      <GlobePanel storySlug={slug} />
    </section>
  );
}
