'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { isCompleted, applies } from '@/lib/workflow';
import { CHANNEL_META } from '@/lib/constants';
import { Card } from '@/components/ui/Card';

/* ------------------------------------------------------------------ */
/*  Summary-card definitions                                          */
/* ------------------------------------------------------------------ */

function useSummaryCards(
  cases: ReturnType<typeof useApp>['state']['cases'],
  wfLen: number,
) {
  return useMemo(() => {
    const total = cases.length;
    const pendingVetting = cases.filter(c => c.currentStep < 2).length;
    const waitingEntry = cases.filter(c => c.currentStep >= 2 && c.currentStep <= 3).length;
    const waitingCNumber = cases.filter(c => !c.cNumber && !isCompleted(c, wfLen)).length;
    const green = cases.filter(c => c.channel === 'green').length;
    const yellow = cases.filter(c => c.channel === 'yellow').length;
    const red = cases.filter(c => c.channel === 'red').length;
    const underExam = cases.filter(c => c.currentStep >= 8 && c.currentStep <= 11).length;
    const waitingRO = cases.filter(c => c.currentStep === 11).length;
    const readyDelivery = cases.filter(c => c.currentStep >= 12 && !isCompleted(c, wfLen)).length;
    const completed = cases.filter(c => isCompleted(c, wfLen)).length;

    return [
      { label: 'Total Clearance Cases', value: total, color: '#0a6ed1', filter: 'total' },
      { label: 'Pending Vetting', value: pendingVetting, color: '#e0612e', filter: 'pendingVetting' },
      { label: 'Waiting for ASYCUDA Entry', value: waitingEntry, color: '#7b8794', filter: 'waitingEntry' },
      { label: 'Waiting for C Number', value: waitingCNumber, color: '#9333ea', filter: 'waitingCNumber' },
      { label: 'Green Channel', value: green, color: '#16a34a', filter: 'green' },
      { label: 'Yellow Channel', value: yellow, color: '#ca8a04', filter: 'yellow' },
      { label: 'Red Channel', value: red, color: '#dc2626', filter: 'red' },
      { label: 'Under Examination', value: underExam, color: '#0891b2', filter: 'underExam' },
      { label: 'Waiting for RO Review', value: waitingRO, color: '#d97706', filter: 'waitingRO' },
      { label: 'Ready for Delivery', value: readyDelivery, color: '#0d9488', filter: 'readyDelivery' },
      { label: 'Completed Deliveries', value: completed, color: '#15803d', filter: 'completed' },
    ];
  }, [cases, wfLen]);
}

/* ------------------------------------------------------------------ */
/*  Pipeline helpers                                                  */
/* ------------------------------------------------------------------ */

interface PipelineSegment {
  label: string;
  count: number;
  color: string;
}

function usePipeline(
  cases: ReturnType<typeof useApp>['state']['cases'],
  workflow: ReturnType<typeof useApp>['state']['workflow'],
) {
  return useMemo(() => {
    const wfLen = workflow.length;
    const segments: PipelineSegment[] = [
      {
        label: 'Documents',
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
    return segments;
  }, [cases, workflow]);
}

/* ------------------------------------------------------------------ */
/*  Channel distribution helpers                                      */
/* ------------------------------------------------------------------ */

function useChannelDist(cases: ReturnType<typeof useApp>['state']['cases']) {
  return useMemo(() => {
    const green = cases.filter(c => c.channel === 'green').length;
    const yellow = cases.filter(c => c.channel === 'yellow').length;
    const red = cases.filter(c => c.channel === 'red').length;
    const unassigned = cases.filter(c => !c.channel).length;
    return { green, yellow, red, unassigned, total: cases.length };
  }, [cases]);
}

/* ------------------------------------------------------------------ */
/*  Static data                                                       */
/* ------------------------------------------------------------------ */

const MONTHLY_DATA = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [4, 6, 5, 8, 7, 9],
};

const ACTIVITY_FEED = [
  { text: 'Cargo delivered for BL-MEDUBD2641 (Rahman Traders Ltd)', time: '12 min ago', color: '#16a34a' },
  { text: 'C-Number C-2026-43935 generated for BL-MAEUBD7741', time: '48 min ago', color: '#0a6ed1' },
  { text: 'BL-CMAUBD3390 assigned to Red Channel', time: '2 hrs ago', color: '#dc2626' },
  { text: 'Examination report uploaded for BL-OOLUBD2204', time: '5 hrs ago', color: '#ca8a04' },
  { text: 'IGM verification completed for BL-HLCUBD9931', time: '8 hrs ago', color: '#0891b2' },
  { text: 'New case registered: BL-TCLUBD9087 (Zenith Apparel)', time: 'Yesterday', color: '#9333ea' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { state, navigate, set } = useApp();
  const { cases, workflow } = state;
  const wfLen = workflow.length;

  const summaryCards = useSummaryCards(cases, wfLen);
  const pipeline = usePipeline(cases, workflow);
  const channelDist = useChannelDist(cases);

  const pipelineTotal = Math.max(1, pipeline.reduce((s, seg) => s + seg.count, 0));
  const maxMonthly = Math.max(...MONTHLY_DATA.values);

  /* Needs-attention list */
  const attentionCases = useMemo(() => {
    return cases
      .filter(c => {
        if (c.currentStep < 2) return true;
        if (c.channel === 'red') return true;
        if (c.currentStep >= 8 && c.currentStep <= 11) return true;
        return false;
      })
      .slice(0, 5)
      .map(c => {
        let reason = '';
        if (c.currentStep < 2) reason = 'Pending Vetting';
        else if (c.channel === 'red') reason = 'Red Channel';
        else if (c.currentStep >= 8 && c.currentStep <= 11) reason = 'Under Examination';
        return { ...c, reason };
      });
  }, [cases]);

  /* Donut gradient */
  const donutGradient = useMemo(() => {
    const t = Math.max(1, channelDist.total);
    const gPct = (channelDist.green / t) * 100;
    const yPct = (channelDist.yellow / t) * 100;
    const rPct = (channelDist.red / t) * 100;
    const uPct = (channelDist.unassigned / t) * 100;
    const s1 = gPct;
    const s2 = s1 + yPct;
    const s3 = s2 + rPct;
    return `conic-gradient(#16a34a 0% ${s1}%, #ca8a04 ${s1}% ${s2}%, #dc2626 ${s2}% ${s3}%, #d1d5db ${s3}% 100%)`;
  }, [channelDist]);

  function handleCardClick(filter: string) {
    navigate('cases', { cardFilter: filter, page: 1 });
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h1 className="text-xl font-bold text-[#1b2a3d]">Dashboard</h1>

      {/* ---- Summary Cards Grid ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {summaryCards.map(card => (
          <Card
            key={card.filter}
            className="relative overflow-hidden"
            padding="p-4"
            onClick={() => handleCardClick(card.filter)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{ backgroundColor: card.color }}
            />
            <p className="text-xs text-[#5b6b7b] mb-1 pl-2">{card.label}</p>
            <p className="text-2xl font-bold pl-2" style={{ color: card.color }}>
              {card.value}
            </p>
          </Card>
        ))}
      </div>

      {/* ---- Progress Pipeline ---- */}
      <Card>
        <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Progress Pipeline</h2>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {pipeline.map(seg =>
            seg.count > 0 ? (
              <div
                key={seg.label}
                className="flex items-center justify-center text-white text-xs font-medium transition-all"
                style={{
                  width: `${(seg.count / pipelineTotal) * 100}%`,
                  backgroundColor: seg.color,
                }}
              >
                {seg.count}
              </div>
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {pipeline.map(seg => (
            <div key={seg.label} className="flex items-center gap-1.5 text-xs text-[#5b6b7b]">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              {seg.label} ({seg.count})
            </div>
          ))}
        </div>
      </Card>

      {/* ---- Channel Distribution + Monthly Completions ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Channel Distribution (wider) */}
        <Card className="lg:col-span-3">
          <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Channel Distribution</h2>
          <div className="flex items-center gap-8">
            {/* Donut */}
            <div className="relative flex-shrink-0">
              <div
                className="w-32 h-32 rounded-full"
                style={{ background: donutGradient }}
              />
              <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                <span className="text-lg font-bold text-[#1b2a3d]">{channelDist.total}</span>
              </div>
            </div>
            {/* Bars */}
            <div className="flex-1 space-y-3">
              {([
                { label: 'Green', count: channelDist.green, color: '#16a34a' },
                { label: 'Yellow', count: channelDist.yellow, color: '#ca8a04' },
                { label: 'Red', count: channelDist.red, color: '#dc2626' },
                { label: 'Unassigned', count: channelDist.unassigned, color: '#d1d5db' },
              ] as const).map(ch => (
                <div key={ch.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5b6b7b]">{ch.label}</span>
                    <span className="font-semibold text-[#1b2a3d]">{ch.count}</span>
                  </div>
                  <div className="h-2 bg-[#f1f3f6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${channelDist.total ? (ch.count / channelDist.total) * 100 : 0}%`,
                        backgroundColor: ch.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Monthly Completions */}
        <Card className="lg:col-span-2">
          <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Monthly Completions</h2>
          <div className="flex items-end justify-between gap-2 h-36">
            {MONTHLY_DATA.months.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-[#1b2a3d]">
                  {MONTHLY_DATA.values[i]}
                </span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${(MONTHLY_DATA.values[i] / maxMonthly) * 100}%`,
                    backgroundColor: '#0a6ed1',
                  }}
                />
                <span className="text-[10px] text-[#5b6b7b]">{m}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ---- Needs Attention + Recent Activity ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Needs Attention */}
        <Card>
          <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-3">Needs Attention</h2>
          {attentionCases.length === 0 ? (
            <p className="text-sm text-[#5b6b7b]">No cases need attention right now.</p>
          ) : (
            <div className="space-y-2">
              {attentionCases.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9fb] hover:bg-[#eef1f5] cursor-pointer transition-colors"
                  onClick={() => navigate('detail', { selectedId: c.id })}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1b2a3d] truncate">{c.bl}</p>
                    <p className="text-xs text-[#5b6b7b] truncate">{c.importer}</p>
                  </div>
                  <span
                    className="ml-3 flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color:
                        c.reason === 'Red Channel'
                          ? '#b91c1c'
                          : c.reason === 'Pending Vetting'
                            ? '#9a3412'
                            : '#155e75',
                      backgroundColor:
                        c.reason === 'Red Channel'
                          ? '#fdecec'
                          : c.reason === 'Pending Vetting'
                            ? '#fff3e0'
                            : '#e0f7fa',
                    }}
                  >
                    {c.reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card>
          <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {ACTIVITY_FEED.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span
                  className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-[#1b2a3d] leading-snug">{item.text}</p>
                  <p className="text-[11px] text-[#8a9bb0] mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
