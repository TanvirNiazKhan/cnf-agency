import { Case, User, AttendanceData, WorkflowStep } from '@/types';
import { defaultWorkflow, applies } from './workflow';

function catOf(label: string): string {
  const m: [RegExp, string][] = [
    [/^invoice/i, 'Invoice'], [/packing/i, 'Packing List'], [/bill of lading/i, 'BL'],
    [/certificate of origin/i, 'COO'], [/proforma/i, 'PI'], [/letter of credit/i, 'LC'],
    [/insurance/i, 'Insurance'], [/vat/i, 'VAT'], [/^irc/i, 'IRC'],
    [/declaration/i, 'ASYCUDA Declaration'], [/examination/i, 'Examination Report'],
    [/assessment/i, 'Assessment Notice'], [/set$/i, 'Outpass'], [/payment/i, 'Payment Receipt'],
    [/jetty/i, 'Others'],
  ];
  for (const [re, cat] of m) { if (re.test(label)) return cat; }
  return 'Others';
}

let _fileId = 0;
function mkFile(label: string, bl: string) {
  const isImg = /image/i.test(label);
  const ext = isImg ? '.jpg' : /xml/i.test(label) ? '.xml' : '.pdf';
  const name = label.replace(/[^a-z0-9]+/ig, '_').replace(/_+$/, '') + '_' + bl.replace('BL-', '') + ext;
  return {
    id: 'mock-file-' + (++_fileId),
    name, type: (isImg ? 'img' : 'pdf') as 'img' | 'pdf',
    category: catOf(label), date: 'Jun 24, 2026', by: 'Tanvir Ahmed',
    size: isImg ? '1.8 MB' : (Math.random() * 1.4 + 0.3).toFixed(1) + ' MB',
  };
}

export function buildCases(): Case[] {
  const wf = defaultWorkflow();
  const base: [string, string, string, string, string, string, boolean, boolean, string, boolean, string, string][] = [
    ['2101', '', '', '', '0898260/0115', 'red', false, true, '16-06-26', true, '2 Palt', 'ALAMIN & BROTHERS'],
    ['2102', '', '', '', '0898260/0115', 'red', false, false, '', false, '5 Palt', 'ALAMIN & BROTHERS'],
    ['2103', '', '', '', '0898260/0250', 'red', true, true, '14-06-26', true, '86 PK', 'ALAMIN & BROTHERS'],
    ['2104', 'C-1105753', '', 'CNH105R361', '0929260/0250', 'yellow', false, false, '', false, '1235 PK', 'EXCEL'],
    ['2105', 'C-1105416', '17-06-26', 'LNBCGIP260579', '0889260/0290', 'yellow', false, true, '16-06-26', false, '9 Palt', 'AYZO'],
    ['2106', 'C-1107886', '21-06-26', 'AMIGL26022789', '1475261504', 'yellow', false, true, '16-06-26', false, '43 ctn', 'EMF'],
    ['2107', 'C-1134483', '22-06-26', 'QDSE260528071', '0898260/0193', 'yellow', false, true, '17-06-26', false, '19 PK', 'ALAMIN & BROTHERS'],
    ['2108', 'C-1113453', '02-07-26', 'JUEG2606008', '1080260/0184', 'yellow', false, true, '18-06-26', false, '10 PK', 'DREAM VIEW'],
    ['2109', '', '23-06-26', 'FHHCC1P2651811', '0889260/0023', 'yellow', false, false, '', false, '166 ctn', 'AYZO'],
    ['2110', 'C-1115235', '24-06-26', 'NBSD260610132', '1819260/0252', 'yellow', false, true, '24-06-26', false, '36 PK', 'EASTERN MARBLE'],
    ['2111', 'C-1118554', '25-06-26', 'SNKOO21260500', '1818260/0113', 'yellow', false, false, '', false, '10 PK', 'AKIJ'],
    ['2112', 'C-1118517', '25-06-26', 'HKGIR26050599', '0898260/0258', 'red', true, true, '25-06-26', true, '2 Palt', 'ALAMIN & BROTHERS'],
    ['2113', 'C-1123721', '28-06-26', 'HKGIR26050600', '0898260/0258', 'red', true, true, '25-06-26', true, '8 Palt', 'ALAMIN & BROTHERS'],
    ['2114', 'C-1123847', '28-06-26', 'HKGIR26050602', '0898260/0260', 'red', true, true, '25-06-26', true, '4 Palt', 'ALAMIN & BROTHERS'],
    ['2115', 'C-1123775', '28-06-26', 'HKGIR26050603', '0898260/0260', 'red', true, true, '25-06-26', true, '14 Palt', 'ALAMIN & BROTHERS'],
    ['2116', 'C-1124266', '28-06-26', 'SVLCL202605463', '0898260/0023', 'yellow', true, true, '25-06-26', true, '16 Palt', 'ALAMIN & BROTHERS'],
    ['2117', 'C-1138657', '05-07-26', 'SVLCL202605576', '0898260/0023', 'red', true, true, '25-06-26', true, '14 PK', 'ALAMIN & BROTHERS'],
    ['2118', 'C-1138607', '05-07-26', 'SVLCL202606113', '0898260/0023', 'red', true, true, '27-06-26', false, '3 Palt', 'ALAMIN & BROTHERS'],
    ['2119', '', '05-07-26', 'SVLCL202606049', '0898260/0023', 'red', false, false, '27-06-26', false, '13 Palt', 'ALAMIN & BROTHERS'],
    ['2120', '', '', 'HKGIR26050676', '0898260/0275', 'red', false, false, '27-06-26', false, '38 Palt', 'DIRECTION'],
    ['2121', '', '', 'HKGIR26050677', '0898260/0275', 'green', false, false, '27-06-26', false, '39 Palt', 'DIRECTION'],
    ['2122', '', '', 'HKGIR26050678', '0898260/0275', 'green', false, false, '27-06-26', false, '39 Palt', 'DIRECTION'],
    ['2123', '', '', 'HKGIR26050679', '0898260/0275', 'green', false, false, '27-06-26', false, '39 Palt', 'DIRECTION'],
    ['2124', '', '', 'HKGIR26050680', '0898260/0275', 'green', false, false, '27-06-26', false, '37 Palt', 'DIRECTION'],
    ['2125', 'C-1138712', '05-07-26', 'HKGIR26060314', '0898260/0260', 'green', false, false, '30-06-26', true, '5 PK', 'ALAMIN & BROTHERS'],
    ['2126', 'C-1138878', '05-07-26', 'HKGIR26050724', '0898260/0224', 'red', false, false, '30-06-26', false, '6 Palt', 'ALAMIN & BROTHERS'],
    ['2127', 'C-1138656', '05-07-26', 'HKGIR26050725', '0898260/0224', 'red', false, false, '30-06-26', true, '3 Palt', 'ALAMIN & BROTHERS'],
    ['2128', 'C-1138829', '05-07-26', 'HKGIR26050722', '0898260/0233', 'red', false, false, '30-06-26', false, '7 Palt', 'ALAMIN & BROTHERS'],
    ['2129', 'C-1138772', '05-07-26', 'HKGIR26050723', '0898260/0233', 'red', false, false, '30-06-26', true, '3 Palt', 'ALAMIN & BROTHERS'],
    ['2130', '', '05-07-26', 'HKGIR26050726', '0898360/0262', 'red', false, false, '30-06-26', false, '15 Palt', 'ALAMIN & BROTHERS'],
  ];

  const fv = (key: string, cNumber: string): string => {
    const map: Record<string, string> = {
      cnumber: cNumber, decldate: '2026-06-15', entrydate: '2026-06-14',
      section: 'Section 4B', aro: 'Md. Karim', ro: 'A. Rahman',
      openingdate: '2026-06-18', hscode: '7308.90.00', declared: '$48,200', appraised: '$51,750',
      subdate: '2026-06-20', sectionroom: 'Room 204', handoverdate: '2026-06-23',
      deldate: '2026-06-24', receiver: 'Logistics Dept', amount: '৳ 412,500',
      receiptno: 'RCP-2026-8841', paymentdate: '2026-06-24',
    };
    return map[key] || '';
  };

  return base.map((b, i) => {
    const step = b[9] ? 24 : (b[7] ? 15 : (b[6] ? 10 : (b[8] ? 5 : 1)));
    const c: Case = {
      id: 'c' + (i + 1), seq: i, serial: b[0], cNumber: b[1], cDate: b[2],
      bl: b[3], invoice: b[4], lc: b[4], zone: b[5], channel: b[5] as Case['channel'],
      exam: !!b[6], assess: !!b[7], received: b[8], delivery: !!b[9],
      pallet: b[10], importer: b[11], currentStep: step,
      vessel: '', container: '', invoiceValue: '', pkg: '',
      lastUpdated: b[8] || b[2] || '—', arrival: b[8] || '—',
      remarks: '', supplier: '', steps: {}, customSteps: [],
    };

    for (let idx = 0; idx < c.currentStep && idx < wf.length; idx++) {
      const def = wf[idx];
      if (!applies(def, c.channel)) continue;
      const st = {
        notes: '', files: [] as ReturnType<typeof mkFile>[],
        checks: {} as Record<string, boolean>,
        fields: {} as Record<string, string>,
        completedDate: 'Jun ' + (12 + Math.min(idx, 16)) + ', 2026',
      };
      if (def.uploads) st.files = def.uploads.map(l => mkFile(l, c.bl));
      if (def.checks) def.checks.forEach(l => { st.checks[l] = l !== 'Corrections Required'; });
      if (def.fields) def.fields.forEach(f => { st.fields[f.key] = fv(f.key, c.cNumber); });
      if (def.hasRemarks) st.notes = 'Verified and forwarded.';
      c.steps[def.id] = st;
    }

    return c;
  });
}

export function buildUsers(): User[] {
  return [
    { id: 'u1', name: 'Tanvir Ahmed', email: 'tanvir@clearport.io', role: 'Admin', status: 'Active', self: true },
    { id: 'u2', name: 'Farhana Akter', email: 'farhana@clearport.io', role: 'Documentation Officer', status: 'Active' },
    { id: 'u3', name: 'Imran Hossain', email: 'imran@clearport.io', role: 'Examination Officer', status: 'Active' },
    { id: 'u4', name: 'Sadia Rahman', email: 'sadia@clearport.io', role: 'Delivery Coordinator', status: 'Pending' },
  ];
}

export function buildAttendance(): AttendanceData {
  const rng = (s: number) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  const pad = (n: number) => (n < 10 ? '0' : '') + n;
  const fmt = (m: number) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const prof: Record<string, { base: number; spread: number; abs: number }> = {
    u1: { base: 533, spread: 9, abs: 0.03 },
    u2: { base: 531, spread: 11, abs: 0.05 },
    u3: { base: 547, spread: 17, abs: 0.07 },
    u4: { base: 539, spread: 13, abs: 0.10 },
  };
  const ids = ['u1', 'u2', 'u3', 'u4'];
  const att: AttendanceData = {};
  ids.forEach(id => { att[id] = {}; });

  for (let d = 1; d <= 27; d++) {
    const dow = new Date(2026, 5, d).getDay();
    if (dow === 0 || dow === 6) continue;
    const key = '2026-06-' + pad(d);
    ids.forEach((id, ui) => {
      const p = prof[id];
      if (rng(d * 7.3 + ui * 31.1) < p.abs) { att[id][key] = { in: '', out: '' }; return; }
      const inMin = Math.round(p.base + (rng(d * 13.7 + ui * 17.3) - 0.5) * 2 * p.spread);
      const outMin = Math.round(1080 + (rng(d * 5.1 + ui * 23.9) - 0.5) * 40);
      att[id][key] = { in: fmt(inMin), out: fmt(outMin) };
    });
  }
  att.u2['2026-06-30'] = { in: '08:52', out: '' };
  att.u3['2026-06-30'] = { in: '09:23', out: '' };
  att.u4['2026-06-30'] = { in: '', out: '' };
  return att;
}

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
