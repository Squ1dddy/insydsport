'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiveIndicator } from '@/components/live-indicator';
import { useTournament } from '@/components/tournament-provider';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/brackets', label: 'Brackets' },
  { href: '/history', label: 'Match History' },
  { href: '/admin', label: 'Admin' }
];

function Logo() {
  return (
    <img 
      src="/images/school-emblem.png" 
      alt="Inner Sydney school emblem" 
      className="h-12 w-auto shrink-0 object-contain" 
    />
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data } = useTournament();
  const liveMatches = data?.matches.filter((match) => match.status === 'live').length || 0;

  return (
    <header className="sticky top-0 z-50 border-b border-secondary/50 bg-[#0b1320]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-6 py-3 md:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-gold">Inner Sydney</p>
            <p className="text-lg font-black uppercase tracking-[0.18em] text-slate-100">Handball Knockout</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {liveMatches > 0 ? <LiveIndicator /> : null}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-sm font-bold transition hover:scale-105 duration-200 ${
                pathname === item.href ? 'bg-gold text-[#0f1c2e]' : 'text-textMuted hover:bg-secondary hover:text-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
