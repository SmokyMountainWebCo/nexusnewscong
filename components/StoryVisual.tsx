import StoryCover from './StoryCover';
import type { StoryImage } from '@/lib/images';

export default function StoryVisual({
  image,
  slug,
  eventType,
  verdictType,
  title,
  variant,
}: {
  image: StoryImage | null;
  slug: string;
  eventType: string | null;
  verdictType: string | null;
  title: string;
  variant: 'hero' | 'thumb';
}) {
  if (!image) {
    return (
      <figure className={`visual visual--${variant} is-illustration`}>
        <StoryCover slug={slug} eventType={eventType} verdictType={verdictType} title={title} />
        <figcaption>Illustration</figcaption>
      </figure>
    );
  }
  return (
    <figure className={`visual visual--${variant}`}>
      <img src={image.src} alt={image.alt} width={1600} height={900} loading="lazy" />
      {variant === 'hero' ? (
        <figcaption>
          {[image.credit, image.license].filter(Boolean).join(' · ')}
          {image.sourceUrl ? (
            <>
              {image.credit || image.license ? ' · ' : null}
              <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">
                Source
              </a>
            </>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
