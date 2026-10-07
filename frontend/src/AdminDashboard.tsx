import React, { useState, useEffect } from 'react';

interface DashboardStats {
  roomsToday: number;
  roomsThisMonth: number;
  roomsTotal: number;
  activeNow: number;
}

interface ComplianceReport {
  period: string;
  roomsCreated: number;
  statement: string;
}

type View = 'login-email' | 'login-code' | 'dashboard';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currentYear(): number {
  return new Date().getFullYear();
}

function currentMonth(): number {
  return new Date().getMonth() + 1;
}

export default function AdminDashboard() {
  const [view, setView] = useState<View>('login-email');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [compliance, setCompliance] = useState<ComplianceReport | null>(null);
  const [compYear, setCompYear] = useState(currentYear());
  const [compMonth, setCompMonth] = useState(currentMonth());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('Admin');

  // Load stats when dashboard is shown
  useEffect(() => {
    if (view === 'dashboard' && sessionToken) {
      loadStats();
      loadTenantName();
    }
  }, [view, sessionToken]);

  async function loadTenantName() {
    try {
      const res = await fetch('/api/tenant-config');
      if (res.ok) {
        const data = await res.json();
        if (data?.displayName) setDisplayName(data.displayName);
      }
    } catch {
      // ignore
    }
  }

  async function loadStats() {
    if (!sessionToken) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'X-Admin-Token': sessionToken },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setView('login-code');
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok && data.sessionToken) {
        setSessionToken(data.sessionToken);
        setView('dashboard');
      } else {
        setError(data.error || 'Invalid or expired code');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (!sessionToken) return;
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'X-Admin-Token': sessionToken },
      });
    } catch {
      // ignore
    }
    setSessionToken(null);
    setStats(null);
    setCompliance(null);
    setCode('');
    setView('login-email');
  }

  async function handleComplianceReport(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionToken) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/compliance-report?year=${compYear}&month=${compMonth}`,
        { headers: { 'X-Admin-Token': sessionToken } }
      );
      const data = await res.json();
      if (res.ok) {
        setCompliance(data);
      } else {
        setError(data.error || 'Failed to load report');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  // ---------- Login: email ----------
  if (view === 'login-email') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400 text-sm mb-6">Enter your admin email to receive a one-time code.</p>
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- Login: OTP code ----------
  if (view === 'login-code') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">Enter code</h1>
          <p className="text-gray-400 text-sm mb-6">
            Check your email at <span className="text-emerald-400">{email}</span> for the 6-digit code.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-widest text-center text-xl font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setView('login-email'); setError(''); setCode(''); }}
              className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- Dashboard ----------
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">Admin</span>
          <h1 className="text-xl font-bold text-white">{displayName}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
        >
          Logout
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Stats cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Room Activity</h2>
            <button
              onClick={loadStats}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Refresh
            </button>
          </div>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Rooms today" value={stats.roomsToday} />
              <StatCard label="This month" value={stats.roomsThisMonth} />
              <StatCard label="Total (90 days)" value={stats.roomsTotal} />
              <StatCard label="Active now" value={stats.activeNow} accent />
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Loading stats...</div>
          )}
        </section>

        {/* Compliance report */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Compliance Report</h2>
          <form onSubmit={handleComplianceReport} className="flex flex-wrap gap-3 mb-4">
            <select
              value={compYear}
              onChange={(e) => setCompYear(Number(e.target.value))}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={compMonth}
              onChange={(e) => setCompMonth(Number(e.target.value))}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Loading...' : 'Generate report'}
            </button>
          </form>

          {compliance && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-emerald-400">{compliance.period}</span>
                <span className="text-xs text-gray-400">{compliance.roomsCreated} rooms</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{compliance.statement}</p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className={`text-3xl font-bold mb-1 ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-gray-400 text-xs">{label}</div>
    </div>
  );
}
