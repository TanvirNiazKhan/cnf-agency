'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { defaultWorkflow } from '@/lib/workflow';
import { PHASE_COLORS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { WorkflowStep } from '@/types';

/* ------------------------------------------------------------------ */
/*  Scope options                                                     */
/* ------------------------------------------------------------------ */

const SCOPE_OPTIONS: { label: string; value: string[] | undefined }[] = [
  { label: 'All channels', value: undefined },
  { label: 'Green only', value: ['green'] },
  { label: 'Yellow only', value: ['yellow'] },
  { label: 'Red only', value: ['red'] },
  { label: 'Yellow+Red', value: ['yellow', 'red'] },
  { label: 'Green+Yellow', value: ['green', 'yellow'] },
];

function scopeIndex(channels?: string[]): number {
  if (!channels || channels.length === 0) return 0;
  const key = channels.sort().join(',');
  const idx = SCOPE_OPTIONS.findIndex(o => o.value && o.value.sort().join(',') === key);
  return idx >= 0 ? idx : 0;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function BuilderPage() {
  const { state, set, saveWorkflow } = useApp();
  const { workflow, builderDrag, builderOver } = state;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await saveWorkflow();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  /* ---- Step mutations ---- */

  function updateStep(idx: number, patch: Partial<WorkflowStep>) {
    const next = workflow.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    set({ workflow: next });
  }

  function addStep() {
    const id = 's' + Date.now();
    const step: WorkflowStep = {
      id,
      title: 'New Step',
      phase: 0,
      status: 'New Step',
      hasRemarks: false,
    };
    set({ workflow: [...workflow, step] });
  }

  function removeStep(idx: number) {
    set({ workflow: workflow.filter((_, i) => i !== idx) });
  }

  function resetWorkflow() {
    set({ workflow: defaultWorkflow() });
  }

  /* ---- Checklist mutations ---- */

  function toggleChecks(idx: number) {
    const s = workflow[idx];
    if (s.checks) {
      updateStep(idx, { checks: undefined });
    } else {
      updateStep(idx, { checks: ['Check item'] });
    }
  }

  function addCheckItem(idx: number) {
    const s = workflow[idx];
    updateStep(idx, { checks: [...(s.checks || []), 'New checkbox'] });
  }

  function updateCheckItem(sIdx: number, cIdx: number, value: string) {
    const s = workflow[sIdx];
    const checks = [...(s.checks || [])];
    checks[cIdx] = value;
    updateStep(sIdx, { checks });
  }

  function removeCheckItem(sIdx: number, cIdx: number) {
    const s = workflow[sIdx];
    const checks = (s.checks || []).filter((_, i) => i !== cIdx);
    updateStep(sIdx, { checks: checks.length ? checks : undefined });
  }

  /* ---- Drag & drop ---- */

  function onDragStart(idx: number) {
    set({ builderDrag: idx });
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (builderOver !== idx) set({ builderOver: idx });
  }

  function onDrop(idx: number) {
    if (builderDrag === null || builderDrag === idx) {
      set({ builderDrag: null, builderOver: null });
      return;
    }
    const next = [...workflow];
    const [moved] = next.splice(builderDrag, 1);
    next.splice(idx, 0, moved);
    set({ workflow: next, builderDrag: null, builderOver: null });
  }

  function onDragEnd() {
    set({ builderDrag: null, builderOver: null });
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1b2a3d]">Workflow Builder</h1>
          <p className="text-sm text-[#7b8794] mt-0.5">{workflow.length} steps</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addStep}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer transition-colors hover:opacity-90"
            style={{ backgroundColor: '#0a6ed1' }}
          >
            + Add Step
          </button>
          <button
            onClick={resetWorkflow}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-[#5b6b7b] border border-[#e0e4ea] cursor-pointer hover:bg-[#f1f3f6] transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer transition-colors disabled:opacity-60"
            style={{ backgroundColor: saved ? '#16a34a' : '#0d9488' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ---- Step Cards ---- */}
      <div className="space-y-3">
        {workflow.map((step, idx) => {
          const isDragged = builderDrag === idx;
          const isOver = builderOver === idx && builderDrag !== null && builderDrag !== idx;
          const phaseColor = PHASE_COLORS[step.phase] || PHASE_COLORS[0];
          const hasUploads = !!(step.uploads && step.uploads.length > 0);
          const hasChecks = !!(step.checks && step.checks.length > 0);
          const hasRemarks = !!step.hasRemarks;
          const fieldCount = step.fields?.length || 0;
          const uploadCount = step.uploads?.length || 0;

          return (
            <Card
              key={step.id}
              padding="p-0"
              className={`relative overflow-hidden transition-all ${isDragged ? 'opacity-45' : ''} ${isOver ? 'ring-2 ring-[#0a6ed1] shadow-lg' : ''}`}
            >
              {/* Left color border */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: phaseColor }}
              />

              <div className="pl-5 pr-4 py-4">
                <div className="flex items-start gap-3">
                  {/* Drag handle */}
                  <div
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={e => onDragOver(e, idx)}
                    onDrop={() => onDrop(idx)}
                    onDragEnd={onDragEnd}
                    className="mt-1 cursor-grab active:cursor-grabbing text-[#9aa6b4] hover:text-[#5b6b7b] select-none flex-shrink-0"
                    title="Drag to reorder"
                  >
                    <span className="text-lg leading-none">{'\u2261'}</span>
                  </div>

                  {/* Step number */}
                  <div
                    className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: phaseColor }}
                  >
                    {idx + 1}
                  </div>

                  {/* Main content */}
                  <div
                    className="flex-1 min-w-0 space-y-3"
                    onDragOver={e => onDragOver(e, idx)}
                    onDrop={() => onDrop(idx)}
                  >
                    {/* Top row: title, phase, scope */}
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        className="flex-1 min-w-[140px] px-2 py-1 rounded-md border border-[#e0e4ea] text-sm font-semibold text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
                        value={step.title}
                        onChange={e => updateStep(idx, { title: e.target.value, status: e.target.value })}
                      />
                      <select
                        className="px-2 py-1 rounded-md border border-[#e0e4ea] text-xs text-[#5b6b7b] bg-white focus:outline-none focus:border-[#0a6ed1]"
                        value={step.phase}
                        onChange={e => updateStep(idx, { phase: Number(e.target.value) })}
                      >
                        <option value={0}>Phase 1</option>
                        <option value={1}>Phase 2</option>
                        <option value={2}>Phase 3</option>
                        <option value={3}>Phase 4</option>
                      </select>
                      <select
                        className="px-2 py-1 rounded-md border border-[#e0e4ea] text-xs text-[#5b6b7b] bg-white focus:outline-none focus:border-[#0a6ed1]"
                        value={scopeIndex(step.channels)}
                        onChange={e => {
                          const opt = SCOPE_OPTIONS[Number(e.target.value)];
                          updateStep(idx, { channels: opt.value });
                        }}
                      >
                        {SCOPE_OPTIONS.map((o, i) => (
                          <option key={i} value={i}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Toggles row */}
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Checklists toggle */}
                      <label className="flex items-center gap-2 text-xs text-[#5b6b7b] cursor-pointer select-none">
                        <button
                          onClick={() => toggleChecks(idx)}
                          className="relative flex-shrink-0 transition-colors duration-200 rounded-full cursor-pointer"
                          style={{ width: 32, height: 18, background: hasChecks ? '#0a6ed1' : '#cfd6df' }}
                        >
                          <span
                            className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-[left] duration-200"
                            style={{ left: hasChecks ? 16 : 2 }}
                          />
                        </button>
                        Checklists
                      </label>

                      {/* File uploads toggle */}
                      <label className="flex items-center gap-2 text-xs text-[#5b6b7b] cursor-pointer select-none">
                        <button
                          onClick={() => {
                            if (hasUploads) {
                              updateStep(idx, { uploads: undefined });
                            } else {
                              updateStep(idx, { uploads: ['File Upload'] });
                            }
                          }}
                          className="relative flex-shrink-0 transition-colors duration-200 rounded-full cursor-pointer"
                          style={{ width: 32, height: 18, background: hasUploads ? '#0a6ed1' : '#cfd6df' }}
                        >
                          <span
                            className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-[left] duration-200"
                            style={{ left: hasUploads ? 16 : 2 }}
                          />
                        </button>
                        File Uploads
                      </label>

                      {/* Remarks toggle */}
                      <label className="flex items-center gap-2 text-xs text-[#5b6b7b] cursor-pointer select-none">
                        <button
                          onClick={() => updateStep(idx, { hasRemarks: !hasRemarks })}
                          className="relative flex-shrink-0 transition-colors duration-200 rounded-full cursor-pointer"
                          style={{ width: 32, height: 18, background: hasRemarks ? '#0a6ed1' : '#cfd6df' }}
                        >
                          <span
                            className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-[left] duration-200"
                            style={{ left: hasRemarks ? 16 : 2 }}
                          />
                        </button>
                        Remarks
                      </label>
                    </div>

                    {/* Checklist items (when enabled) */}
                    {hasChecks && step.checks && (
                      <div className="space-y-2 pl-1">
                        {step.checks.map((item, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded border border-[#cfd6df] flex-shrink-0" />
                            <input
                              className="flex-1 px-2 py-1 rounded-md border border-[#e0e4ea] text-xs text-[#16222e] focus:outline-none focus:border-[#0a6ed1]"
                              value={item}
                              onChange={e => updateCheckItem(idx, ci, e.target.value)}
                            />
                            <button
                              onClick={() => removeCheckItem(idx, ci)}
                              className="text-[#9aa6b4] hover:text-[#dc2626] text-xs cursor-pointer transition-colors"
                              title="Remove"
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addCheckItem(idx)}
                          className="text-xs text-[#0a6ed1] hover:underline cursor-pointer"
                        >
                          + Add checkbox
                        </button>
                      </div>
                    )}

                    {/* Advanced chips */}
                    <div className="flex flex-wrap gap-2">
                      {fieldCount > 0 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[#9333ea]">
                          {fieldCount} field{fieldCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {uploadCount > 0 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#eef4fb] text-[#0a6ed1]">
                          {uploadCount} upload slot{uploadCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {hasChecks && step.checks && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#e7f5ec] text-[#15803d]">
                          {step.checks.length} check{step.checks.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {hasRemarks && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#fff3e0] text-[#d97706]">
                          remarks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeStep(idx)}
                    className="mt-1 text-[#9aa6b4] hover:text-[#dc2626] cursor-pointer transition-colors flex-shrink-0"
                    title="Delete step"
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M5 7v9a2 2 0 002 2h6a2 2 0 002-2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 5h12M8 5V3.5a1 1 0 011-1h2a1 1 0 011 1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.5 9v5M11.5 9v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
