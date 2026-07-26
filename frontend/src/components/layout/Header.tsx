'use client';

import { useApp } from '@/lib/store';
import { Search, Menu, Plus, Bell } from 'lucide-react';
import { getInitials } from '@/lib/data';

export function Header() {
  const { state, set } = useApp();

  return (
    <header className="flex items-center gap-4 px-4 py-2.5 md:px-7 md:py-3.5 bg-white border-b border-[#e4e8ee] sticky top-0 z-20">
      <button
        className="lg:hidden p-1.5 rounded-lg hover:bg-[#f4f6f9] cursor-pointer"
        onClick={() => set({ navOpen: !state.navOpen })}
      >
        <Menu size={20} className="text-[#5b6b7b]" />
      </button>

      <div className="relative flex-1 min-w-0 max-w-[420px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa6b4]" />
        <input
          type="text"
          placeholder="Search BL, importer, C-number…"
          value={state.search}
          onChange={e => set({
            search: e.target.value,
            page: 1,
            view: state.view === 'dashboard' && e.target.value ? 'cases' : state.view,
          })}
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e4e8ee] bg-[#f8f9fb] text-[13.5px] text-[#16222e] placeholder:text-[#b0b8c4] focus:outline-none focus:border-[#0a6ed1] focus:bg-white transition"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5 md:gap-4">
        <span className="hidden md:block text-[12.5px] text-[#7b8794] font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>

        <button
          onClick={() => set({ modalOpen: true, formError: '' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0a6ed1] text-white rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-[#0960b8] transition shadow-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Case</span>
        </button>

        <button className="relative p-2 rounded-xl hover:bg-[#f4f6f9] cursor-pointer">
          <Bell size={18} className="text-[#5b6b7b]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#dc2626] rounded-full" />
        </button>

        <div className="hidden md:flex items-center gap-2.5">
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[12px] font-bold"
            style={{ background: '#0a6ed1' }}
          >
            {getInitials(state.settings.name)}
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[#16222e]">{state.settings.name}</div>
            <div className="text-[11px] text-[#7b8794]">{state.settings.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
