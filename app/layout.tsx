import type { Metadata } from 'next';
import DeskShell from '@/components/DeskShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nexus',
  description: 'Nexus desk. The war room frames God\'s Eye View.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DeskShell>{children}</DeskShell>
      </body>
    </html>
  );
}
