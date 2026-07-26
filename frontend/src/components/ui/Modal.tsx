'use client';
import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}
export function Modal({ open, onClose, title, children, width = '540px' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-auto"
        style={{ width, maxWidth: '95vw' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ecf1]">
          <h3 className="text-[16px] font-bold text-[#16222e]">{title}</h3>
          <button onClick={onClose} className="text-[#9aa6b4] hover:text-[#16222e] text-xl leading-none cursor-pointer">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
