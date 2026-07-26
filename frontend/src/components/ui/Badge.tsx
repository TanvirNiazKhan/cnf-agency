'use client';
interface BadgeProps {
  label: string;
  color: string;
  bg: string;
  className?: string;
}
export function Badge({ label, color, bg, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap ${className}`}
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}
