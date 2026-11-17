import type { ConstellationGraph } from '@/lib/constellation.ts';

export default function ConstellationList({
  graph,
  hidden = false,
}: {
  graph: ConstellationGraph;
  hidden?: boolean;
}) {
  return (
    <div className={hidden ? 'visually-hidden' : 'constellation__fallback'} data-constellation-fallback="">
      <p className="constellation__lede">
        {graph.hasEditorLinks
          ? 'Stories linked by editor-supplied related items.'
          : 'No editor-supplied related links yet. Stories are shown as unconnected nodes.'}
      </p>
      <ul className="constellation__list">
        {graph.nodes.map((node) => {
          const outgoing = graph.edges.filter((edge) => edge.from === node.slug);
          return (
            <li key={node.slug}>
              <a href={node.href}>{node.title}</a>
              {outgoing.length ? (
                <ul>
                  {outgoing.map((edge) => {
                    const target = graph.nodes.find((item) => item.slug === edge.to);
                    if (!target) return null;
                    return (
                      <li key={`${edge.from}-${edge.to}`}>
                        Linked to <a href={target.href}>{target.title}</a>
                        {edge.reason ? ` — ${edge.reason}` : ''}
                        {edge.strength != null ? ` (strength ${edge.strength})` : ''}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
