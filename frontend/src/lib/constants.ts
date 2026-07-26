export const PHASE_LABELS = [
  'Phase 1 · Document Verification & Entry',
  'Phase 2 · Assessment',
  'Phase 3 · Physical Examination',
  'Phase 4 · Document Sorting & Delivery',
];

export const PHASE_COLORS = ['#9333ea', '#0a6ed1', '#0891b2', '#d97706'];

export const CHANNEL_META: Record<string, [string, string, string, string]> = {
  green: ['Green', '#15803d', '#e7f5ec', '#16a34a'],
  yellow: ['Yellow', '#a16207', '#fdf4e1', '#ca8a04'],
  red: ['Red', '#b91c1c', '#fdecec', '#dc2626'],
};

export const ROLE_COLORS: Record<string, string> = {
  Admin: '#0a6ed1',
  'Documentation Officer': '#0891b2',
  'Examination Officer': '#d97706',
  'Delivery Coordinator': '#7c3aed',
  'C&F Agent': '#16a34a',
  Viewer: '#64748b',
};

export const STATUS_META: Record<string, [string, string, string, string]> = {
  ontime: ['On Time', '#15803d', '#e7f5ec', '#16a34a'],
  late: ['Late', '#a16207', '#fdf4e1', '#ca8a04'],
  absent: ['Absent', '#b91c1c', '#fdecec', '#dc2626'],
  pending: ['Not Checked In', '#5b6b7b', '#eef1f4', '#94a3b8'],
};

export const PAGE_SIZE = 7;

export const IMPORTER_BASE = [
  'ALAMIN & BROTHERS', 'E-COOL', 'EXCEL', 'DREAM VIEW', 'AKIJ',
  'EMF', 'EASTERN MARBLE', 'WESTERN MARBLE', 'AYZO', 'DIRECTION', 'DESIGN',
];
