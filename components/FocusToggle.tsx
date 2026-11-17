'use client';

import { useEffect, useState } from 'react';

export default function FocusToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.focus = open ? 'open' : 'closed';
    return () => {
      delete document.documentElement.dataset.focus;
    };
  }, [open]);

  return (
    <button
      type="button"
      className="focus-toggle"
      data-motion="badge"
      data-state={open ? 'open' : 'closed'}
      aria-pressed={open}
      onClick={() => setOpen((value) => !value)}
    >
      {open ? 'Exit focus' : 'Focus reading'}
    </button>
  );
}
