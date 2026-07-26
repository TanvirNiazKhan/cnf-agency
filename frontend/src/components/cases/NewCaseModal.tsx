'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';

export function NewCaseModal() {
  const { state, set, saveCase } = useApp();
  const { modalOpen, form, formError, importerNew } = state;
  const [addingImporter, setAddingImporter] = useState(false);

  const importers = useMemo(() => {
    return state.importers.map(i => i.name).sort();
  }, [state.importers]);

  if (!modalOpen) return null;

  const updateForm = (key: string, value: string) =>
    set({ form: { ...form, [key]: value }, formError: '' });

  return (
    <Modal
      open={modalOpen}
      onClose={() => set({ modalOpen: false, formError: '', importerNew: false })}
      title="New Clearance Case"
    >
      <div className="px-6 py-5 space-y-4">
        {/* BL Number */}
        <div>
          <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">
            BL Number <span className="text-[#dc2626]">*</span>
          </label>
          <input
            type="text"
            value={form.bl}
            onChange={e => updateForm('bl', e.target.value)}
            placeholder="Enter BL Number"
            className="w-full h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none focus:border-[#0a6ed1] transition-colors"
          />
        </div>

        {/* LC Number */}
        <div>
          <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">LC Number</label>
          <input
            type="text"
            value={form.invoice}
            onChange={e => updateForm('invoice', e.target.value)}
            placeholder="Enter LC Number"
            className="w-full h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none focus:border-[#0a6ed1] transition-colors"
          />
        </div>

        {/* Package */}
        <div>
          <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">Package</label>
          <input
            type="text"
            value={form.pkg}
            onChange={e => updateForm('pkg', e.target.value)}
            placeholder="e.g., 10 PK, 5 Palt"
            className="w-full h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none focus:border-[#0a6ed1] transition-colors"
          />
        </div>

        {/* Importer */}
        <div>
          <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">Importer</label>
          {importerNew ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.importer}
                onChange={e => updateForm('importer', e.target.value)}
                placeholder="Enter new importer name"
                autoFocus
                className="flex-1 h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none focus:border-[#0a6ed1] transition-colors"
              />
              <button
                disabled={addingImporter || !form.importer.trim()}
                onClick={async () => {
                  const name = form.importer.trim();
                  if (!name) return;
                  setAddingImporter(true);
                  const res = await api.post<any>('/importers', { name });
                  setAddingImporter(false);
                  if (res.error) { set({ formError: res.error }); return; }
                  const newImp = { id: res.data.id, name: res.data.name };
                  set({
                    importers: [...state.importers, newImp],
                    importerNew: false,
                    form: { ...form, importer: newImp.name },
                  });
                }}
                className="h-10 px-4 rounded-lg bg-[#0a6ed1] text-white text-[12.5px] font-semibold hover:bg-[#0860b6] disabled:opacity-50 cursor-pointer transition-colors"
              >
                {addingImporter ? '…' : 'Add'}
              </button>
              <button
                onClick={() => set({ importerNew: false, form: { ...form, importer: '' } })}
                className="h-10 px-3 rounded-lg border border-[#e8ecf1] text-[12.5px] text-[#5b6b7b] hover:bg-[#f4f6f8] cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <select
              value={form.importer}
              onChange={e => {
                if (e.target.value === '__new__') {
                  set({ importerNew: true, form: { ...form, importer: '' } });
                } else {
                  updateForm('importer', e.target.value);
                }
              }}
              className="w-full h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none cursor-pointer focus:border-[#0a6ed1] transition-colors"
            >
              <option value="">Select importer</option>
              {importers.map(imp => (
                <option key={imp} value={imp}>{imp}</option>
              ))}
              <option value="__new__">+ Add new importer</option>
            </select>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">Remarks</label>
          <textarea
            value={form.remarks}
            onChange={e => set({ form: { ...form, remarks: e.target.value } })}
            placeholder="Optional notes..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none resize-none focus:border-[#0a6ed1] transition-colors"
          />
        </div>

        {/* Error */}
        {formError && (
          <div className="px-3 py-2 rounded-lg bg-[#fdecec] border border-[#f8c4c4] text-[#b91c1c] text-[12.5px] font-medium">
            {formError}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e8ecf1]">
        <button
          onClick={() => set({ modalOpen: false, formError: '', importerNew: false })}
          className="h-9 px-4 rounded-lg border border-[#e8ecf1] text-[13px] font-semibold text-[#5b6b7b] hover:bg-[#f4f6f8] cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={saveCase}
          className="h-9 px-5 rounded-lg bg-[#0a6ed1] text-white text-[13px] font-semibold hover:bg-[#0860b6] cursor-pointer transition-colors"
        >
          Create Case
        </button>
      </div>
    </Modal>
  );
}
