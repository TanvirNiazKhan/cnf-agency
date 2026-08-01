'use client';

import { useApp } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { getInitials } from '@/lib/data';
import { ROLE_COLORS, STATUS_META } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const fmtMin = (m: number) => { m = Math.max(0, Math.round(m)); return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); };
const parseTime = (t: string) => { if (!t || !t.includes(':')) return null; const p = t.split(':'); return +p[0] * 60 + +p[1]; };

function getMonthDays() {
  const out: string[] = [];
  for (let d = 1; d <= 27; d++) {
    const dow = new Date(2026, 5, d).getDay();
    if (dow === 0 || dow === 6) continue;
    out.push('2026-06-' + pad(d));
  }
  return out;
}

function dateLabel(key: string) {
  return new Date(key + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function AttendancePage() {
  const { state, set } = useApp();
  const { attSettings, attendance, users } = state;
  const isAdmin = state.currentUser?.role === 'Admin';
  const attView = isAdmin ? state.attView : 'me';
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (attView !== 'me') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [attView]);

  const meId = state.currentUser?.id || '';
  const todayKey = new Date().toISOString().split('T')[0];
  const limit = (parseTime(attSettings.entryTime) || 540) + attSettings.graceMin;
  const monthDays = getMonthDays();

  const attStatus = (rec: { in: string; out: string } | undefined) => {
    if (!rec || !rec.in) return 'absent';
    return (parseTime(rec.in) || 0) > limit ? 'late' : 'ontime';
  };

  const worked = (rec: { in: string; out: string } | undefined) => {
    if (rec?.in && rec?.out) {
      const inM = parseTime(rec.in), outM = parseTime(rec.out);
      if (inM !== null && outM !== null) return ((outM - inM) / 60).toFixed(1) + 'h';
    }
    return '—';
  };

  const meRec = attendance[meId]?.[todayKey];
  const checkedIn = !!(meRec?.in);
  const checkedOut = !!(meRec?.out);

  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const getLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by browser');
      return Promise.resolve(null);
    }
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => {
          setGeoError(err.code === 1 ? 'Location permission denied. Please enable GPS.' : 'Could not get location. Try again.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  };

  const checkIn = async () => {
    setGeoError('');
    setGeoLoading(true);
    const loc = attSettings.latitude != null ? await getLocation() : {};
    setGeoLoading(false);
    if (attSettings.latitude != null && !loc) return;

    const res = await api.post<any>('/attendance/check-in', { date: todayKey, ...loc });
    if (res.error) { setGeoError(res.error); return; }
    const newAtt = { ...attendance };
    newAtt[meId] = {
      ...(newAtt[meId] || {}),
      [todayKey]: {
        in: res.data?.checkIn || new Date().toTimeString().slice(0, 5),
        out: '',
      },
    };
    set({ attendance: newAtt });
  };

  const checkOut = async () => {
    setGeoError('');
    const needGps = attSettings.latitude != null && attSettings.requireLocationCheckout;
    setGeoLoading(needGps);
    const loc = needGps ? await getLocation() : {};
    setGeoLoading(false);
    if (needGps && !loc) return;

    const res = await api.post<any>('/attendance/check-out', { date: todayKey, ...loc });
    if (res.error) { setGeoError(res.error); return; }
    const newAtt = { ...attendance };
    const existing = newAtt[meId]?.[todayKey] || { in: '', out: '' };
    newAtt[meId] = {
      ...(newAtt[meId] || {}),
      [todayKey]: {
        ...existing,
        out: res.data?.checkOut || new Date().toTimeString().slice(0, 5),
      },
    };
    set({ attendance: newAtt });
  };

  const todayData = users.map(u => {
    const rec = attendance[u.id]?.[todayKey];
    let st: string;
    if (rec?.in) st = attStatus(rec);
    else if (u.id === meId) st = 'pending';
    else st = 'absent';
    const meta = STATUS_META[st];
    return { ...u, rec, st, meta, initials: getInitials(u.name), avatarBg: ROLE_COLORS[u.role] || '#475569', checkIn: rec?.in || '—', checkOut: rec?.out || '—', worked: worked(rec) };
  });

  const presentN = todayData.filter(r => r.st === 'ontime' || r.st === 'late').length;
  const onTimeN = todayData.filter(r => r.st === 'ontime').length;
  const lateN = todayData.filter(r => r.st === 'late').length;
  const absentN = todayData.filter(r => r.st === 'absent').length;
  const rate = users.length ? Math.round(presentN / users.length * 100) : 0;

  const monthlyData = users.map(u => {
    let ot = 0, la = 0, ab = 0, sum = 0, cnt = 0;
    monthDays.forEach(k => {
      const rec = attendance[u.id]?.[k];
      if (rec?.in) {
        if (attStatus(rec) === 'late') la++; else ot++;
        sum += parseTime(rec.in) || 0;
        cnt++;
      } else ab++;
    });
    const present = ot + la;
    const pct = monthDays.length ? Math.round(present / monthDays.length * 100) : 0;
    return { ...u, present, late: la, absent: ab, avg: cnt ? fmtMin(sum / cnt) : '—', pct, initials: getInitials(u.name), avatarBg: ROLE_COLORS[u.role] || '#475569' };
  });

  // My stats
  const me = users.find(u => u.id === meId) || state.currentUser || { id: meId, name: '', role: '', email: '' };
  const meStatus = meRec?.in ? attStatus(meRec) : 'pending';
  const meMeta = STATUS_META[meStatus];
  const nowD = new Date(now);
  const clock = pad(nowD.getHours()) + ':' + pad(nowD.getMinutes()) + ':' + pad(nowD.getSeconds());

  let mot = 0, mla = 0, mab = 0, msum = 0, mcnt = 0;
  monthDays.forEach(k => {
    const rec = attendance[meId]?.[k];
    if (rec?.in) {
      if (attStatus(rec) === 'late') mla++; else mot++;
      msum += parseTime(rec.in) || 0;
      mcnt++;
    } else mab++;
  });
  const mePresent = mot + mla;

  const RC = 2 * Math.PI * 34;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#16222e]">Attendance</h1>
          <p className="text-[13px] text-[#7b8794] mt-0.5">
            {attView === 'admin' ? "Configure the entry time and track your team's daily attendance" : 'Check in for the day and review your own attendance record'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex bg-[#eef1f5] rounded-xl p-1 gap-0.5">
            <button
              onClick={() => set({ attView: 'admin' })}
              className={`px-4 py-1.5 rounded-lg text-[12.5px] font-semibold cursor-pointer transition ${attView === 'admin' ? 'bg-white text-[#0a6ed1] shadow-sm' : 'bg-transparent text-[#5b6b7b]'}`}
            >
              Team
            </button>
            <button
              onClick={() => set({ attView: 'me' })}
              className={`px-4 py-1.5 rounded-lg text-[12.5px] font-semibold cursor-pointer transition ${attView === 'me' ? 'bg-white text-[#0a6ed1] shadow-sm' : 'bg-transparent text-[#5b6b7b]'}`}
            >
              My Attendance
            </button>
          </div>
        )}
      </div>

      {attView === 'admin' ? (
        <AdminView
          attSettings={attSettings}
          set={set}
          limit={limit}
          todayData={todayData}
          todayKey={todayKey}
          presentN={presentN}
          onTimeN={onTimeN}
          lateN={lateN}
          absentN={absentN}
          rate={rate}
          totalEmp={users.length}
          monthlyData={monthlyData}
          monthDays={monthDays}
          RC={RC}
          attendance={attendance}
          attStatus={attStatus}
          worked={worked}
          users={users}
        />
      ) : (
        <MyView
          me={me}
          meRec={meRec}
          meStatus={meStatus}
          meMeta={meMeta}
          clock={clock}
          todayKey={todayKey}
          checkedIn={checkedIn}
          checkedOut={checkedOut}
          checkIn={checkIn}
          checkOut={checkOut}
          geoError={geoError}
          geoLoading={geoLoading}
          attSettings={attSettings}
          mePresent={mePresent}
          mot={mot}
          mla={mla}
          mab={mab}
          mcnt={mcnt}
          msum={msum}
          meId={meId}
          attendance={attendance}
          monthDays={monthDays}
          attStatus={attStatus}
          limit={limit}
          worked={worked}
        />
      )}
    </div>
  );
}

function AdminView({ attSettings, set, limit, todayData, todayKey, presentN, onTimeN, lateN, absentN, rate, totalEmp, monthlyData, monthDays, RC, attendance, attStatus, worked, users }: any) {
  const [saved, setSaved] = useState(false);

  const saveSettings = async () => {
    await api.patch('/settings/attendance', {
      entryTime: attSettings.entryTime,
      graceMin: attSettings.graceMin,
      endTime: attSettings.endTime,
      latitude: attSettings.latitude,
      longitude: attSettings.longitude,
      radiusMeters: attSettings.radiusMeters,
      requireLocationCheckout: attSettings.requireLocationCheckout,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <h3 className="text-[14px] font-bold text-[#16222e] mb-4">Office Hours Configuration</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11.5px] font-semibold text-[#5b6b7b] mb-1 block">Entry Time</label>
              <input type="time" value={attSettings.entryTime} onChange={e => set({ attSettings: { ...attSettings, entryTime: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg border border-[#e4e8ee] text-[13px] focus:outline-none focus:border-[#0a6ed1]" />
            </div>
            <div>
              <label className="text-[11.5px] font-semibold text-[#5b6b7b] mb-1 block">Grace (min)</label>
              <input type="number" value={attSettings.graceMin} onChange={e => set({ attSettings: { ...attSettings, graceMin: Math.max(0, Math.min(120, parseInt(e.target.value) || 0)) } })}
                className="w-full px-3 py-2 rounded-lg border border-[#e4e8ee] text-[13px] focus:outline-none focus:border-[#0a6ed1]" />
            </div>
            <div>
              <label className="text-[11.5px] font-semibold text-[#5b6b7b] mb-1 block">End Time</label>
              <input type="time" value={attSettings.endTime} onChange={e => set({ attSettings: { ...attSettings, endTime: e.target.value } })}
                className="w-full px-3 py-2 rounded-lg border border-[#e4e8ee] text-[13px] focus:outline-none focus:border-[#0a6ed1]" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11.5px] text-[#9aa6b4]">Arrivals after {fmtMin(limit)} are marked Late</p>
            <button
              onClick={saveSettings}
              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-[#0a6ed1] text-white hover:bg-[#0860b6] cursor-pointer transition-colors"
            >
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-[#eef1f5]">
            <h4 className="text-[13px] font-bold text-[#16222e] mb-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Office Location
            </h4>
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div>
                <label className="text-[11.5px] font-semibold text-[#5b6b7b] mb-1 block">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={attSettings.latitude ?? ''}
                  placeholder="23.8103"
                  onChange={e => {
                    const v = e.target.value ? parseFloat(e.target.value) : null;
                    set({ attSettings: { ...attSettings, latitude: v } });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e8ee] text-[13px] focus:outline-none focus:border-[#0a6ed1]"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-semibold text-[#5b6b7b] mb-1 block">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={attSettings.longitude ?? ''}
                  placeholder="90.4125"
                  onChange={e => {
                    const v = e.target.value ? parseFloat(e.target.value) : null;
                    set({ attSettings: { ...attSettings, longitude: v } });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e8ee] text-[13px] focus:outline-none focus:border-[#0a6ed1]"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-semibold text-[#5b6b7b] mb-1 block">Radius (m)</label>
                <input
                  type="number"
                  value={attSettings.radiusMeters}
                  onChange={e => set({ attSettings: { ...attSettings, radiusMeters: Math.max(10, parseInt(e.target.value) || 100) } })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e8ee] text-[13px] focus:outline-none focus:border-[#0a6ed1]"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attSettings.requireLocationCheckout}
                onChange={e => set({ attSettings: { ...attSettings, requireLocationCheckout: e.target.checked } })}
                className="w-4 h-4 rounded border-[#c5ccd6] accent-[#0a6ed1]"
              />
              <span className="text-[12.5px] text-[#5b6b7b]">Also require location for check-out</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(pos => {
                    set({ attSettings: { ...attSettings, latitude: Math.round(pos.coords.latitude * 1e6) / 1e6, longitude: Math.round(pos.coords.longitude * 1e6) / 1e6 } });
                  });
                }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#eaf2fd] text-[#0a6ed1] hover:bg-[#0a6ed1] hover:text-white cursor-pointer transition-colors"
              >
                Use Current Location
              </button>
              {attSettings.latitude != null && (
                <button
                  onClick={() => set({ attSettings: { ...attSettings, latitude: null, longitude: null } })}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#dc2626] hover:bg-[#fdecec] cursor-pointer transition-colors"
                >
                  Disable Location
                </button>
              )}
              <button
                onClick={saveSettings}
                className="ml-auto px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-[#0a6ed1] text-white hover:bg-[#0860b6] cursor-pointer transition-colors"
              >
                {saved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
            {attSettings.latitude != null && (
              <p className="text-[11px] text-[#9aa6b4] mt-2">
                Employees must be within {attSettings.radiusMeters}m of ({attSettings.latitude}, {attSettings.longitude}) to check in/out
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-[14px] font-bold text-[#16222e] mb-3">Today&apos;s Summary</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-[86px] h-[86px]">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#eef1f5" strokeWidth="8" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#36d399" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={RC.toFixed(1)} strokeDashoffset={(RC * (1 - rate / 100)).toFixed(1)} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[18px] font-bold text-[#16222e]">{rate}%</div>
            </div>
            <div className="flex flex-col gap-2">
              {[{ label: 'On Time', value: onTimeN, color: '#36d399' }, { label: 'Late', value: lateN, color: '#ffd15c' }, { label: 'Absent', value: absentN, color: '#ff8a8a' }].map(c => (
                <div key={c.label} className="flex items-center gap-2 text-[12.5px]">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-[#5b6b7b]">{c.label}</span>
                  <span className="font-bold text-[#16222e] ml-1">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <AttendanceTable
        users={users}
        attendance={attendance}
        attStatus={attStatus}
        worked={worked}
        todayKey={todayKey}
        totalEmp={totalEmp}
        limit={limit}
      />

      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#16222e] text-white shadow-lg animate-[slideUp_0.3s_ease-out]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#36d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span className="text-[13.5px] font-semibold">Settings saved successfully</span>
        </div>
      )}
    </>
  );
}

function getWeekRange(date: Date): [Date, Date] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return [start, end];
}

function getDaysInRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getMonthRange(year: number, month: number): string[] {
  const days: string[] = [];
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow === 0 || dow === 6) continue;
    days.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  }
  return days;
}

function AttendanceTable({ users, attendance, attStatus, worked, todayKey, totalEmp, limit }: any) {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });

  const modes = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ] as const;

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  const buildUserRow = (u: any, dateKey: string) => {
    const rec = attendance[u.id]?.[dateKey];
    const st = rec?.in ? attStatus(rec) : 'absent';
    const meta = STATUS_META[st];
    return { ...u, rec, st, meta, initials: getInitials(u.name), avatarBg: ROLE_COLORS[u.role] || '#475569', checkIn: rec?.in || '—', checkOut: rec?.out || '—', worked: worked(rec) };
  };

  // Day View
  if (viewMode === 'day') {
    const rows = users.map((u: any) => buildUserRow(u, selectedDate));
    const isToday = selectedDate === todayKey;

    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-[#16222e]">Team Attendance</h3>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#eef1f5] rounded-lg p-0.5 gap-0.5">
              {modes.map(m => (
                <button key={m.key} onClick={() => setViewMode(m.key)}
                  className={`px-3 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer transition ${viewMode === m.key ? 'bg-white text-[#0a6ed1] shadow-sm' : 'text-[#5b6b7b]'}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => shiftDate(-1)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#eef1f5] cursor-pointer text-[#5b6b7b] text-[16px]">&lsaquo;</button>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-[#e4e8ee] text-[12px] text-[#16222e] focus:outline-none focus:border-[#0a6ed1]" />
              <button onClick={() => shiftDate(1)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#eef1f5] cursor-pointer text-[#5b6b7b] text-[16px]">&rsaquo;</button>
              {!isToday && (
                <button onClick={() => setSelectedDate(todayKey)} className="px-2 py-1 rounded-md text-[11px] font-semibold text-[#0a6ed1] hover:bg-[#eaf2fd] cursor-pointer">Today</button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] font-semibold text-[#7b8794] border-b border-[#eef1f5]">
                <th className="pb-2.5 pr-4">Employee</th>
                <th className="pb-2.5 pr-4">Check In</th>
                <th className="pb-2.5 pr-4">Check Out</th>
                <th className="pb-2.5 pr-4">Worked</th>
                <th className="pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b border-[#f4f6f9]">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: r.avatarBg }}>{r.initials}</div>
                      <div>
                        <div className="font-medium text-[#16222e]">{r.name}</div>
                        <div className="text-[11px] text-[#9aa6b4]">{r.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[12.5px]">{r.checkIn}</td>
                  <td className="py-2.5 pr-4 font-mono text-[12.5px]">{r.checkOut}</td>
                  <td className="py-2.5 pr-4 font-mono text-[12.5px]">{r.worked}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11.5px] font-semibold" style={{ color: r.meta[1], background: r.meta[2] }}>{r.meta[0]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // Week View
  if (viewMode === 'week') {
    const refDate = new Date(selectedDate + 'T00:00:00');
    const [weekStart, weekEnd] = getWeekRange(refDate);
    const weekDays = getDaysInRange(weekStart, weekEnd);
    const fmtShort = (k: string) => new Date(k + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-[#16222e]">Team Attendance</h3>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#eef1f5] rounded-lg p-0.5 gap-0.5">
              {modes.map(m => (
                <button key={m.key} onClick={() => setViewMode(m.key)}
                  className={`px-3 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer transition ${viewMode === m.key ? 'bg-white text-[#0a6ed1] shadow-sm' : 'text-[#5b6b7b]'}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => shiftDate(-7)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#eef1f5] cursor-pointer text-[#5b6b7b] text-[16px]">&lsaquo;</button>
              <span className="text-[12px] font-medium text-[#16222e] px-2">
                {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={() => shiftDate(7)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#eef1f5] cursor-pointer text-[#5b6b7b] text-[16px]">&rsaquo;</button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] font-semibold text-[#7b8794] border-b border-[#eef1f5]">
                <th className="pb-2.5 pr-4 sticky left-0 bg-white">Employee</th>
                {weekDays.map(d => (
                  <th key={d} className={`pb-2.5 px-2 text-center min-w-[70px] ${d === todayKey ? 'text-[#0a6ed1]' : ''}`}>{fmtShort(d)}</th>
                ))}
                <th className="pb-2.5 px-2 text-center">Present</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => {
                let present = 0;
                const cells = weekDays.map(d => {
                  const rec = attendance[u.id]?.[d];
                  const st = rec?.in ? attStatus(rec) : 'absent';
                  if (st !== 'absent') present++;
                  const meta = STATUS_META[st];
                  return { d, st, meta, inTime: rec?.in || '' };
                });
                return (
                  <tr key={u.id} className="border-b border-[#f4f6f9]">
                    <td className="py-2 pr-4 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: ROLE_COLORS[u.role] || '#475569' }}>{getInitials(u.name)}</div>
                        <span className="font-medium text-[#16222e] text-[12.5px] whitespace-nowrap">{u.name}</span>
                      </div>
                    </td>
                    {cells.map(c => (
                      <td key={c.d} className={`py-2 px-2 text-center ${c.d === todayKey ? 'bg-[#f8faff]' : ''}`}>
                        {c.inTime ? (
                          <div>
                            <span className="font-mono text-[11px]" style={{ color: c.meta[1] }}>{c.inTime}</span>
                          </div>
                        ) : (
                          <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]" style={{ background: c.meta[2], color: c.meta[1] }}>✕</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center font-semibold text-[12px] text-[#16222e]">{present}/{weekDays.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // Month View
  const [mYear, mMonth] = selectedMonth.split('-').map(Number);
  const mDays = getMonthRange(mYear, mMonth - 1);
  const monthName = new Date(mYear, mMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const mRows = users.map((u: any) => {
    let ot = 0, la = 0, ab = 0, sum = 0, cnt = 0;
    mDays.forEach(k => {
      const rec = attendance[u.id]?.[k];
      if (rec?.in) {
        if (attStatus(rec) === 'late') la++; else ot++;
        sum += parseTime(rec.in) || 0;
        cnt++;
      } else ab++;
    });
    const present = ot + la;
    const pct = mDays.length ? Math.round(present / mDays.length * 100) : 0;
    return { ...u, present, onTime: ot, late: la, absent: ab, avg: cnt ? fmtMin(sum / cnt) : '—', pct, initials: getInitials(u.name), avatarBg: ROLE_COLORS[u.role] || '#475569' };
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold text-[#16222e]">Team Attendance</h3>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#eef1f5] rounded-lg p-0.5 gap-0.5">
            {modes.map(m => (
              <button key={m.key} onClick={() => setViewMode(m.key)}
                className={`px-3 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer transition ${viewMode === m.key ? 'bg-white text-[#0a6ed1] shadow-sm' : 'text-[#5b6b7b]'}`}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => shiftMonth(-1)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#eef1f5] cursor-pointer text-[#5b6b7b] text-[16px]">&lsaquo;</button>
            <span className="text-[12px] font-medium text-[#16222e] px-2 min-w-[120px] text-center">{monthName}</span>
            <button onClick={() => shiftMonth(1)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#eef1f5] cursor-pointer text-[#5b6b7b] text-[16px]">&rsaquo;</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] font-semibold text-[#7b8794] border-b border-[#eef1f5]">
              <th className="pb-2.5 pr-4">Employee</th>
              <th className="pb-2.5 pr-4 text-center">Present</th>
              <th className="pb-2.5 pr-4 text-center">On Time</th>
              <th className="pb-2.5 pr-4 text-center">Late</th>
              <th className="pb-2.5 pr-4 text-center">Absent</th>
              <th className="pb-2.5 pr-4 text-center">Avg Check-in</th>
              <th className="pb-2.5 text-center">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {mRows.map((r: any) => (
              <tr key={r.id} className="border-b border-[#f4f6f9]">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: r.avatarBg }}>{r.initials}</div>
                    <div>
                      <div className="font-medium text-[#16222e]">{r.name}</div>
                      <div className="text-[11px] text-[#9aa6b4]">{r.role}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-center font-semibold">{r.present}/{mDays.length}</td>
                <td className="py-2.5 pr-4 text-center"><span className="text-[#16a34a] font-semibold">{r.onTime}</span></td>
                <td className="py-2.5 pr-4 text-center"><span className="text-[#ca8a04] font-semibold">{r.late}</span></td>
                <td className="py-2.5 pr-4 text-center"><span className="text-[#dc2626] font-semibold">{r.absent}</span></td>
                <td className="py-2.5 pr-4 text-center font-mono text-[12.5px]">{r.avg}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[#eef1f5] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: r.pct + '%', background: r.pct >= 80 ? '#36d399' : r.pct >= 60 ? '#ffd15c' : '#ff8a8a' }} />
                    </div>
                    <span className="text-[11px] font-semibold text-[#5b6b7b] w-8 text-right">{r.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MyView({ me, meRec, meStatus, meMeta, clock, todayKey, checkedIn, checkedOut, checkIn, checkOut, geoError, geoLoading, attSettings, mePresent, mot, mla, mab, mcnt, msum, meId, attendance, monthDays, attStatus, limit, worked }: any) {
  const meStats = [
    { label: 'Present Days', value: mePresent, color: '#0a6ed1', bg: '#eef5ff' },
    { label: 'On Time', value: mot, color: '#16a34a', bg: '#e7f5ec' },
    { label: 'Late', value: mla, color: '#ca8a04', bg: '#fdf4e1' },
    { label: 'Absent', value: mab, color: '#dc2626', bg: '#fdecec' },
    { label: 'On-time Rate', value: (mePresent ? Math.round(mot / mePresent * 100) : 0) + '%', color: '#0a6ed1', bg: '#eef5ff' },
    { label: 'Avg Check-in', value: mcnt ? fmtMin(msum / mcnt) : '—', color: '#5b6b7b', bg: '#eef1f4' },
  ];

  const wkKeys = monthDays.slice(-7);
  const meWeek = wkKeys.map((k: string) => {
    const rec = attendance[meId]?.[k];
    const d = new Date(k + 'T00:00:00');
    const dow = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
    const dnum = d.getDate();
    if (!rec?.in) return { dow, dnum, inTime: 'Absent', hPct: 8, color: '#e2632e', barBg: '#fdecec', absent: true };
    const st = attStatus(rec);
    const delta = (parseTime(rec.in) || 0) - limit;
    const hPct = Math.max(28, Math.min(96, 72 - delta * 1.1));
    return { dow, dnum, inTime: rec.in, hPct, color: st === 'late' ? '#ca8a04' : '#16a34a', barBg: st === 'late' ? '#fdf4e1' : '#e7f5ec', absent: false };
  });

  const histKeys = [...monthDays];
  if (meRec?.in) histKeys.push(todayKey);
  const meHistory = histKeys.slice().reverse().slice(0, 8).map((k: string) => {
    const rec = attendance[meId]?.[k];
    const st = rec?.in ? attStatus(rec) : 'absent';
    const meta = STATUS_META[st];
    return { date: dateLabel(k), isToday: k === todayKey, checkIn: rec?.in || '—', checkOut: rec?.out || '—', worked: worked(rec), statusLabel: meta[0], meta };
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ background: ROLE_COLORS[me.role] || '#475569' }}>
              {getInitials(me.name)}
            </div>
            <div>
              <div className="font-bold text-[#16222e]">{me.name}</div>
              <div className="text-[12px] text-[#7b8794]">{me.role}</div>
            </div>
          </div>
          <div className="text-center mb-4">
            <div className="text-[40px] font-bold text-[#16222e] font-mono tracking-wider">{clock}</div>
            <div className="text-[12.5px] text-[#7b8794]">
              {new Date(todayKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-[11.5px] text-[#9aa6b4] mt-1">Office entry {attSettings.entryTime} · {attSettings.graceMin}m grace</div>
          </div>

          {geoError && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-[#fdecec] text-[#b91c1c] text-[12.5px] font-medium">
              {geoError}
            </div>
          )}

          {attSettings.latitude != null && (
            <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[#7b8794]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Location required · within {attSettings.radiusMeters}m of office
            </div>
          )}

          {!checkedIn && (
            <button onClick={checkIn} disabled={geoLoading} className="w-full py-3 bg-[#0a6ed1] text-white rounded-xl font-semibold text-[14px] cursor-pointer hover:bg-[#0960b8] transition disabled:opacity-60 disabled:cursor-not-allowed">
              {geoLoading ? 'Getting location...' : 'Check In'}
            </button>
          )}
          {checkedIn && !checkedOut && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12.5px] text-[#5b6b7b]">Checked in at <b className="text-[#16222e]">{meRec?.in}</b></span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11.5px] font-semibold" style={{ color: meMeta[1], background: meMeta[2] }}>{meMeta[0]}</span>
              </div>
              <button onClick={checkOut} disabled={geoLoading} className="w-full py-3 bg-[#dc2626] text-white rounded-xl font-semibold text-[14px] cursor-pointer hover:bg-[#b91c1c] transition disabled:opacity-60 disabled:cursor-not-allowed">
                {geoLoading ? 'Getting location...' : 'Check Out'}
              </button>
            </div>
          )}
          {checkedOut && (
            <div className="text-center text-[13px] text-[#7b8794]">
              <p>In: <b>{meRec?.in}</b> · Out: <b>{meRec?.out}</b> · Worked: <b>{worked(meRec)}</b></p>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11.5px] font-semibold mt-2" style={{ color: meMeta[1], background: meMeta[2] }}>{meMeta[0]}</span>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-[14px] font-bold text-[#16222e] mb-3">Weekly Check-in Trend</h3>
          <div className="flex items-end justify-between gap-2 h-[160px] px-2">
            {meWeek.map((w: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] font-mono text-[#7b8794]">{w.absent ? '' : w.inTime}</span>
                <div className="w-full rounded-t-lg" style={{ height: w.hPct + '%', background: w.barBg, minHeight: 8 }}>
                  <div className="w-full h-full rounded-t-lg" style={{ background: w.color, opacity: 0.6 }} />
                </div>
                <span className="text-[11px] font-semibold text-[#5b6b7b]">{w.dow}</span>
                <span className="text-[10px] text-[#9aa6b4]">{w.dnum}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        {meStats.map(s => (
          <Card key={s.label} padding="p-3.5">
            <div className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11.5px] text-[#7b8794] mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-[14px] font-bold text-[#16222e] mb-3">Recent History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] font-semibold text-[#7b8794] border-b border-[#eef1f5]">
                <th className="pb-2.5 pr-4">Date</th>
                <th className="pb-2.5 pr-4">Check In</th>
                <th className="pb-2.5 pr-4">Check Out</th>
                <th className="pb-2.5 pr-4">Worked</th>
                <th className="pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {meHistory.map((h: any, i: number) => (
                <tr key={i} className="border-b border-[#f4f6f9]">
                  <td className="py-2.5 pr-4 font-medium">{h.date} {h.isToday && <span className="text-[10px] text-[#0a6ed1] font-semibold ml-1">Today</span>}</td>
                  <td className="py-2.5 pr-4 font-mono text-[12.5px]">{h.checkIn}</td>
                  <td className="py-2.5 pr-4 font-mono text-[12.5px]">{h.checkOut}</td>
                  <td className="py-2.5 pr-4 font-mono text-[12.5px]">{h.worked}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11.5px] font-semibold" style={{ color: h.meta[1], background: h.meta[2] }}>{h.statusLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
