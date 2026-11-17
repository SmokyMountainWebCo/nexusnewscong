'use client';

import { ViewTransition, type ReactNode } from 'react';

export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="room-enter" exit="room-exit" default="none">
      {children}
    </ViewTransition>
  );
}
