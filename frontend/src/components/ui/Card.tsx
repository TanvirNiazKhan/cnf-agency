'use client';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: string;
}
export function Card({ children, className = '', onClick, padding = 'p-5' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#e8ecf1] shadow-[0_1px_3px_rgba(15,32,52,.06)] ${padding} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
