'use client';

import { useState } from 'react';
import { api, setToken } from '@/lib/api';

interface Props {
  onLogin: (token: string, user: { id: string; name: string; email: string; role: string }) => void;
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api.post<{ accessToken: string; user: { id: string; name: string; email: string; role: string } }>(
      '/auth/login',
      { email, password },
    );
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error || 'Login failed');
      return;
    }
    setToken(res.data.accessToken);
    onLogin(res.data.accessToken, res.data.user);
  }

  return (
    <div className="min-h-screen bg-[#eef1f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8 text-center">
          <h1 className="text-[24px] font-bold text-[#16222e]">ClearPort</h1>
          <p className="text-[13px] text-[#7b8794] mt-1">Customs Clearance Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@clearport.com"
              required
              className="w-full h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none focus:border-[#0a6ed1] transition-colors"
            />
          </div>

          <div>
            <label className="text-[12.5px] font-semibold text-[#16222e] mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full h-10 px-3 rounded-lg border border-[#e8ecf1] text-[13.5px] text-[#16222e] bg-white outline-none focus:border-[#0a6ed1] transition-colors"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-[#fdecec] border border-[#f8c4c4] text-[#b91c1c] text-[12.5px] font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-[#0a6ed1] text-white text-[13.5px] font-semibold hover:bg-[#0860b6] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading ? 'Signing in\u2026' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
