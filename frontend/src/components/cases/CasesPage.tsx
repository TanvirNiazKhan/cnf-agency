'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { CHANNEL_META, PAGE_SIZE } from '@/lib/constants';
import { progressOf, isCompleted } from '@/lib/workflow';
import { Case, SortKey } from '@/types';

const CARD_FILTERS: Record<string, { label: string; fn: (c: Case, wfLen: number) => boolean }> = {
  all: { label: 'All Cases', fn: () => true },
  pendingVetting: { label: 'Pending Vetting', fn: (c) => c.currentStep < 2 },
  waitingEntry: { label: 'Waiting Entry', fn: (c) => c.currentStep >= 2 && c.currentStep <= 3 },
  waiting: { label: 'Waiting C-Number', fn: (c) => !c.cNumber },
  green: { label: 'Green Channel', fn: (c) => c.channel === 'green' },
  yellow: { label: 'Yellow Channel', fn: (c) => c.channel === 'yellow' },
  red: { label: 'Red Channel', fn: (c) => c.channel === 'red' },
  underExam: { label: 'Under Examination', fn: (c) => c.currentStep >= 8 && c.currentStep <= 11 },
  waitingRO: { label: 'Waiting RO', fn: (c) => c.currentStep === 11 },
  ready: { label: 'Ready for Delivery', fn: (c, wfLen) => c.currentStep >= 12 && !isCompleted(c, wfLen) },
  completed: { label: 'Completed', fn: (c, wfLen) => isCompleted(c, wfLen) },
};

function ZoneBadge({ channel }: { channel: string }) {
  const meta = CHANNEL_META[channel];
  if (!meta) return <span className="text-[12px] text-[#7b8794]">--</span>;
  const letter = meta[0][0];
  return (
    <span
      className="inline-flex items-center justify-center w-[22px] h-[22px] rounded text-[11px] font-bold"
      style={{ background: meta[2], color: meta[1] }}
    >
      {letter}
    </span>
  );
}

function BoolCell({ val }: { val: boolean }) {
  return val
    ? <span className="text-[#16a34a] font-semibold text-[13px]">&#10003;</span>
    : <span className="text-[#c5ccd6] text-[13px]">&#10007;</span>;
}

export function CasesPage() {
  const { state, set, navigate, deleteCase } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteTarget = deleteId ? state.cases.find(c => c.id === deleteId) : null;
  const { cases, workflow, search, channelFilter, importerFilter, dayFilter, activeFilter, cardFilter, sortKey, page } = state;

  const importers = useMemo(() => {
    return state.importers.map(i => i.name).sort();
  }, [state.importers]);

  const days = useMemo(() => {
    const s = new Set<string>();
    cases.forEach(c => { if (c.arrival && c.arrival !== '—') s.add(c.arrival); });
    return Array.from(s).sort().reverse();
  }, [cases]);

  const wfLen = workflow.length;

  const filtered = useMemo(() => {
    let list = [...cases];

    if (cardFilter && CARD_FILTERS[cardFilter]) {
      list = list.filter(c => CARD_FILTERS[cardFilter].fn(c, wfLen));
    }

    if (channelFilter !== 'all') {
      list = list.filter(c => c.channel === channelFilter);
    }

    if (importerFilter !== 'all') {
      list = list.filter(c => c.importer === importerFilter);
    }

    if (dayFilter !== 'all') {
      list = list.filter(c => c.arrival === dayFilter || c.received === dayFilter);
    }

    if (activeFilter === 'active') {
      list = list.filter(c => !isCompleted(c, wfLen));
    } else if (activeFilter === 'inactive') {
      list = list.filter(c => isCompleted(c, wfLen));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.bl.toLowerCase().includes(q) ||
        c.importer.toLowerCase().includes(q) ||
        c.serial.toLowerCase().includes(q) ||
        c.lc.toLowerCase().includes(q) ||
        c.cNumber.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortKey) {
        case 'newest': return b.seq - a.seq;
        case 'progress': return progressOf(workflow, b) - progressOf(workflow, a);
        case 'channel': return (a.channel || 'z').localeCompare(b.channel || 'z');
        case 'importer': return a.importer.localeCompare(b.importer);
        case 'bl': return a.bl.localeCompare(b.bl);
        default: return b.seq - a.seq;
      }
    });

    return list;
  }, [cases, cardFilter, channelFilter, importerFilter, dayFilter, activeFilter, search, sortKey, wfLen, workflow]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilters = channelFilter !== 'all' || importerFilter !== 'all' || dayFilter !== 'all' || activeFilter !== 'all' || !!cardFilter;

  const channelChips: { key: string; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#0a6ed1' },
    { key: 'green', label: 'Green', color: '#16a34a' },
    { key: 'yellow', label: 'Yellow', color: '#ca8a04' },
    { key: 'red', label: 'Red', color: '#dc2626' },
  ];

  const activeChips: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
  ];

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'newest', label: 'Newest' },
    { key: 'progress', label: 'Progress' },
    { key: 'channel', label: 'Channel' },
    { key: 'importer', label: 'Importer' },
    { key: 'bl', label: 'BL Number' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-[#16222e]">Clearance Cases</h1>
          <p className="text-[13px] text-[#7b8794] mt-0.5">{filtered.length} case{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => set({ modalOpen: true, formError: '', importerNew: false, form: { bl: '', invoice: '', pkg: '', importer: '', supplier: '', vessel: '', container: '', arrival: '', invoiceValue: '', remarks: '' } })}
          className="h-9 px-4 rounded-lg bg-[#0a6ed1] text-white text-[13px] font-semibold hover:bg-[#0860b6] transition-colors cursor-pointer"
        >
          + New Case
        </button>
      </div>

      {/* Toolbar */}
      <Card className="mb-4" padding="px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Channel chips */}
          <div className="flex items-center gap-1 rounded-lg bg-[#f4f6f8] p-0.5">
            {channelChips.map(ch => (
              <button
                key={ch.key}
                onClick={() => set({ channelFilter: ch.key, page: 1 })}
                className="px-3 py-1 rounded-md text-[12px] font-semibold transition-colors cursor-pointer"
                style={{
                  background: channelFilter === ch.key ? '#fff' : 'transparent',
                  color: channelFilter === ch.key ? ch.color : '#7b8794',
                  boxShadow: channelFilter === ch.key ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Importer dropdown */}
          <select
            value={importerFilter}
            onChange={e => set({ importerFilter: e.target.value, page: 1 })}
            className="h-8 px-2.5 rounded-lg border border-[#e8ecf1] text-[12px] text-[#5b6b7b] bg-white cursor-pointer outline-none"
          >
            <option value="all">All Importers</option>
            {importers.map(imp => (
              <option key={imp} value={imp}>{imp}</option>
            ))}
          </select>

          {/* Day (arrival) dropdown */}
          <select
            value={dayFilter}
            onChange={e => set({ dayFilter: e.target.value, page: 1 })}
            className="h-8 px-2.5 rounded-lg border border-[#e8ecf1] text-[12px] text-[#5b6b7b] bg-white cursor-pointer outline-none"
          >
            <option value="all">All Dates</option>
            {days.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Active filter chips */}
          <div className="flex items-center gap-1 rounded-lg bg-[#f4f6f8] p-0.5">
            {activeChips.map(ch => (
              <button
                key={ch.key}
                onClick={() => set({ activeFilter: ch.key as typeof activeFilter, page: 1 })}
                className="px-3 py-1 rounded-md text-[12px] font-semibold transition-colors cursor-pointer"
                style={{
                  background: activeFilter === ch.key ? '#fff' : 'transparent',
                  color: activeFilter === ch.key ? '#0a6ed1' : '#7b8794',
                  boxShadow: activeFilter === ch.key ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <select
            value={sortKey}
            onChange={e => set({ sortKey: e.target.value as SortKey, page: 1 })}
            className="h-8 px-2.5 rounded-lg border border-[#e8ecf1] text-[12px] text-[#5b6b7b] bg-white cursor-pointer outline-none"
          >
            {sortOptions.map(o => (
              <option key={o.key} value={o.key}>Sort: {o.label}</option>
            ))}
          </select>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => set({ channelFilter: 'all', importerFilter: 'all', dayFilter: 'all', activeFilter: 'all', cardFilter: null, page: 1 })}
              className="text-[12px] text-[#0a6ed1] font-semibold hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          )}

          {/* Card filter label */}
          {cardFilter && CARD_FILTERS[cardFilter] && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf2fd] text-[#0a6ed1] text-[12px] font-semibold">
              {CARD_FILTERS[cardFilter].label}
              <button
                onClick={() => set({ cardFilter: null, page: 1 })}
                className="text-[#0a6ed1] hover:text-[#16222e] leading-none cursor-pointer ml-0.5"
              >
                &times;
              </button>
            </span>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e8ecf1]">
                {['#', 'Serial', 'C Number', 'C. Date', 'BL Number', 'LC Number', 'Received', 'Pallet', 'Zone', 'Exam', 'Assess', 'Delivery', 'Importer', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[11.5px] font-semibold text-[#7b8794] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-[#f0f2f5] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                  onClick={() => navigate('detail', { selectedId: c.id, detailTab: 'workflow' })}
                >
                  <td className="px-3 py-2.5 text-[#7b8794]">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-[#16222e] whitespace-nowrap">{c.serial || '--'}</td>
                  <td className="px-3 py-2.5 text-[#5b6b7b] whitespace-nowrap">{c.cNumber || '--'}</td>
                  <td className="px-3 py-2.5 text-[#5b6b7b] whitespace-nowrap">{c.cDate || '--'}</td>
                  <td className="px-3 py-2.5 text-[#0a6ed1] font-medium whitespace-nowrap">{c.bl}</td>
                  <td className="px-3 py-2.5 text-[#5b6b7b] whitespace-nowrap">{c.lc || '--'}</td>
                  <td className="px-3 py-2.5 text-[#5b6b7b] whitespace-nowrap">{c.received || '--'}</td>
                  <td className="px-3 py-2.5 text-[#5b6b7b] whitespace-nowrap">{c.pallet || '--'}</td>
                  <td className="px-3 py-2.5"><ZoneBadge channel={c.channel} /></td>
                  <td className="px-3 py-2.5 text-center"><BoolCell val={c.exam} /></td>
                  <td className="px-3 py-2.5 text-center"><BoolCell val={c.assess} /></td>
                  <td className="px-3 py-2.5 text-center"><BoolCell val={c.delivery} /></td>
                  <td className="px-3 py-2.5 text-[#16222e] whitespace-nowrap">{c.importer}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => set({
                          editId: c.id,
                          editError: '',
                          editImporterNew: false,
                          editForm: {
                            serial: c.serial, cNumber: c.cNumber, cDate: c.cDate,
                            bl: c.bl, lc: c.lc, received: c.received, pallet: c.pallet,
                            importer: c.importer, zone: c.zone || c.channel,
                            exam: c.exam, assess: c.assess, delivery: c.delivery,
                          },
                        })}
                        className="p-1.5 rounded-md hover:bg-[#f0f2f5] text-[#7b8794] hover:text-[#0a6ed1] transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="p-1.5 rounded-md hover:bg-[#fdecec] text-[#7b8794] hover:text-[#dc2626] transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-[14px] text-[#7b8794]">
                    No cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8ecf1]">
            <button
              onClick={() => set({ page: Math.max(1, currentPage - 1) })}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-[#e8ecf1] text-[12px] font-semibold text-[#5b6b7b] hover:bg-[#f4f6f8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => set({ page: p })}
                  className="w-8 h-8 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
                  style={{
                    background: p === currentPage ? '#0a6ed1' : 'transparent',
                    color: p === currentPage ? '#fff' : '#5b6b7b',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => set({ page: Math.min(totalPages, currentPage + 1) })}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-[#e8ecf1] text-[12px] font-semibold text-[#5b6b7b] hover:bg-[#f4f6f8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={() => setDeleteId(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-[400px] max-w-[95vw] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[#fdecec] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="text-[17px] font-bold text-[#16222e] mb-1">Delete Case</h3>
              <p className="text-[13px] text-[#7b8794] mb-1">Are you sure you want to delete this case?</p>
              {deleteTarget && (
                <p className="text-[14px] font-semibold text-[#16222e]">
                  {deleteTarget.bl} {deleteTarget.importer ? `· ${deleteTarget.importer}` : ''}
                </p>
              )}
              <p className="text-[12px] text-[#dc2626] mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#e8ecf1] text-[13px] font-semibold text-[#5b6b7b] hover:bg-[#f4f6f8] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteCase(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#dc2626] text-white text-[13px] font-semibold hover:bg-[#b91c1c] cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
