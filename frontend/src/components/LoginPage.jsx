import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  Headphones, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { loginApi } from '../api';

export default function LoginPage({ onLoginSuccess, navigateTo }) {
  const [activeTab, setActiveTab] = useState('STAFF'); // 'STAFF' or 'ADMIN'
  const [username, setUsername] = useState('staff_sarah');
  const [password, setPassword] = useState('staff123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTabChange = (role) => {
    setActiveTab(role);
    setError(null);
    if (role === 'STAFF') {
      setUsername('staff_sarah');
      setPassword('staff123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginApi(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        navigateTo('admin');
      } else {
        navigateTo('staff');
      }
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your username and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Role-Based Enterprise Authentication</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            SmartQueue Portal Login
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in to access your designated operational workspace
          </p>
        </div>

        {/* Tabbed Login Card */}
        <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Top role tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-700/60 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('STAFF')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'STAFF'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Staff Operator</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('ADMIN')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Administrator</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Quick Demo Pre-fill Pill */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Demo Credential: <strong className="text-indigo-400 font-mono">{activeTab === 'STAFF' ? 'staff_sarah' : 'admin'}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleTabChange(activeTab)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Auto-Fill
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as {activeTab === 'STAFF' ? 'Staff Operator' : 'System Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access to Guest Portals */}
          <div className="mt-6 pt-4 border-t border-slate-700/80 text-center space-y-2">
            <p className="text-xs text-slate-400">Are you a visitor or student?</p>
            <div className="flex items-center justify-center space-x-4 text-xs font-semibold">
              <button
                onClick={() => navigateTo('kiosk')}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Self-Check-in Kiosk →
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => navigateTo('board')}
                className="text-emerald-400 hover:text-emerald-300"
              >
                Lobby Display Board →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
