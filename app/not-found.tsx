import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.45em] text-gold">Error 404</p>
      <h1 className="mt-3 text-4xl font-black uppercase leading-tight text-slate-100 lg:text-5xl">Page not found</h1>
      <p className="mt-3 text-sm text-textMuted">That page isn&apos;t part of the tournament. Let&apos;s get you back to the action.</p>
      <Link
        href="/"
        className="mt-6 rounded-2xl bg-gold px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-primary transition-all duration-200 hover:scale-105"
      >
        Back to home
      </Link>
    </div>
  );
}
