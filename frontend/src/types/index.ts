export type Channel = 'green' | 'yellow' | 'red' | '';

export type ViewType = 'login' | 'dashboard' | 'cases' | 'detail' | 'reports' | 'settings' | 'builder' | 'attendance';

export interface WorkflowStep {
  id: string;
  title: string;
  phase: number;
  status: string;
  uploads?: string[];
  checks?: string[];
  fields?: { label: string; key: string; ph?: string; type?: string }[];
  hasRemarks?: boolean;
  channels?: string[];
  dropdown?: boolean;
  special?: string;
  note?: string;
  button?: string;
}

export interface StepData {
  notes: string;
  files: FileEntry[];
  checks: Record<string, boolean>;
  fields: Record<string, string>;
  completedDate?: string;
}

export interface FileEntry {
  id: string;
  name: string;
  type: 'pdf' | 'img';
  category: string;
  date: string;
  by: string;
  size: string;
}

export interface CustomStepFile {
  name: string;
  type: 'pdf' | 'img';
  size: string;
  date: string;
}

export interface CustomStepCheck {
  label: string;
  checked: boolean;
}

export interface CustomStep {
  id: string;
  title: string;
  insertAfter: string;
  notes: string;
  done: boolean;
  createdAt: string;
  checks: CustomStepCheck[];
  files: CustomStepFile[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Importer {
  id: string;
  name: string;
}

export interface Case {
  id: string;
  seq: number;
  serial: string;
  cNumber: string;
  cDate: string;
  bl: string;
  lc: string;
  invoice: string;
  importer: string;
  importerId?: string;
  supplier: string;
  vessel: string;
  container: string;
  invoiceValue: string;
  channel: Channel;
  zone: string;
  pkg: string;
  pallet: string;
  received: string;
  arrival: string;
  delivery: boolean;
  exam: boolean;
  assess: boolean;
  currentStep: number;
  lastUpdated: string;
  remarks: string;
  steps: Record<string, StepData>;
  customSteps: CustomStep[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending';
  self?: boolean;
}

export interface AttendanceRecord {
  in: string;
  out: string;
}

export type AttendanceData = Record<string, Record<string, AttendanceRecord>>;

export interface Settings {
  name: string;
  email: string;
  role: string;
  company: string;
  license: string;
  address: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  weeklyReport: boolean;
  autoSync: boolean;
  compact: boolean;
}

export interface AttendanceSettings {
  entryTime: string;
  graceMin: number;
  endTime: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  requireLocationCheckout: boolean;
}

export type SortKey = 'newest' | 'progress' | 'channel' | 'importer' | 'updated' | 'bl';
export type ActiveFilter = 'all' | 'active' | 'inactive';
