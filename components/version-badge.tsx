'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CHANGELOG, SITE_VERSION } from '@/lib/changelog';

// Tracks the last version whose patch notes the viewer opened, so the "!" nudge
// shows only until they read the current version's notes — then reappears the
// next time SITE_VERSION changes.
const SEEN_KEY = 'inner-sydney-seen-patch-version';

// Underlined version chip sitting beside the logo. Click to open the patch notes.
// The notes render through a portal on document.body so no navbar/footer stacking
// context can cover them, and background scroll is locked while they're open.
export function VersionBadge() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [seenVersion, setSeenVersion] = useState<string | null>(null);

  // Read the seen-version only after mount so SSR and first client render match.
  useEffect(() => {
    setMounted(true);
    try {
      setSeenVersion(window.localStorage.getItem(SEEN_KEY));
    } catch {
      // localStorage unavailable — the nudge just stays visible; harmless.
    }
  }, []);

  // While open: close on Escape and freeze the page behind the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function openNotes() {
    setOpen(true);
    // Mark the current version as seen — the "!" disappears and won't return until
    // SITE_VERSION is bumped.
    setSeenVersion(SITE_VERSION);
    try {
      window.localStorage.setItem(SEEN_KEY, SITE_VERSION);
    } catch {
      // ignore — nudge will simply reappear next load
    }
  }

  const showNudge = mounted && seenVersion !== SITE_VERSION;

  return (
    <>
      <button type="button" onClick={openNotes} className="inline-flex items-center gap-1" aria-label={`Version ${SITE_VERSION} — view patch notes`}>
        <span className="font-mono text-[11px] font-medium tracking-wide text-ash underline decoration-ash/50 underline-offset-2 transition-colors hover:text-bone">
          {SITE_VERSION}
        </span>
        {showNudge ? (
          <span
            aria-hidden="true"
            title="New updates — click to view what's changed"
            className="grid h-3 w-3 animate-dotPulse place-items-center rounded-full bg-flare font-mono text-[7px] font-black leading-none text-ink"
          >
            !
          </span>
        ) : null}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  className="fixed inset-0 z-[200] flex items-end justify-center bg-ink/70 p-4 backdrop-blur-sm sm:items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Patch notes"
                    className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-line bg-surface p-6 shadow-card"
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                      <div>
                        <p className="eyebrow text-volt">Patch Notes</p>
                        <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-bone">What&apos;s New</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close patch notes"
                        className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ash transition-colors hover:bg-white/5 hover:text-bone"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-5 space-y-6">
                      {CHANGELOG.map((entry) => (
                        <section key={entry.version}>
                          <div className="flex items-baseline gap-3">
                            <span className="rounded-full border border-volt/40 bg-volt/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-volt">
                              {entry.version}
                            </span>
                            {entry.date ? <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">{entry.date}</span> : null}
                          </div>
                          <ul className="mt-3 space-y-2">
                            {entry.changes.map((change, index) => (
                              <li key={index} className="flex gap-2.5 text-sm text-ash">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-volt/70" aria-hidden />
                                <span className="leading-relaxed">{change}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
