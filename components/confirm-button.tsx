'use client';

import { useState, type ReactNode } from 'react';

// Two-step inline confirm. Replaces window.confirm for destructive actions —
// native dialogs silently return false once a browser suppresses them for the
// tab ("Don't allow this page to create more dialogs"), which made gated actions
// no-op. This can't be suppressed: first click arms, second click confirms.
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Confirm',
  className = '',
  busyLabel = 'Working…'
}: {
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
  confirmLabel?: string;
  className?: string;
  busyLabel?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className={className}>
        {children}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
            setArmed(false);
          } finally {
            setBusy(false);
          }
        }}
        className={`${className} disabled:opacity-40`}
      >
        {busy ? busyLabel : confirmLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setArmed(false)}
        className="rounded-2xl border border-line bg-ink/50 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ash transition-colors hover:text-bone disabled:opacity-40"
      >
        Cancel
      </button>
    </span>
  );
}
