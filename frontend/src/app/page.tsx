'use client';

import { AppProvider, useApp } from '@/lib/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { CasesPage } from '@/components/cases/CasesPage';
import { CaseDetail } from '@/components/cases/CaseDetail';
import ReportsPage from '@/components/reports/ReportsPage';
import { AttendancePage } from '@/components/attendance/AttendancePage';
import SettingsPage from '@/components/settings/SettingsPage';
import BuilderPage from '@/components/builder/BuilderPage';
import { NewCaseModal } from '@/components/cases/NewCaseModal';
import { EditCaseModal } from '@/components/cases/EditCaseModal';
import { LoginPage } from '@/components/auth/LoginPage';

function AppContent() {
  const { state, login } = useApp();

  if (!state.token) {
    return <LoginPage onLogin={login} />;
  }

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#eef1f5] flex items-center justify-center">
        <div className="text-[#7b8794] text-[14px]">Loading\u2026</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#eef1f5] text-[#16222e] text-sm">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-7 overflow-auto">
          {state.view === 'dashboard' && <DashboardPage />}
          {state.view === 'cases' && <CasesPage />}
          {state.view === 'detail' && <CaseDetail />}
          {state.view === 'reports' && <ReportsPage />}
          {state.view === 'attendance' && <AttendancePage />}
          {state.view === 'settings' && <SettingsPage />}
          {state.view === 'builder' && <BuilderPage />}
        </main>
      </div>
      <NewCaseModal />
      <EditCaseModal />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
