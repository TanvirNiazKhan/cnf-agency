'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { isCompleted, applies } from '@/lib/workflow';
import { CHANNEL_META } from '@/lib/constants';
import { Card } from '@/components/ui/Card';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function usePhaseBreakdown(
  cases: ReturnType<typeof useApp>['state']['cases'],
  workflow: ReturnType<typeof useApp>['state']['workflow'],
) {
  return useMemo(() => {
    const wfLen = workflow.length;
    return [
      {
        label: 'Document Stage',
        count: cases.filter(c => {
          if (isCompleted(c, wfLen)) return false;
          const phase = c.currentStep < wfLen ? workflow[c.currentStep].phase : -1;
          return phase < 1;
        }).length,
        color: '#9333ea',
      },
      {
        label: 'Assessment',
        count: cases.filter(c => {
          if (isCompleted(c, wfLen)) return false;
          const phase = c.currentStep < wfLen ? workflow[c.currentStep].phase : -1;
          return phase === 1;
        }).length,
        color: '#0a6ed1',
      },
      {
        label: 'Examination',
        count: cases.filter(c => {
          if (isCompleted(c, wfLen)) return false;
          const phase = c.currentStep < wfLen ? workflow[c.currentStep].phase : -1;
          return phase === 2;
        }).length,
        color: '#0891b2',
      },
      {
        label: 'Finalization',
        count: cases.filter(c => {
          if (isCompleted(c, wfLen)) return false;
          const phase = c.currentStep < wfLen ? workflow[c.currentStep].phase : -1;
          return phase === 3;
        }).length,
        color: '#d97706',
      },
      {
        label: 'Completed',
        count: cases.filter(c => isCompleted(c, wfLen)).length,
        color: '#16a34a',
      },
    ];
  }, [cases, workflow]);
}

function useChannelDist(cases: ReturnType<typeof useApp>['state']['cases']) {
  return useMemo(() => {
    const green = cases.filter(c => c.channel === 'green').length;
    const yellow = cases.filter(c => c.channel === 'yellow').length;
    const red = cases.filter(c => c.channel === 'red').length;
    const unassigned = cases.filter(c => !c.channel).length;
    return { green, yellow, red, unassigned, total: cases.length };
  }, [cases]);
}

function useImporterBreakdown(
  cases: ReturnType<typeof useApp>['state']['cases'],
  wfLen: number,
) {
  return useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    cases.forEach(c => {
      const imp = c.importer || 'Unknown';
      const entry = map.get(imp) || { total: 0, completed: 0 };
      entry.total++;
      if (isCompleted(c, wfLen)) entry.completed++;
      map.set(imp, entry);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [cases, wfLen]);
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ReportsPage() {
  const { state } = useApp();
  const { cases, workflow } = state;
  const wfLen = workflow.length;

  const completed = useMemo(() => cases.filter(c => isCompleted(c, wfLen)).length, [cases, wfLen]);
  const pending = cases.length - completed;

  const phaseBreakdown = usePhaseBreakdown(cases, workflow);
  const channelDist = useChannelDist(cases);
  const importers = useImporterBreakdown(cases, wfLen);

  const maxPhase = Math.max(1, ...phaseBreakdown.map(s => s.count));
  const channelRows = [
    { label: 'Green', count: channelDist.green, color: '#16a34a' },
    { label: 'Yellow', count: channelDist.yellow, color: '#ca8a04' },
    { label: 'Red', count: channelDist.red, color: '#dc2626' },
    { label: 'Unassigned', count: channelDist.unassigned, color: '#d1d5db' },
  ];
  const maxChannel = Math.max(1, ...channelRows.map(r => r.count));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1b2a3d]">Reports</h1>

      {/* ---- Top Stats Row ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Cases', value: String(cases.length), icon: '\u{1F4CB}', bg: '#eef4fb', color: '#0a6ed1' },
          { label: 'Completed', value: String(completed), icon: '\u2705', bg: '#e7f5ec', color: '#16a34a' },
          { label: 'Pending', value: String(pending), icon: '\u23F3', bg: '#fff3e0', color: '#d97706' },
          { label: 'Avg. Clearance', value: '6.4d', icon: '\u{1F4C5}', bg: '#f3e8ff', color: '#9333ea' },
          { label: 'On-time Rate', value: '92%', icon: '\u{1F3AF}', bg: '#e0f7fa', color: '#0891b2' },
        ].map(stat => (
          <Card key={stat.label} padding="p-4" className="relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: stat.bg, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-[#5b6b7b]">{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ---- Status Breakdown + Channel Distribution ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Breakdown */}
        <Card>
          <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Status Breakdown</h2>
          <div className="space-y-3">
            {phaseBreakdown.map(seg => (
              <div key={seg.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#5b6b7b]">{seg.label}</span>
                  <span className="font-semibold text-[#1b2a3d]">{seg.count}</span>
                </div>
                <div className="h-3 bg-[#f1f3f6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(seg.count / maxPhase) * 100}%`,
                      backgroundColor: seg.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Channel Distribution</h2>
          <div className="space-y-3">
            {channelRows.map(ch => {
              const pct = channelDist.total ? Math.round((ch.count / channelDist.total) * 100) : 0;
              return (
                <div key={ch.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5b6b7b]">{ch.label}</span>
                    <span className="font-semibold text-[#1b2a3d]">{ch.count} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-[#f1f3f6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(ch.count / maxChannel) * 100}%`,
                        backgroundColor: ch.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ---- Importer Breakdown ---- */}
      <Card>
        <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Importer Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8ecf1]">
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#5b6b7b] uppercase tracking-wider">Importer</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-[#5b6b7b] uppercase tracking-wider">Cases</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-[#5b6b7b] uppercase tracking-wider">Completed</th>
              </tr>
            </thead>
            <tbody>
              {importers.map(imp => (
                <tr key={imp.name} className="border-b border-[#f1f3f6] hover:bg-[#f8f9fb] transition-colors">
                  <td className="py-2.5 px-3 text-[#1b2a3d] font-medium">{imp.name}</td>
                  <td className="py-2.5 px-3 text-center text-[#5b6b7b]">{imp.total}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-[#e7f5ec] text-[#15803d]">
                      {imp.completed}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
