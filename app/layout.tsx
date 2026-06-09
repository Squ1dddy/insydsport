import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { TournamentProvider } from '@/components/tournament-provider';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Inner Sydney Handball Knockout',
  description: 'Live handball bracket platform for Inner Sydney High School.'
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
