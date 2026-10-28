/** Two stacked chevrons — a ridge line — plus the wordmark. */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M2 22 L16 8 L30 22 L24 22 L16 14 L8 22 Z" fill="#ff6a1a" />
      <path d="M8 28 L16 20 L24 28 Z" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="h-7 w-7" />
      <span className="display text-[1.05rem] tracking-[-0.02em]">Ironridge</span>
    </span>
  );
}
