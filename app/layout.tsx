import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { TournamentProvider } from '@/components/tournament-provider';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

// Real site origin, used to make share-preview (Open Graph) image URLs absolute.
// Netlify injects `URL` automatically at build time; NEXT_PUBLIC_SITE_URL can
// override it (e.g. a custom domain). The bit.ly link is just the share alias —
// it redirects here, where these tags live.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || 'https://inner-sydney-handball.netlify.app';
const siteTitle = 'Inner Sydney Handball Knockout';
const siteDescription =
  'Live bracket, scores, and results for the Inner Sydney Handball Knockout — Season 1, 2026. Follow every match in real time.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: '/',
    siteName: siteTitle,
    type: 'website',
    images: [{ url: '/images/school-emblem.png', alt: siteTitle }]
  },
  twitter: {
    card: 'summary',
    title: siteTitle,
    description: siteDescription,
    images: ['/images/school-emblem.png']
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <TournamentProvider>
          <Navbar />
          <main className="mx-auto min-h-screen w-full px-6 py-6 md:px-8 lg:px-10">{children}</main>
        </TournamentProvider>
      </body>
    </html>
  );
}
