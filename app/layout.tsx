import type { Metadata } from 'next';
import DeskShell from '@/components/DeskShell';
import MotionLayer from '@/components/MotionLayer';
import './globals.css';
import './motion.css';

export const metadata: Metadata = {
  title: 'Nexus',
  description: 'Nexus desk. The war room frames God\'s Eye View.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MotionLayer />
        <DeskShell>{children}</DeskShell>
      </body>
    </html>
  );
}
