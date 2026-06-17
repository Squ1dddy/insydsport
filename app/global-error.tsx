'use client';

// Last-resort boundary: replaces the ROOT layout if it (or its providers) throws,
// so it must render its own <html>/<body>. globals.css may not be applied here
// (the layout that imports it failed), so the fallback uses inline styles to stay
// legible and on-brand no matter what.

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Fatal app error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0b',
          color: '#e7e5e4',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          textAlign: 'center',
          padding: '1.5rem'
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <p style={{ letterSpacing: '0.45em', textTransform: 'uppercase', fontSize: '11px', fontWeight: 800, color: '#f4c430', margin: 0 }}>
            Something broke
          </p>
          <h1 style={{ marginTop: '0.75rem', fontSize: '2.25rem', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>
            We hit a snag
          </h1>
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#a8a29e' }}>
            The app ran into an unexpected error. Please reload — your scores are safe.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              borderRadius: '1rem',
              border: 'none',
              background: '#f4c430',
              color: '#0a0a0b',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
