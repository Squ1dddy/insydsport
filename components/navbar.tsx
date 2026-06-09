'use client';

import { useState } from 'react';
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
      className="h-10 w-auto shrink-0 object-contain md:h-12" 
    />
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data } = useTournament();
  const [isOpen, setIsOpen] = useState(false);
  const liveMatches = data?.matches.filter((match) => match.status === 'live').length || 0;

  return (
    <header className="sticky top-0 z-50 border-b border-secondary/50 bg-[#0b1320]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 md:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <div className="hidden md:block">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-gold">Inner Sydney</p>
            <p className="text-lg font-black uppercase tracking-[0.18em] text-slate-100">Handball Knockout</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {liveMatches > 0 ? <LiveIndicator /> : null}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-sm font-bold transition hover:scale-105 duration-200 ${
                pathname === item.href ? 'bg-gold text-primary' : 'text-textMuted hover:bg-secondary hover:text-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Hamburger */}
        <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary md:hidden" onClick={() => setIsOpen(!isOpen)}>
            <div className="flex flex-col gap-1">
                <span className={`h-0.5 w-6 rounded-full bg-slate-100 transition-transform ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`h-0.5 w-6 rounded-full bg-slate-100 ${isOpen ? 'opacity-0' : ''}`}></span>
                <span className={`h-0.5 w-6 rounded-full bg-slate-100 transition-transform ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </div>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <nav className="flex flex-col border-t border-secondary bg-primary p-4 md:hidden">
          {liveMatches > 0 ? <div className="mb-2"><LiveIndicator /></div> : null}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-12 items-center rounded-xl px-4 text-sm font-bold transition ${
                pathname === item.href ? 'bg-gold text-primary' : 'text-textMuted'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
