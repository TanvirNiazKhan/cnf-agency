'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';

export function EditCaseModal() {
  const { state, set, saveEdit } = useApp();
  const { editId, editForm, editError, editImporterNew } = state;

  const importers = useMemo(() => {
    return state.importers.map(i => i.name).sort();
  }, [state.importers]);

  if (!editId) return null;

  const updateField = (key: string, value: string | boolean) =>
    set({ editForm: { ...editForm, [key]: value }, editError: '' });

  const textFields: [string, string][] = [
    ['Serial', 'serial'],
    ['C Number', 'cNumber'],
    ['C. Date', 'cDate'],
    ['BL Number *', 'bl'],
    ['LC Number', 'lc'],
    ['Received', 'received'],
    ['Pallet', 'pallet'],
  ];

  const toggles: [string, string][] = [
    ['Exam', 'exam'],
    ['Assess', 'assess'],
    ['Delivery', 'delivery'],
  ];

  return (
    <Modal open={!!editId} onClose={() => set({ editId: null, editError: '' })} title="Edit Case" width="580px">
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Text fields */}
        {textFields.map(([label, key]) => (
          <div key={key}>
            <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">
              {label.endsWith('*') ? (
                <>{label.slice(0, -2)} <span className="text-[#dc2626]">*</span></>
              ) : label}
            </label>
            <input
              type="text"
              value={(editForm[key] as string) || ''}
              onChange={e => updateField(key, e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none focus:border-[#0a6ed1] transition-colors"
            />
          </div>
        ))}

        {/* Importer */}
        <div>
          <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">Importer</label>
          {editImporterNew ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={(editForm.importer as string) || ''}
                onChange={e => updateField('importer', e.target.value)}
                placeholder="Enter new importer name"
                className="flex-1 h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none focus:border-[#0a6ed1] transition-colors"
              />
              <button
                onClick={() => set({ editImporterNew: false, editForm: { ...editForm, importer: '' } })}
                className="h-10 px-3 rounded-lg border border-[#e8ecf1] text-[12.5px] text-[#5b6b7b] hover:bg-[#f4f6f8] cursor-pointer transition-colors"
              >
                Back
              </button>
            </div>
          ) : (
            <select
              value={(editForm.importer as string) || ''}
              onChange={e => {
                if (e.target.value === '__new__') {
                  set({ editImporterNew: true, editForm: { ...editForm, importer: '' } });
                } else {
                  updateField('importer', e.target.value);
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

        {/* Zone */}
        <div>
          <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">Zone</label>
          <select
            value={(editForm.zone as string) || ''}
            onChange={e => updateField('zone', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none cursor-pointer focus:border-[#0a6ed1] transition-colors"
          >
            <option value="">-- Select --</option>
            <option value="green">Green</option>
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
          </select>
        </div>

        {/* Toggle switches */}
        <div className="sm:col-span-2 flex items-center gap-8 pt-2">
          {toggles.map(([label, key]) => {
            const on = !!editForm[key];
            return (
              <div key={key} className="flex items-center gap-2.5">
                <span className="text-[13px] font-medium text-[#16222e]">{label}</span>
                <button
                  onClick={() => updateField(key, !on)}
                  className="relative flex-shrink-0 rounded-full cursor-pointer transition-colors duration-200"
                  style={{ width: 42, height: 24, background: on ? '#16a34a' : '#cfd6df' }}
                >
                  <span
                    className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-[left] duration-200"
                    style={{ left: on ? 21 : 3 }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {editError && (
        <div className="mx-6 mb-3 px-3 py-2 rounded-lg bg-[#fdecec] border border-[#f8c4c4] text-[#b91c1c] text-[12.5px] font-medium">
          {editError}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e8ecf1]">
        <button
          onClick={() => set({ editId: null, editError: '' })}
          className="h-9 px-4 rounded-lg border border-[#e8ecf1] text-[13px] font-semibold text-[#5b6b7b] hover:bg-[#f4f6f8] cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={saveEdit}
          className="h-9 px-5 rounded-lg bg-[#0a6ed1] text-white text-[13px] font-semibold hover:bg-[#0860b6] cursor-pointer transition-colors"
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
}
