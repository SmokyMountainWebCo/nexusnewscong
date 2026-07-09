import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './brodys.css';

export const metadata: Metadata = {
  title: "Brody's Low-Voltage & Cabling Services",
  description:
    'Structured cabling, security cameras, access control, A/V and network installs — done clean, tested, and certified. Interactive estimates and live wiring demos.',
};

export default function BrodysLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
