'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AskNexus from './AskNexus';
import CommandPalette from './CommandPalette';

const ROOMS = [
  { href: '/', label: 'Summary', match: ['/', '/summary'] },
  { href: '/war-room', label: 'War room', match: ['/war-room'] },
  { href: '/press', label: 'Press room', match: ['/press'] },
  { href: '/conspiracy', label: 'Conspiracy room', match: ['/conspiracy'] },
  { href: '/markets', label: 'Market movers', match: ['/markets', '/market-movers'] },
  { href: '/account', label: 'Account', match: ['/account'] },
];

function cleanPath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

export default function DeskShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) + ' EDT');
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="desk">
      <header className="desk__header">
        <Link href="/" className="desk__brand">
          <span className="desk__mark" aria-hidden="true">N</span>
          <span>Nexus</span>
        </Link>
        <time className="desk__clock">{time}</time>
        <CommandPalette />
        <AskNexus />
        <button type="button" className="desk__nav-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          Rooms
        </button>
      </header>
      <nav className={open ? 'desk__nav is-open' : 'desk__nav'} aria-label="Rooms">
        {ROOMS.map((room) => {
          const path = cleanPath(pathname || '/');
          const current = room.match.some((item) => path === item || (item !== '/' && path.startsWith(`${item}/`)));
          return (
            <Link key={room.href} href={room.href} aria-current={current ? 'page' : undefined} onClick={() => setOpen(false)}>
              {room.label}
            </Link>
          );
        })}
      </nav>
      <main className="desk__main">{children}</main>
    </div>
  );
}
