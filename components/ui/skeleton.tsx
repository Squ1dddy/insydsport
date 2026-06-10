export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-line/60 bg-gradient-to-br from-surface to-surface2 ${className}`}
    />
  );
}
