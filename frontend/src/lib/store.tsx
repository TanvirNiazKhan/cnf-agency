'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  Case,
  User,
  AttendanceData,
  Settings,
  AttendanceSettings,
  ViewType,
  Channel,
  SortKey,
  ActiveFilter,
  StepData,
  FileEntry,
  WorkflowStep,
  AuthUser,
  Importer,
  CustomStep,
} from '@/types';
import { applies, nextApplicable } from './workflow';
import { api, clearToken } from './api';

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function fmtDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function mapWorkflowStep(s: any): WorkflowStep {
  return {
    id: s.id,
    title: s.title,
    phase: s.phase,
    status: s.statusLabel,
    uploads: s.uploads || undefined,
    checks: s.checks || undefined,
    fields: s.fields || undefined,
    hasRemarks: s.hasRemarks,
    channels: s.channels || undefined,
    dropdown: s.dropdown,
    special: s.special || undefined,
    note: s.note || undefined,
    button: s.buttonLabel || undefined,
  };
}

function mapFileEntry(f: any): FileEntry {
  return {
    id: f.id,
    name: f.name,
    type: f.type,
    category: f.category,
    date: fmtDisplayDate(f.fileDate),
    by: f.uploadedBy?.name || '',
    size: f.fileSize || '',
  };
}

function mapStepData(sd: any): StepData {
  return {
    notes: sd.notes || '',
    completedDate: sd.completedDate ? fmtDisplayDate(sd.completedDate) : undefined,
    checks: sd.checks || {},
    fields: sd.fields || {},
    files: (sd.files || []).map(mapFileEntry),
  };
}

function mapCase(c: any): Case {
  const steps: Record<string, StepData> = {};
  for (const sd of c.stepData || []) {
    steps[sd.stepId] = mapStepData(sd);
  }
  return {
    id: c.id,
    seq: c.seq,
    serial: c.serial || '',
    cNumber: c.cNumber || '',
    cDate: fmtDate(c.cDate),
    bl: c.bl,
    lc: c.lc || '',
    invoice: c.invoice || '',
    importer: c.importer?.name || '',
    importerId: c.importerId || '',
    supplier: c.supplier || '',
    vessel: c.vessel || '',
    container: c.container || '',
    invoiceValue: c.invoiceValue || '',
    channel: (c.channel as Channel) || '',
    zone: c.channel || '',
    pkg: c.pkg || '',
    pallet: c.pallet || '',
    received: fmtDate(c.received),
    arrival: fmtDate(c.arrival),
    delivery: c.delivery || false,
    exam: c.exam || false,
    assess: c.assess || false,
    currentStep: c.currentStep || 0,
    lastUpdated: fmtDisplayDate(c.updatedAt),
    remarks: c.remarks || '',
    steps,
    customSteps: (c.customSteps || []).map((cs: any) => ({
      ...cs,
      checks: cs.checks || [],
      files: cs.files || [],
    })),
  };
}

function mapUser(u: any, currentUserId: string): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status as 'Active' | 'Pending',
    self: u.id === currentUserId,
  };
}

function parseJwt(token: string): { sub: string; email: string; role: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface AppState {
  view: ViewType;
  search: string;
  channelFilter: string;
  importerFilter: string;
  dayFilter: string;
  activeFilter: ActiveFilter;
  cardFilter: string | null;
  sortKey: SortKey;
  page: number;
  navOpen: boolean;
  selectedId: string | null;
  detailTab: 'workflow' | 'documents';
  modalOpen: boolean;
  formError: string;
  syncing: boolean;
  cases: Case[];
  users: User[];
  workflow: WorkflowStep[];
  form: {
    bl: string;
    invoice: string;
    pkg: string;
    importer: string;
    supplier: string;
    vessel: string;
    container: string;
    arrival: string;
    invoiceValue: string;
    remarks: string;
  };
  settings: Settings;
  attView: 'admin' | 'me';
  attSettings: AttendanceSettings;
  attendance: AttendanceData;
  editId: string | null;
  editForm: Record<string, string | boolean>;
  editError: string;
  editImporterNew: boolean;
  importerNew: boolean;
  inviteOpen: boolean;
  inviteError: string;
  invite: { name: string; email: string; role: string; pass: string; pass2: string };
  builderDrag: number | null;
  builderOver: number | null;
  // Auth / API additions
  token: string | null;
  loading: boolean;
  currentUser: AuthUser | null;
  importers: Importer[];
}

type Action =
  | { type: 'SET'; payload: Partial<AppState> }
  | { type: 'UPDATE_CASE'; id: string; fn: (c: Case) => Case }
  | { type: 'PATCH_STEP'; id: string; stepId: string; patch: Partial<StepData> }
  | { type: 'ADD_CUSTOM_STEP'; caseId: string; step: CustomStep }
  | { type: 'PATCH_CUSTOM_STEP'; caseId: string; csId: string; patch: Partial<CustomStep> }
  | { type: 'REMOVE_CUSTOM_STEP'; caseId: string; csId: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET':
      return { ...state, ...action.payload };
    case 'UPDATE_CASE':
      return {
        ...state,
        cases: state.cases.map(c =>
          c.id === action.id
            ? { ...action.fn({ ...c, steps: { ...c.steps } }), lastUpdated: 'Today' }
            : c
        ),
      };
    case 'PATCH_STEP': {
      return {
        ...state,
        cases: state.cases.map(c => {
          if (c.id !== action.id) return c;
          const existing = c.steps[action.stepId] || {};
          const cur: StepData = {
            notes: existing.notes ?? '',
            files: existing.files ?? [],
            checks: existing.checks ?? {},
            fields: existing.fields ?? {},
          };
          return {
            ...c,
            lastUpdated: 'Today',
            steps: {
              ...c.steps,
              [action.stepId]: {
                ...cur,
                ...action.patch,
                checks: action.patch.checks
                  ? { ...cur.checks, ...action.patch.checks }
                  : cur.checks,
                fields: action.patch.fields
                  ? { ...cur.fields, ...action.patch.fields }
                  : cur.fields,
                files:
                  action.patch.files !== undefined ? action.patch.files : cur.files,
              },
            },
          };
        }),
      };
    }
    case 'ADD_CUSTOM_STEP':
      return {
        ...state,
        cases: state.cases.map(c =>
          c.id === action.caseId
            ? { ...c, customSteps: [...(c.customSteps || []), action.step] }
            : c
        ),
      };
    case 'PATCH_CUSTOM_STEP':
      return {
        ...state,
        cases: state.cases.map(c =>
          c.id === action.caseId
            ? {
                ...c,
                customSteps: (c.customSteps || []).map(cs =>
                  cs.id === action.csId ? { ...cs, ...action.patch } : cs
                ),
              }
            : c
        ),
      };
    case 'REMOVE_CUSTOM_STEP':
      return {
        ...state,
        cases: state.cases.map(c =>
          c.id === action.caseId
            ? { ...c, customSteps: (c.customSteps || []).filter(cs => cs.id !== action.csId) }
            : c
        ),
      };
    default:
      return state;
  }
}

const initialState: AppState = {
  view: 'dashboard',
  search: '',
  channelFilter: 'all',
  importerFilter: 'all',
  dayFilter: 'all',
  activeFilter: 'all',
  cardFilter: null,
  sortKey: 'newest',
  page: 1,
  navOpen: false,
  selectedId: null,
  detailTab: 'workflow',
  modalOpen: false,
  formError: '',
  syncing: false,
  cases: [],
  users: [],
  workflow: [],
  form: {
    bl: '',
    invoice: '',
    pkg: '',
    importer: '',
    supplier: '',
    vessel: '',
    container: '',
    arrival: '',
    invoiceValue: '',
    remarks: '',
  },
  settings: {
    name: '',
    email: '',
    role: '',
    company: '',
    license: '',
    address: '',
    emailAlerts: true,
    smsAlerts: false,
    weeklyReport: true,
    autoSync: true,
    compact: false,
  },
  attView: 'admin',
  attSettings: { entryTime: '09:00', graceMin: 15, endTime: '18:00', latitude: null, longitude: null, radiusMeters: 100, requireLocationCheckout: false },
  attendance: {},
  editId: null,
  editForm: {},
  editError: '',
  editImporterNew: false,
  importerNew: false,
  inviteOpen: false,
  inviteError: '',
  invite: { name: '', email: '', role: 'C&F Agent', pass: '', pass2: '' },
  builderDrag: null,
  builderOver: null,
  token: null,
  loading: false,
  currentUser: null,
  importers: [],
};

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  set: (payload: Partial<AppState>) => void;
  navigate: (view: ViewType, extra?: Partial<AppState>) => void;
  completeStep: (caseId: string, idx: number) => Promise<void>;
  reopenStep: (caseId: string, idx: number) => Promise<void>;
  saveCase: () => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  saveInvite: () => Promise<void>;
  saveEdit: () => Promise<void>;
  saveWorkflow: () => Promise<void>;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType>(null!);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Keep a ref to current state to avoid stale closures in callbacks
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const set = useCallback(
    (payload: Partial<AppState>) => dispatch({ type: 'SET', payload }),
    []
  );

  const navigate = useCallback((view: ViewType, extra?: Partial<AppState>) => {
    dispatch({ type: 'SET', payload: { view, navOpen: false, ...extra } });
  }, []);

  // -------------------------------------------------------------------------
  // loadData
  // -------------------------------------------------------------------------

  const loadData = useCallback(async (token: string) => {
    set({ loading: true });

    const [wfRes, casesRes, usersRes, importersRes, settingsRes, attSettingsRes, meRes] =
      await Promise.all([
        api.get<any[]>('/workflow/steps'),
        api.get<any>('/cases?limit=1000&page=1'),
        api.get<any[]>('/users'),
        api.get<any[]>('/importers'),
        api.get<any>('/settings'),
        api.get<any>('/settings/attendance'),
        api.get<any>('/attendance/today'),
      ]);

    const workflow = (wfRes.data || []).map(mapWorkflowStep);
    const cases = ((casesRes.data as any)?.items || []).map(mapCase);

    const currentUser = parseJwt(token);

    const users = (usersRes.data || []).map((u: any) =>
      mapUser(u, currentUser?.sub || '')
    );
    const importers: Importer[] = (importersRes.data || []).map((i: any) => ({
      id: i.id,
      name: i.name,
    }));

    const rawSettings = settingsRes.data;
    const rawAttSettings = attSettingsRes.data;

    const meUser = users.find((u: User) => u.id === currentUser?.sub);

    const settings: Settings = {
      name: meUser?.name || currentUser?.email || '',
      email: meUser?.email || currentUser?.email || '',
      role: meUser?.role || (currentUser as any)?.role || '',
      company: rawSettings?.company || '',
      license: rawSettings?.license || '',
      address: rawSettings?.address || '',
      emailAlerts: rawSettings?.emailAlerts ?? true,
      smsAlerts: rawSettings?.smsAlerts ?? false,
      weeklyReport: rawSettings?.weeklyReport ?? true,
      autoSync: rawSettings?.autoSync ?? true,
      compact: rawSettings?.compact ?? false,
    };

    const attSettings: AttendanceSettings = {
      entryTime: rawAttSettings?.entryTime || '09:00',
      graceMin: rawAttSettings?.graceMin ?? 15,
      endTime: rawAttSettings?.endTime || '18:00',
      latitude: rawAttSettings?.latitude ?? null,
      longitude: rawAttSettings?.longitude ?? null,
      radiusMeters: rawAttSettings?.radiusMeters ?? 100,
      requireLocationCheckout: rawAttSettings?.requireLocationCheckout ?? false,
    };

    const todayRecord = meRes.data;
    const today = new Date().toISOString().split('T')[0];
    const attendance: AttendanceData = {};
    if (todayRecord && currentUser?.sub) {
      attendance[currentUser.sub] = {
        [today]: {
          in: todayRecord.checkIn || '',
          out: todayRecord.checkOut || '',
        },
      };
    }

    set({
      loading: false,
      workflow,
      cases,
      users,
      importers,
      settings,
      attSettings,
      attendance,
      currentUser: currentUser
        ? {
            id: currentUser.sub,
            name: meUser?.name || '',
            email: meUser?.email || '',
            role: meUser?.role || '',
          }
        : null,
    });
  }, [set]);

  // -------------------------------------------------------------------------
  // On mount: if token exists load data
  // -------------------------------------------------------------------------

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const parsed = parseJwt(token);
      set({
        token,
        currentUser: parsed
          ? { id: parsed.sub, name: '', email: parsed.email, role: parsed.role }
          : null,
      });
      loadData(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Auth actions
  // -------------------------------------------------------------------------

  const login = useCallback(
    async (token: string, user: AuthUser) => {
      set({ token, currentUser: user });
      await loadData(token);
    },
    [set, loadData]
  );

  const logout = useCallback(() => {
    clearToken();
    set({
      token: null,
      currentUser: null,
      cases: [],
      users: [],
      workflow: [],
      view: 'login' as ViewType,
    });
  }, [set]);

  // -------------------------------------------------------------------------
  // Case actions
  // -------------------------------------------------------------------------

  const completeStep = useCallback(async (caseId: string, idx: number) => {
    const c = stateRef.current.cases.find(x => x.id === caseId);
    if (!c) return;
    const def = stateRef.current.workflow[idx];
    if (!def || idx !== c.currentStep) return;

    const sd = c.steps[def.id] || { notes: '', files: [], checks: {}, fields: {} };

    const res = await api.post(`/cases/${caseId}/steps/${def.id}/complete`, {
      notes: sd.notes || null,
      checks: sd.checks,
      fields: sd.fields,
      completedDate: new Date().toISOString().split('T')[0],
    });
    if (res.error) {
      console.error(res.error);
      return;
    }

    const caseRes = await api.get<any>(`/cases/${caseId}`);
    if (caseRes.data) {
      const mapped = mapCase(caseRes.data);
      dispatch({ type: 'UPDATE_CASE', id: caseId, fn: () => mapped });
    }
  }, []);

  const reopenStep = useCallback(async (caseId: string, idx: number) => {
    const c = stateRef.current.cases.find(x => x.id === caseId);
    if (!c) return;
    const def = stateRef.current.workflow[idx];
    if (!def) return;

    const res = await api.post(`/cases/${caseId}/steps/${def.id}/reopen`);
    if (res.error) {
      console.error(res.error);
      return;
    }

    const caseRes = await api.get<any>(`/cases/${caseId}`);
    if (caseRes.data) {
      const mapped = mapCase(caseRes.data);
      dispatch({ type: 'UPDATE_CASE', id: caseId, fn: () => mapped });
    }
  }, []);

  const saveCase = useCallback(async () => {
    const f = stateRef.current.form;
    const bl = f.bl.trim();
    if (!bl) {
      set({ formError: 'BL Number is required.' });
      return;
    }

    let importer = stateRef.current.importers.find(
      i => i.name === f.importer.trim()
    );

    // If new importer typed, create it first
    if (!importer && stateRef.current.importerNew && f.importer.trim()) {
      const impRes = await api.post<any>('/importers', { name: f.importer.trim() });
      if (impRes.error) {
        set({ formError: impRes.error });
        return;
      }
      importer = { id: impRes.data.id, name: impRes.data.name };
      set({ importers: [...stateRef.current.importers, importer] });
    }

    const res = await api.post<any>('/cases', {
      bl,
      lc: f.invoice.trim() || undefined,
      invoice: f.invoice.trim() || undefined,
      pkg: f.pkg.trim() || undefined,
      importerId: importer?.id || undefined,
      supplier: f.supplier || undefined,
      vessel: f.vessel || undefined,
      container: f.container || undefined,
      arrival: f.arrival || undefined,
      invoiceValue: f.invoiceValue || undefined,
      remarks: f.remarks || undefined,
    });

    if (res.error) {
      set({ formError: res.error });
      return;
    }

    const casesRes = await api.get<any>('/cases?limit=1000&page=1');
    const cases = ((casesRes.data as any)?.items || []).map(mapCase);

    set({
      cases,
      modalOpen: false,
      view: 'cases' as ViewType,
      page: 1,
      formError: '',
      importerNew: false,
      sortKey: 'newest',
      form: {
        bl: '',
        invoice: '',
        pkg: '',
        importer: '',
        supplier: '',
        vessel: '',
        container: '',
        arrival: '',
        invoiceValue: '',
        remarks: '',
      },
    });
  }, [set]);

  const deleteCase = useCallback(async (id: string) => {
    const res = await api.delete(`/cases/${id}`);
    if (res.error) {
      console.error(res.error);
      return;
    }

    set({
      cases: stateRef.current.cases.filter(c => c.id !== id),
      ...(stateRef.current.selectedId === id
        ? { view: 'cases' as ViewType, selectedId: null }
        : {}),
    });
  }, [set]);

  const saveInvite = useCallback(async () => {
    const v = stateRef.current.invite;
    const name = v.name.trim(),
      email = v.email.trim();
    if (!name) {
      set({ inviteError: 'Full name is required.' });
      return;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      set({ inviteError: 'A valid email is required.' });
      return;
    }
    if (!v.pass || v.pass.length < 6) {
      set({ inviteError: 'Password must be at least 6 characters.' });
      return;
    }
    if (v.pass !== v.pass2) {
      set({ inviteError: 'Passwords do not match.' });
      return;
    }

    const res = await api.post('/auth/register', {
      name,
      email,
      password: v.pass,
      role: v.role,
    });
    if (res.error) {
      set({ inviteError: res.error });
      return;
    }

    const usersRes = await api.get<any[]>('/users');
    const currentUser = stateRef.current.currentUser;
    const users = (usersRes.data || []).map((u: any) =>
      mapUser(u, currentUser?.id || '')
    );

    set({
      users,
      inviteOpen: false,
      inviteError: '',
      invite: { name: '', email: '', role: 'C&F Agent', pass: '', pass2: '' },
    });
  }, [set]);

  const saveEdit = useCallback(async () => {
    const f = stateRef.current.editForm;
    const bl = (f.bl as string || '').trim();
    if (!bl) {
      set({ editError: 'BL Number is required.' });
      return;
    }

    const id = stateRef.current.editId;
    if (!id) return;

    const importerName = (f.importer as string || '').trim();
    let importer = stateRef.current.importers.find(i => i.name === importerName);

    if (!importer && stateRef.current.editImporterNew && importerName) {
      const impRes = await api.post<any>('/importers', { name: importerName });
      if (impRes.error) {
        set({ editError: impRes.error });
        return;
      }
      importer = { id: impRes.data.id, name: impRes.data.name };
      set({ importers: [...stateRef.current.importers, importer] });
    }

    const res = await api.patch(`/cases/${id}`, {
      serial: (f.serial as string || '').trim() || undefined,
      cNumber: (f.cNumber as string || '').trim() || undefined,
      cDate: (f.cDate as string || '').trim() || undefined,
      bl,
      lc: (f.lc as string || '').trim() || undefined,
      importerId: importer?.id || undefined,
      channel: (f.zone as string) || undefined,
      received: (f.received as string || '').trim() || undefined,
      pallet: (f.pallet as string || '').trim() || undefined,
      exam: !!f.exam,
      assess: !!f.assess,
      delivery: !!f.delivery,
    });

    if (res.error) {
      set({ editError: res.error });
      return;
    }

    const casesRes = await api.get<any>('/cases?limit=1000&page=1');
    const cases = ((casesRes.data as any)?.items || []).map(mapCase);
    set({ cases, editId: null, editError: '' });
  }, [set]);

  const saveWorkflow = useCallback(async () => {
    const wf = stateRef.current.workflow;
    // Patch each step
    for (let i = 0; i < wf.length; i++) {
      const s = wf[i];
      await api.patch(`/workflow/steps/${s.id}`, {
        title: s.title,
        phase: s.phase,
        statusLabel: s.status,
        channels: s.channels ?? null,
        uploads: s.uploads ?? null,
        checks: s.checks ?? null,
        fields: s.fields ?? null,
        hasRemarks: s.hasRemarks ?? false,
        dropdown: s.dropdown ?? false,
        special: s.special ?? null,
        note: s.note ?? null,
        buttonLabel: s.button ?? null,
        sortOrder: i + 1,
      });
    }
    // Reorder
    await api.post('/workflow/steps/reorder', { ids: wf.map(s => s.id) });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      set,
      navigate,
      completeStep,
      reopenStep,
      saveCase,
      deleteCase,
      saveInvite,
      saveEdit,
      saveWorkflow,
      login,
      logout,
    }),
    [
      state,
      set,
      navigate,
      completeStep,
      reopenStep,
      saveCase,
      deleteCase,
      saveInvite,
      saveEdit,
      login,
      logout,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

// Re-export helpers used by other modules
export { applies, nextApplicable };
