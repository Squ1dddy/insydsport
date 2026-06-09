'use client';

import { useEffect, useRef, useState } from 'react';

export function ScoreButton({
  label,
  onConfirm,
  tone = 'yellow'
}: {
  label: string;
  onConfirm: () => void;
  tone?: 'yellow' | 'slate';
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!armed) {
      return;
    }

    timer.current = window.setTimeout(() => setArmed(false), 1500);
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, [armed]);

  const base =
    tone === 'yellow'
      ? 'border-win/40 bg-win/15 text-win hover:bg-win/25'
      : 'border-white/15 bg-white/5 text-white hover:bg-white/10';

  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
          return;
        }
        setArmed(true);
      }}
      className={`min-h-14 w-full rounded-2xl border px-4 py-3 text-sm font-extrabold transition ${base} ${armed ? 'animate-scorePop ring-2 ring-win/70' : ''}`}
    >
      {armed ? 'Tap again to confirm' : label}
    </button>
  );
}
