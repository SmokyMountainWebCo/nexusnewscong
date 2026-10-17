import Link from 'next/link';
import AskNexus from './AskNexus';
import Clock from './Clock';

const ROOMS = [
  { href: '/summary', id: 'summary', label: 'Summary' },
  { href: '/war-room', id: 'war-room', label: 'War room' },
  { href: '/press', id: 'press', label: 'Press room' },
  { href: '/conspiracy', id: 'conspiracy', label: 'Conspiracy room' },
  { href: '/market-movers', id: 'market-movers', label: 'Market movers' },
  { href: '/account', id: 'account', label: 'Account' },
];

export default function DeskShell({ current, children }: { current: string; children: React.ReactNode }) {
  return (
    <div className="nx-shell">
      <a className="nx-skip" href="#desk">
        Skip to desk
      </a>
      <header className="nx-header">
        <Link href="/summary" className="nx-brand">
          <span className="nx-mark" aria-hidden="true">
            N
          </span>
          <span>
            <span className="nx-brand__name">Nexus</span>
            <span className="nx-brand__sub">News Media</span>
          </span>
        </Link>
        <Clock />
        <AskNexus />
      </header>
      <nav className="nx-tabs" aria-label="Rooms">
        {ROOMS.map((room) => (
          <Link key={room.id} href={room.href} className="nx-tab" aria-current={current === room.id ? 'page' : undefined}>
            {room.label}
          </Link>
        ))}
      </nav>
      <main className="nx-main" id="desk">
        {children}
      </main>
      <footer className="nx-footer">Nexus News Media desk. Stories, claims, and map layers are read from published files.</footer>
    </div>
  );
}
