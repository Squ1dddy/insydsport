'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Notification, NotificationLevel } from '@/types/tournament';

const STORAGE_KEY = 'inner-sydney-dismissed-notifications';

// Per-device dismissal: an admin posts an announcement once and every viewer can
// dismiss it independently (there are no user accounts). Dismissed ids persist in
// localStorage so a banner stays gone across reloads until the admin removes it.
function readDismissed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

const levelStyles: Record<NotificationLevel, { wrap: string; chip: string; label: string }> = {
  info: {
    wrap: 'border-volt/30 bg-surface',
    chip: 'border-volt/40 bg-volt/10 text-volt',
    label: 'Notice'
  },
  warning: {
    wrap: 'border-amber-400/40 bg-amber-400/[0.06]',
    chip: 'border-amber-400/40 bg-amber-400/15 text-amber-200',
    label: 'Important'
  },
  success: {
    wrap: 'border-emerald-400/40 bg-emerald-400/[0.06]',
    chip: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200',
    label: 'Update'
  }
};

export function NotificationBanner({ notifications }: { notifications: Notification[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Read dismissals only after mount so SSR and the first client render match
  // (avoids a hydration mismatch and a flash of already-dismissed banners).
  useEffect(() => {
    setDismissed(readDismissed());
    setMounted(true);
  }, []);

  function dismiss(id: string) {
    setDismissed((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — banner will reappear next load; acceptable.
      }
      return next;
    });
  }

  if (!mounted) return null;

  const visible = notifications.filter((n) => n.active && !dismissed.includes(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {visible.map((notification) => {
          const styles = levelStyles[notification.level] || levelStyles.info;
          return (
            <motion.section
              key={notification.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`flex items-start gap-3 overflow-hidden rounded-3xl border px-5 py-4 shadow-card lg:px-6 ${styles.wrap}`}
            >
              <span className={`mt-0.5 shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.24em] ${styles.chip}`}>
                {styles.label}
              </span>
              <div className="min-w-0 flex-1">
                {notification.title ? (
                  <p className="font-display text-base uppercase leading-tight tracking-wide text-bone">{notification.title}</p>
                ) : null}
                <p className={`${notification.title ? 'mt-1 ' : ''}whitespace-pre-line break-words text-sm text-ash`}>{notification.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(notification.id)}
                aria-label="Dismiss notification"
                className="-mr-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ash transition-colors hover:bg-white/5 hover:text-bone"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
