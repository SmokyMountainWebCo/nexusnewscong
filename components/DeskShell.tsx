'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AskNexus from './AskNexus';

const ROOMS = [
  { href: '/', label: 'Summary' },
  { href: '/war-room', label: 'War room' },
  { href: '/press', label: 'Press room' },
  { href: '/conspiracy', label: 'Conspiracy room' },
  { href: '/markets', label: 'Market movers' },
  { href: '/account', label: 'Account' },
];

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
        <AskNexus />
        <button type="button" className="desk__nav-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          Rooms
        </button>
      </header>
      <nav className={open ? 'desk__nav is-open' : 'desk__nav'} aria-label="Rooms">
        {ROOMS.map((room) => {
          const current = room.href === '/' ? pathname === '/' : pathname === room.href || pathname.startsWith(`${room.href}/`);
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
