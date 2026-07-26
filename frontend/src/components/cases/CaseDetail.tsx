'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CHANNEL_META, PHASE_LABELS, PHASE_COLORS } from '@/lib/constants';
import { applies, progressOf, statusOf, isCompleted } from '@/lib/workflow';
import { Case, FileEntry, CustomStep, CustomStepCheck, CustomStepFile } from '@/types';
import { api, downloadFile } from '@/lib/api';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-[#7b8794]">{label}</span>
      <span className="text-[13px] font-medium text-[#16222e] text-right max-w-[180px] truncate">{value || '--'}</span>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const meta = CHANNEL_META[channel];
  if (!meta) return <span className="text-[12px] text-[#7b8794]">Not assigned</span>;
  return <Badge label={meta[0] + ' Channel'} color={meta[1]} bg={meta[2]} />;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-[#e8ecf1] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: pct >= 100 ? '#16a34a' : '#0a6ed1' }}
      />
    </div>
  );
}

export function CaseDetail() {
  const { state, set, navigate, completeStep, reopenStep, dispatch } = useApp();
  const { cases, workflow, selectedId, detailTab } = state;

  const c = useMemo(() => cases.find(x => x.id === selectedId), [cases, selectedId]);

  const allDocs = useMemo(() => {
    if (!c) return [];
    const docs: (FileEntry & { stepTitle: string; stepId: string; phase: number })[] = [];
    workflow.forEach(def => {
      const sd = c.steps[def.id];
      if (sd?.files) {
        sd.files.forEach(f => docs.push({ ...f, stepTitle: def.title, stepId: def.id, phase: def.phase }));
      }
    });
    return docs;
  }, [c, workflow]);

  if (!c) {
    return (
      <div className="text-center py-20 text-[#7b8794]">
        <p className="text-[15px]">Case not found.</p>
        <button onClick={() => navigate('cases')} className="mt-4 text-[#0a6ed1] font-semibold text-[13px] hover:underline cursor-pointer">
          Back to Cases
        </button>
      </div>
    );
  }

  const pct = progressOf(workflow, c);
  const status = statusOf(workflow, c);
  const done = isCompleted(c, workflow.length);

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('cases')}
        className="flex items-center gap-1.5 text-[13px] text-[#5b6b7b] hover:text-[#0a6ed1] font-medium mb-4 cursor-pointer transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Cases
      </button>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left column - Case info */}
        <div className="w-full lg:w-[330px] flex-shrink-0 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <div className="mb-3">
              <h2 className="text-[16px] font-bold text-[#16222e] mb-1">{c.bl}</h2>
              <p className="text-[13px] text-[#5b6b7b]">{c.importer}</p>
            </div>
            <div className="mb-3">
              <ChannelBadge channel={c.channel} />
            </div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11.5px] text-[#7b8794]">{pct}%</span>
              <span className="text-[11.5px] font-semibold" style={{ color: done ? '#16a34a' : '#0a6ed1' }}>{status}</span>
            </div>
            <ProgressBar pct={pct} />

            <div className="mt-4 pt-3 border-t border-[#f0f2f5] space-y-0.5">
              <InfoRow label="Importer" value={c.importer} />
              <InfoRow label="Supplier" value={c.supplier} />
              <InfoRow label="Vessel" value={c.vessel} />
              <InfoRow label="Container" value={c.container} />
              <InfoRow label="Invoice No." value={c.invoice} />
              <InfoRow label="Invoice Value" value={c.invoiceValue} />
              <InfoRow label="Package" value={c.pkg || c.pallet} />
              <InfoRow label="C-Number" value={c.cNumber} />
              <InfoRow label="Arrival Date" value={c.arrival} />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-[#e8ecf1] mb-5">
            {(['workflow', 'documents'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => set({ detailTab: tab })}
                className="px-4 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer relative"
                style={{ color: detailTab === tab ? '#0a6ed1' : '#7b8794' }}
              >
                {tab === 'workflow' ? 'Workflow' : 'Documents'}
                {detailTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0a6ed1] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {detailTab === 'workflow' ? (
            <WorkflowTab c={c} />
          ) : (
            <DocumentsTab docs={allDocs} caseId={c.id} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Workflow Tab ---- */
function WorkflowTab({ c }: { c: Case }) {
  const { state, completeStep, reopenStep, dispatch } = useApp();
  const { workflow } = state;
  const [addingAfter, setAddingAfter] = useState<string | null>(null);
  const [newStepTitle, setNewStepTitle] = useState('');

  let lastPhase = -1;

  return (
    <div className="space-y-0">
      {workflow.map((def, idx) => {
        const applicable = applies(def, c.channel);
        const isDone = idx < c.currentStep && applicable;
        const isCurrent = idx === c.currentStep && applicable;
        const isSkipped = !applicable;
        const sd = c.steps[def.id] || { notes: '', files: [], checks: {}, fields: {} };
        const showPhase = def.phase !== lastPhase;
        lastPhase = def.phase;

        return (
          <div key={def.id}>
            {/* Phase header */}
            {showPhase && (
              <div className="flex items-center gap-2 mb-3 mt-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: PHASE_COLORS[def.phase] }}
                />
                <span className="text-[13px] font-bold" style={{ color: PHASE_COLORS[def.phase] }}>
                  {PHASE_LABELS[def.phase]}
                </span>
              </div>
            )}

            {/* Step row */}
            <div className="flex gap-3 mb-1">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                  style={
                    isDone
                      ? { background: '#e7f5ec', color: '#16a34a', border: '2px solid #16a34a' }
                      : isCurrent
                      ? { background: '#eaf2fd', color: '#0a6ed1', border: '2px solid #0a6ed1' }
                      : isSkipped
                      ? { background: '#f4f6f8', color: '#c5ccd6', border: '2px dashed #c5ccd6' }
                      : { background: '#f4f6f8', color: '#9aa6b4', border: '2px solid #e8ecf1' }
                  }
                >
                  {isDone ? '\u2713' : idx + 1}
                </div>
                {idx < workflow.length - 1 && (
                  <div
                    className="w-0.5 flex-1 min-h-[20px]"
                    style={{
                      background: isSkipped ? 'transparent' : isDone ? '#16a34a' : '#e8ecf1',
                      borderLeft: isSkipped ? '1px dashed #d1d5db' : 'none',
                    }}
                  />
                )}
              </div>

              {/* Step card */}
              <div
                className="flex-1 mb-3 rounded-xl border p-4"
                style={{
                  borderColor: isSkipped ? '#e8ecf1' : isCurrent ? '#0a6ed1' : isDone ? '#d1fae5' : '#e8ecf1',
                  borderStyle: isSkipped ? 'dashed' : 'solid',
                  background: isCurrent ? '#fafcff' : '#fff',
                  opacity: isSkipped ? 0.6 : 1,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[14px] font-semibold text-[#16222e]">{def.title}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setAddingAfter(addingAfter === def.id ? null : def.id); setNewStepTitle(''); }}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#eaf2fd] text-[#0a6ed1] hover:bg-[#0a6ed1] hover:text-white cursor-pointer transition-colors"
                    >
                      + Add Step
                    </button>
                    {isDone && <Badge label="Completed" color="#15803d" bg="#e7f5ec" />}
                    {isCurrent && <Badge label="In Progress" color="#0a6ed1" bg="#eaf2fd" />}
                    {isSkipped && (
                      <span className="text-[11px] text-[#9aa6b4] italic">
                        Not required &middot; {c.channel || 'green'} channel
                      </span>
                    )}
                  </div>
                </div>

                {def.note && (
                  <p className="text-[12px] text-[#7b8794] italic mb-2">{def.note}</p>
                )}

                {/* Skipped steps have no content */}
                {!isSkipped && (
                  <>
                    {/* Channel dropdown for special step */}
                    {def.dropdown && isCurrent && (
                      <div className="mb-3">
                        <label className="text-[12px] font-semibold text-[#5b6b7b] mb-1 block">Select Channel</label>
                        <select
                          value={c.channel || ''}
                          onChange={async e => {
                            const val = e.target.value;
                            await api.patch(`/cases/${c.id}`, { channel: val });
                            dispatch({
                              type: 'UPDATE_CASE',
                              id: c.id,
                              fn: (cc) => ({ ...cc, channel: val as Case['channel'], zone: val }),
                            });
                          }}
                          className="h-9 px-3 rounded-lg border border-[#e8ecf1] text-[13px] w-full max-w-[240px] bg-white outline-none cursor-pointer"
                        >
                          <option value="">-- Select --</option>
                          <option value="green">Green Channel</option>
                          <option value="yellow">Yellow Channel</option>
                          <option value="red">Red Channel</option>
                        </select>
                        {c.channel && CHANNEL_META[c.channel] && (
                          <div className="mt-2">
                            <span
                              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-[14px] font-bold"
                              style={{
                                background: CHANNEL_META[c.channel][2],
                                color: CHANNEL_META[c.channel][1],
                              }}
                            >
                              {CHANNEL_META[c.channel][0]} Channel
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {def.dropdown && isDone && c.channel && CHANNEL_META[c.channel] && (
                      <div className="mb-2">
                        <span
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-[14px] font-bold"
                          style={{
                            background: CHANNEL_META[c.channel][2],
                            color: CHANNEL_META[c.channel][1],
                          }}
                        >
                          {CHANNEL_META[c.channel][0]} Channel
                        </span>
                      </div>
                    )}

                    {/* Uploads area */}
                    {def.uploads && def.uploads.length > 0 && (
                      <div className="mb-2">
                        <span className="text-[11.5px] font-semibold text-[#7b8794] uppercase tracking-wide">Uploads</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {(sd.files || []).map((f) => (
                            <span
                              key={f.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-medium group"
                              style={{
                                background: f.type === 'pdf' ? '#fdecec' : '#eaf2fd',
                                color: f.type === 'pdf' ? '#b91c1c' : '#0a6ed1',
                              }}
                            >
                              {f.type === 'pdf' ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                              )}
                              <button
                                onClick={() => downloadFile(`/cases/${c.id}/steps/${def.id}/files/${f.id}/download`, f.name)}
                                className="hover:underline cursor-pointer"
                              >
                                {f.name}
                              </button>
                              {isCurrent && (
                                <button
                                  onClick={async () => {
                                    const res = await api.delete(`/cases/${c.id}/steps/${def.id}/files/${f.id}`);
                                    if (!res.error) {
                                      dispatch({
                                        type: 'PATCH_STEP',
                                        id: c.id,
                                        stepId: def.id,
                                        patch: { files: (sd.files || []).filter(x => x.id !== f.id) },
                                      });
                                    }
                                  }}
                                  className="ml-1 opacity-0 group-hover:opacity-100 hover:text-[#dc2626] cursor-pointer transition-opacity"
                                  title="Remove file"
                                >
                                  <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                </button>
                              )}
                            </span>
                          ))}
                          {isCurrent && (
                            <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-[#c5ccd6] text-[11.5px] text-[#7b8794] cursor-pointer hover:border-[#0a6ed1] hover:text-[#0a6ed1] transition-colors">
                              + Upload
                              <input
                                type="file"
                                multiple
                                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, overflow: 'hidden' }}
                                onChange={async e => {
                                  const picked = Array.from(e.target.files || []);
                                  if (!picked.length) return;
                                  const today = new Date().toISOString().split('T')[0];
                                  const category = (def.uploads && def.uploads.length > 0) ? def.uploads[0] : 'Document';
                                  const uploaded: typeof sd.files = [];
                                  for (const file of picked) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('category', category);
                                    formData.append('fileDate', today);
                                    const res = await api.upload<any>(`/cases/${c.id}/steps/${def.id}/files`, formData);
                                    if (!res.error && res.data) {
                                      const ext = file.name.split('.').pop()?.toLowerCase();
                                      const type: 'pdf' | 'img' = ext === 'pdf' ? 'pdf' : 'img';
                                      const sizeKb = Math.round(file.size / 1024);
                                      const size = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
                                      uploaded.push({ id: res.data.id, name: file.name, type, category, date: today, by: '', size });
                                    }
                                  }
                                  if (uploaded.length) {
                                    dispatch({
                                      type: 'PATCH_STEP',
                                      id: c.id,
                                      stepId: def.id,
                                      patch: { files: [...(sd.files || []), ...uploaded] },
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Checkboxes */}
                    {def.checks && def.checks.length > 0 && (
                      <div className="mb-2 space-y-1.5">
                        {def.checks.map(chk => (
                          <label key={chk} className="flex items-center gap-2 text-[13px] text-[#16222e] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!sd.checks?.[chk]}
                              disabled={!isCurrent}
                              onChange={async () => {
                                if (!isCurrent) return;
                                const newVal = !sd.checks?.[chk];
                                dispatch({
                                  type: 'PATCH_STEP',
                                  id: c.id,
                                  stepId: def.id,
                                  patch: { checks: { [chk]: newVal } },
                                });
                                await api.patch(`/cases/${c.id}/steps/${def.id}`, {
                                  checks: { ...(sd.checks || {}), [chk]: newVal },
                                });
                              }}
                              className="w-4 h-4 rounded border-[#c5ccd6] accent-[#0a6ed1]"
                            />
                            {chk}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Text fields */}
                    {def.fields && def.fields.length > 0 && (
                      <div className="mb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {def.fields.map(f => (
                          <div key={f.key}>
                            <label className="text-[11.5px] font-semibold text-[#7b8794] mb-0.5 block">{f.label}</label>
                            <input
                              type={f.type || 'text'}
                              value={sd.fields?.[f.key] || ''}
                              placeholder={f.ph}
                              disabled={!isCurrent}
                              onChange={async e => {
                                if (!isCurrent) return;
                                const newVal = e.target.value;
                                dispatch({
                                  type: 'PATCH_STEP',
                                  id: c.id,
                                  stepId: def.id,
                                  patch: { fields: { [f.key]: newVal } },
                                });
                                await api.patch(`/cases/${c.id}/steps/${def.id}`, {
                                  fields: { ...(sd.fields || {}), [f.key]: newVal },
                                });
                              }}
                              className="h-8 px-2.5 rounded-lg border border-[#e8ecf1] text-[13px] text-[#16222e] w-full bg-white outline-none disabled:bg-[#f8fafc] disabled:text-[#7b8794]"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Remarks */}
                    {def.hasRemarks && (
                      <div className="mb-2">
                        <label className="text-[11.5px] font-semibold text-[#7b8794] mb-0.5 block">Remarks</label>
                        <textarea
                          value={sd.notes || ''}
                          disabled={!isCurrent}
                          onChange={async e => {
                            if (!isCurrent) return;
                            const newVal = e.target.value;
                            dispatch({
                              type: 'PATCH_STEP',
                              id: c.id,
                              stepId: def.id,
                              patch: { notes: newVal },
                            });
                            await api.patch(`/cases/${c.id}/steps/${def.id}`, {
                              notes: newVal,
                            });
                          }}
                          rows={2}
                          className="w-full px-2.5 py-2 rounded-lg border border-[#e8ecf1] text-[13px] text-[#16222e] bg-white outline-none resize-none disabled:bg-[#f8fafc] disabled:text-[#7b8794]"
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    {isCurrent && (
                      <div className="mt-3">
                        <button
                          onClick={() => completeStep(c.id, idx)}
                          className="h-8 px-4 rounded-lg bg-[#0a6ed1] text-white text-[12.5px] font-semibold hover:bg-[#0860b6] transition-colors cursor-pointer"
                        >
                          {def.button || 'Mark Complete'}
                        </button>
                      </div>
                    )}

                    {isDone && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11.5px] text-[#7b8794]">
                          Completed {sd.completedDate || ''}
                        </span>
                        <button
                          onClick={() => reopenStep(c.id, idx)}
                          className="text-[12px] text-[#0a6ed1] font-medium hover:underline cursor-pointer"
                        >
                          Reopen
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Custom steps inserted after this step */}
            {(c.customSteps || [])
              .filter(cs => cs.insertAfter === def.id)
              .map(cs => {
                const patchCs = async (patch: Partial<CustomStep>) => {
                  dispatch({ type: 'PATCH_CUSTOM_STEP', caseId: c.id, csId: cs.id, patch });
                  await api.patch(`/cases/${c.id}/custom-steps/${cs.id}`, patch);
                };
                return (
                  <div key={cs.id} className="flex gap-3 mb-1 ml-10">
                    <div className="flex-1 mb-3 rounded-xl border border-dashed border-[#c5ccd6] p-4 bg-[#fafafa]">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full border-2 border-dashed border-[#9aa6b4] flex items-center justify-center flex-shrink-0">
                            {cs.done && <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />}
                          </span>
                          <h4 className="text-[13px] font-semibold text-[#16222e]">{cs.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#9aa6b4] bg-[#f0f2f5] px-2 py-0.5 rounded-full">Custom</span>
                          <button
                            onClick={async () => {
                              await api.delete(`/cases/${c.id}/custom-steps/${cs.id}`);
                              dispatch({ type: 'REMOVE_CUSTOM_STEP', caseId: c.id, csId: cs.id });
                            }}
                            className="text-[#9aa6b4] hover:text-[#dc2626] cursor-pointer transition-colors"
                            title="Remove"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      {(cs.checks || []).length > 0 && (
                        <div className="mb-3 space-y-1.5">
                          {(cs.checks || []).map((chk, ci) => (
                            <div key={ci} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={chk.checked}
                                onChange={async () => {
                                  const checks = (cs.checks || []).map((c2, i) =>
                                    i === ci ? { ...c2, checked: !c2.checked } : c2
                                  );
                                  await patchCs({ checks });
                                }}
                                className="w-4 h-4 rounded border-[#c5ccd6] accent-[#0a6ed1] cursor-pointer"
                              />
                              <span className="text-[12.5px] text-[#16222e] flex-1">{chk.label}</span>
                              <button
                                onClick={async () => {
                                  const checks = (cs.checks || []).filter((_, i) => i !== ci);
                                  await patchCs({ checks });
                                }}
                                className="text-[#9aa6b4] hover:text-[#dc2626] cursor-pointer transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Files */}
                      {(cs.files || []).length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {(cs.files || []).map((f, fi) => (
                            <span
                              key={fi}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-medium"
                              style={{
                                background: f.type === 'pdf' ? '#fdecec' : '#eaf2fd',
                                color: f.type === 'pdf' ? '#b91c1c' : '#0a6ed1',
                              }}
                            >
                              {f.type === 'pdf' ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                              )}
                              {f.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      <textarea
                        value={cs.notes}
                        placeholder="Add notes..."
                        rows={2}
                        onChange={async e => {
                          const notes = e.target.value;
                          dispatch({ type: 'PATCH_CUSTOM_STEP', caseId: c.id, csId: cs.id, patch: { notes } });
                          await api.patch(`/cases/${c.id}/custom-steps/${cs.id}`, { notes });
                        }}
                        className="w-full px-2.5 py-2 rounded-lg border border-[#e8ecf1] text-[12.5px] text-[#16222e] bg-white outline-none resize-none focus:border-[#0a6ed1] mb-2"
                      />

                      {/* Footer actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Add checkbox */}
                          <button
                            onClick={async () => {
                              const label = prompt('Checkbox label:');
                              if (!label?.trim()) return;
                              const checks = [...(cs.checks || []), { label: label.trim(), checked: false }];
                              await patchCs({ checks });
                            }}
                            className="text-[11.5px] text-[#0a6ed1] hover:underline cursor-pointer font-medium"
                          >
                            + Checkbox
                          </button>
                          {/* File upload */}
                          <label className="text-[11.5px] text-[#0a6ed1] hover:underline cursor-pointer font-medium">
                            + Upload
                            <input
                              type="file"
                              multiple
                              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, overflow: 'hidden' }}
                              onChange={async e => {
                                const picked = Array.from(e.target.files || []);
                                if (!picked.length) return;
                                const today = new Date().toISOString().split('T')[0];
                                const newFiles: CustomStepFile[] = picked.map(f => {
                                  const ext = f.name.split('.').pop()?.toLowerCase();
                                  const type: 'pdf' | 'img' = ext === 'pdf' ? 'pdf' : 'img';
                                  const kb = Math.round(f.size / 1024);
                                  const size = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
                                  return { name: f.name, type, size, date: today };
                                });
                                const files = [...(cs.files || []), ...newFiles];
                                await patchCs({ files });
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                        {/* Mark done */}
                        <label className="flex items-center gap-2 text-[12px] text-[#5b6b7b] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cs.done}
                            onChange={async () => patchCs({ done: !cs.done })}
                            className="w-4 h-4 rounded border-[#c5ccd6] accent-[#0a6ed1]"
                          />
                          Mark as done
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Add Step inline form */}
            {addingAfter === def.id && (
              <div className="flex gap-2 mb-3 ml-10">
                <input
                  autoFocus
                  value={newStepTitle}
                  onChange={e => setNewStepTitle(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === 'Enter' && newStepTitle.trim()) {
                      const res = await api.post(`/cases/${c.id}/custom-steps`, { title: newStepTitle.trim(), insertAfter: def.id });
                      if (!res.error) {
                        dispatch({ type: 'ADD_CUSTOM_STEP', caseId: c.id, step: res.data as CustomStep });
                      }
                      setAddingAfter(null);
                      setNewStepTitle('');
                    }
                    if (e.key === 'Escape') { setAddingAfter(null); setNewStepTitle(''); }
                  }}
                  placeholder="Step title..."
                  className="flex-1 h-8 px-3 rounded-lg border border-[#0a6ed1] text-[12.5px] text-[#16222e] outline-none"
                />
                <button
                  onClick={async () => {
                    if (!newStepTitle.trim()) return;
                    const res = await api.post(`/cases/${c.id}/custom-steps`, { title: newStepTitle.trim(), insertAfter: def.id });
                    if (!res.error) {
                      dispatch({ type: 'ADD_CUSTOM_STEP', caseId: c.id, step: res.data as CustomStep });
                    }
                    setAddingAfter(null);
                    setNewStepTitle('');
                  }}
                  className="h-8 px-3 rounded-lg bg-[#0a6ed1] text-white text-[12px] font-semibold cursor-pointer hover:bg-[#0860b6]"
                >
                  Add
                </button>
                <button
                  onClick={() => { setAddingAfter(null); setNewStepTitle(''); }}
                  className="h-8 px-3 rounded-lg border border-[#e8ecf1] text-[12px] text-[#5b6b7b] cursor-pointer hover:bg-[#f4f6f8]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        );
      })}

      {isCompleted(c, workflow.length) && (
        <div className="mt-4 p-4 rounded-xl bg-[#e7f5ec] border border-[#bbf7d0] text-center">
          <span className="text-[15px] font-bold text-[#15803d]">All steps completed</span>
        </div>
      )}
    </div>
  );
}

/* ---- Documents Tab ---- */
function DocumentsTab({ docs, caseId }: { docs: (FileEntry & { stepTitle: string; stepId: string; phase: number })[]; caseId: string }) {
  if (docs.length === 0) {
    return (
      <div className="text-center py-16 text-[#7b8794]">
        <p className="text-[14px]">No documents uploaded yet.</p>
      </div>
    );
  }

  // Group: phase → step → files
  const grouped = useMemo(() => {
    const map = new Map<number, Map<string, typeof docs>>();
    for (const doc of docs) {
      if (!map.has(doc.phase)) map.set(doc.phase, new Map());
      const stepMap = map.get(doc.phase)!;
      const key = doc.stepId;
      if (!stepMap.has(key)) stepMap.set(key, []);
      stepMap.get(key)!.push(doc);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([phase, stepMap]) => ({
        phase,
        steps: Array.from(stepMap.entries()).map(([stepId, files]) => ({
          stepId,
          stepTitle: files[0].stepTitle,
          files,
        })),
      }));
  }, [docs]);

  return (
    <div className="space-y-5">
      {grouped.map(({ phase, steps }) => (
        <div key={phase}>
          {/* Phase header */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: PHASE_COLORS[phase] }}
            />
            <span className="text-[13px] font-bold" style={{ color: PHASE_COLORS[phase] }}>
              {PHASE_LABELS[phase]}
            </span>
            <span className="text-[11px] text-[#9aa6b4]">
              ({steps.reduce((n, s) => n + s.files.length, 0)} files)
            </span>
          </div>

          <div className="space-y-3 ml-1 pl-4 border-l-2" style={{ borderColor: PHASE_COLORS[phase] + '30' }}>
            {steps.map(({ stepId, stepTitle, files }) => (
              <div key={stepId}>
                {/* Step header */}
                <p className="text-[12px] font-semibold text-[#5b6b7b] mb-2">{stepTitle}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {files.map((doc) => (
                    <Card key={doc.id} padding="p-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                          onClick={() => downloadFile(`/cases/${caseId}/steps/${doc.stepId}/files/${doc.id}/download`, doc.name)}
                          style={{
                            background: doc.type === 'pdf' ? '#fdecec' : '#eaf2fd',
                            color: doc.type === 'pdf' ? '#dc2626' : '#0a6ed1',
                          }}
                        >
                          {doc.type === 'pdf' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => downloadFile(`/cases/${caseId}/steps/${doc.stepId}/files/${doc.id}/download`, doc.name)}
                            className="text-[12.5px] font-semibold text-[#16222e] truncate block max-w-full hover:text-[#0a6ed1] cursor-pointer transition-colors text-left"
                            title={doc.name}
                          >
                            {doc.name}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-[#9aa6b4]">
                            <span>{doc.category}</span>
                            <span>&middot;</span>
                            <span>{doc.size}</span>
                            {doc.date && <><span>&middot;</span><span>{doc.date}</span></>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
