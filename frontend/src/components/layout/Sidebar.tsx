'use client';

import { useApp } from '@/lib/store';
import { Home, List, BarChart3, Clock, Settings, ListChecks, LogOut } from 'lucide-react';
import { ViewType } from '@/types';

const NAV_ITEMS: { icon: typeof Home; label: string; view: ViewType; section?: string; adminOnly?: boolean }[] = [
  { icon: Home, label: 'Dashboard', view: 'dashboard' },
  { icon: List, label: 'Clearance Cases', view: 'cases' },
  { icon: BarChart3, label: 'Reports', view: 'reports' },
  { icon: Clock, label: 'Attendance', view: 'attendance' },
  { icon: Settings, label: 'Settings', view: 'settings' },
  { icon: ListChecks, label: 'Workflow Builder', view: 'builder', section: 'CONFIGURE', adminOnly: true },
];

export function Sidebar() {
  const { state, navigate, logout } = useApp();
  const isNarrow = (state as { vw?: number }).vw !== undefined ? false : true;

  return (
    <>
      {state.navOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[250] lg:hidden"
          onClick={() => navigate(state.view, { navOpen: false })}
        />
      )}
      <aside
        className={`w-[248px] flex-shrink-0 bg-[#0f2034] text-[#aebccd] flex flex-col h-screen
          lg:sticky lg:top-0
          fixed top-0 left-0 z-[300] transition-transform duration-250 ease-in-out
          ${state.navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center gap-3 px-[22px] pt-[22px] pb-6">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-[#2b8af0] to-[#0a6ed1] flex items-center justify-center shadow-[0_4px_12px_rgba(10,110,209,.35)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-white font-semibold text-[14.5px] tracking-wide">ClearPort</div>
            <div className="text-[11px] text-[#6f8198]">Customs Clearance</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3.5">
          {NAV_ITEMS.filter(item => !item.adminOnly || state.currentUser?.role === 'Admin').map((item, i) => {
            const active = state.view === item.view || (item.view === 'cases' && state.view === 'detail');
            const Icon = item.icon;
            return (
              <div key={item.view}>
                {item.section && (
                  <div className="text-[10.5px] font-semibold tracking-[.8px] text-[#5b6e85] px-2.5 pt-3.5 pb-2">
                    {item.section}
                  </div>
                )}
                {i === 0 && (
                  <div className="text-[10.5px] font-semibold tracking-[.8px] text-[#5b6e85] px-2.5 pt-1.5 pb-2">
                    MENU
                  </div>
                )}
                <button
                  onClick={() => navigate(item.view)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 border-none rounded-[10px] text-[13.5px] text-left cursor-pointer transition-colors
                    ${active ? 'bg-[#1d3a5c] text-white font-semibold' : 'bg-transparent text-[#aebccd] font-medium hover:bg-[#1a2f47]'}
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.view === 'cases' && (
                    <span className="ml-auto text-[11px] font-semibold bg-[#1d3a5c] text-[#9fc0e6] px-2 py-0.5 rounded-full">
                      {state.cases.length}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto px-3.5 pb-5">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-[13.5px] font-medium text-[#aebccd] bg-transparent hover:bg-[#1a2f47] hover:text-[#f87171] cursor-pointer transition-colors border-none text-left"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
