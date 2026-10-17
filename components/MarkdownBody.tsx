import { parseMarkdown, type Inline } from '@/lib/content';

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((item, index) => {
        if (item.t === 'strong') return <strong key={index}>{item.v}</strong>;
        if (item.t === 'em') return <em key={index}>{item.v}</em>;
        if (item.t === 'code') return <code key={index}>{item.v}</code>;
        if (item.t === 'link') {
          const external = !item.href.startsWith('/');
          return (
            <a key={index} href={item.href} rel={external ? 'noopener noreferrer' : undefined} target={external ? '_blank' : undefined}>
              {item.v}
            </a>
          );
        }
        return <span key={index}>{item.v}</span>;
      })}
    </>
  );
}

export default function MarkdownBody({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className="nx-prose">
      {blocks.map((block, index) => {
        if (block.t === 'h') {
          const Tag = block.level === 2 ? 'h2' : block.level === 3 ? 'h3' : 'h4';
          return (
            <Tag key={index}>
              <Inlines items={block.inlines} />
            </Tag>
          );
        }
        if (block.t === 'ul' || block.t === 'ol') {
          const Tag = block.t;
          return (
            <Tag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inlines items={item} />
                </li>
              ))}
            </Tag>
          );
        }
        if (block.t === 'quote') {
          return (
            <blockquote key={index}>
              <Inlines items={block.inlines} />
            </blockquote>
          );
        }
        if (block.t === 'hr') return <hr key={index} />;
        return (
          <p key={index}>
            <Inlines items={block.inlines} />
          </p>
        );
      })}
    </div>
  );
}
