'use client';

import { useApp } from '@/lib/store';
import { ROLE_COLORS } from '@/lib/constants';
import { getInitials } from '@/lib/data';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Modal } from '@/components/ui/Modal';

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { state, set, saveInvite } = useApp();
  const { settings, users, syncing, inviteOpen, inviteError, invite } = state;

  function handleSync() {
    set({ syncing: true });
    setTimeout(() => set({ syncing: false }), 1100);
  }

  function updateSettings(patch: Partial<typeof settings>) {
    set({ settings: { ...settings, ...patch } });
  }

  function updateInvite(patch: Partial<typeof invite>) {
    set({ invite: { ...invite, ...patch }, inviteError: '' });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1b2a3d]">Settings</h1>

      {/* ---- Profile ---- */}
      <Card>
        <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Full Name</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              value={settings.name}
              onChange={e => updateSettings({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Email</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              value={settings.email}
              onChange={e => updateSettings({ email: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Role</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] bg-[#f8f9fb] focus:outline-none"
              value={settings.role}
              readOnly
            />
          </div>
        </div>
      </Card>

      {/* ---- Company ---- */}
      <Card>
        <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Company</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Company Name</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              value={settings.company}
              onChange={e => updateSettings({ company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">C&F License No.</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              value={settings.license}
              onChange={e => updateSettings({ license: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Address</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              value={settings.address}
              onChange={e => updateSettings({ address: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* ---- Notifications (admin only) ---- */}
      {state.currentUser?.role === 'admin' && <Card>
        <h2 className="text-[15px] font-bold text-[#1b2a3d] mb-4">Notifications</h2>
        <div className="space-y-4">
          <Toggle
            on={settings.emailAlerts}
            onToggle={() => updateSettings({ emailAlerts: !settings.emailAlerts })}
            label="Email Alerts"
            desc="Receive email notifications for case updates and status changes"
          />
          <Toggle
            on={settings.smsAlerts}
            onToggle={() => updateSettings({ smsAlerts: !settings.smsAlerts })}
            label="SMS Alerts"
            desc="Receive SMS notifications for urgent actions and deadlines"
          />
          <Toggle
            on={settings.weeklyReport}
            onToggle={() => updateSettings({ weeklyReport: !settings.weeklyReport })}
            label="Weekly Report"
            desc="Get a weekly summary of clearance activity and performance"
          />
          <Toggle
            on={settings.autoSync}
            onToggle={() => updateSettings({ autoSync: !settings.autoSync })}
            label="Auto-sync with ASYCUDA"
            desc="Automatically sync case data with ASYCUDA World system"
          />
          <Toggle
            on={settings.compact}
            onToggle={() => updateSettings({ compact: !settings.compact })}
            label="Compact Table View"
            desc="Use a denser layout for the cases table"
          />
        </div>
        <div className="mt-5 pt-4 border-t border-[#e8ecf1]">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: '#0a6ed1' }}
          >
            {syncing ? 'Syncing\u2026' : 'Sync Now'}
          </button>
        </div>
      </Card>}

      {/* ---- Team Management (admin only) ---- */}
      {state.currentUser?.role === 'admin' && <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-[#1b2a3d]">
            Team Management <span className="text-[#7b8794] font-normal">({users.length})</span>
          </h2>
          {state.currentUser?.role === 'admin' && (
            <button
              onClick={() => set({ inviteOpen: true, inviteError: '', invite: { name: '', email: '', role: 'C&F Agent', pass: '', pass2: '' } })}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0a6ed1' }}
            >
              Invite Member
            </button>
          )}
        </div>

        <div className="space-y-3">
          {users.map(u => {
            const roleColor = ROLE_COLORS[u.role] || '#64748b';
            return (
              <div
                key={u.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-[#f8f9fb] hover:bg-[#eef1f5] transition-colors"
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: roleColor }}
                >
                  {getInitials(u.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1b2a3d] truncate">{u.name}</p>
                  <p className="text-xs text-[#7b8794] truncate">{u.email}</p>
                </div>

                {/* Role badge */}
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ color: roleColor, backgroundColor: roleColor + '18' }}
                >
                  {u.role}
                </span>

                {/* Status badge */}
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{
                    color: u.status === 'Active' ? '#15803d' : '#a16207',
                    backgroundColor: u.status === 'Active' ? '#e7f5ec' : '#fdf4e1',
                  }}
                >
                  {u.status}
                </span>

                {/* Remove button (not for self) */}
                {!u.self && (
                  <button
                    onClick={() => set({ users: users.filter(x => x.id !== u.id) })}
                    className="text-[#9aa6b4] hover:text-[#dc2626] text-sm cursor-pointer transition-colors flex-shrink-0"
                    title="Remove"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>}

      {/* ---- Invite Modal (admin only) ---- */}
      {state.currentUser?.role === 'admin' &&
      <Modal
        open={inviteOpen}
        onClose={() => set({ inviteOpen: false, inviteError: '' })}
        title="Invite Member"
      >
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Full Name</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              placeholder="John Doe"
              value={invite.name}
              onChange={e => updateInvite({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Email</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              placeholder="john@example.com"
              type="email"
              value={invite.email}
              onChange={e => updateInvite({ email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Role</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors bg-white"
              value={invite.role}
              onChange={e => updateInvite({ role: e.target.value })}
            >
              {['Admin', 'Documentation Officer', 'Examination Officer', 'Delivery Coordinator', 'C&F Agent', 'Viewer'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Password</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              type="password"
              placeholder="Min 6 characters"
              value={invite.pass}
              onChange={e => updateInvite({ pass: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5b6b7b] mb-1">Confirm Password</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-[#e0e4ea] text-sm text-[#16222e] focus:outline-none focus:border-[#0a6ed1] transition-colors"
              type="password"
              placeholder="Re-enter password"
              value={invite.pass2}
              onChange={e => updateInvite({ pass2: e.target.value })}
            />
          </div>

          {inviteError && (
            <p className="text-sm text-[#dc2626] bg-[#fdecec] px-3 py-2 rounded-lg">{inviteError}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e8ecf1]">
          <button
            onClick={() => set({ inviteOpen: false, inviteError: '' })}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-[#5b6b7b] hover:bg-[#f1f3f6] cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveInvite}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer transition-colors hover:opacity-90"
            style={{ backgroundColor: '#0a6ed1' }}
          >
            Save
          </button>
        </div>
      </Modal>}
    </div>
  );
}
