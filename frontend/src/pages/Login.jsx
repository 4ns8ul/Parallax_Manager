import React, { useState } from 'react';
import { useStitch } from '../context/StitchContext';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export default function Login() {
  const { login, error, loading } = useStitch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-950 relative overflow-hidden cyber-grid">
      {/* Visual Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md p-8 glass-panel relative z-10 mx-4">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-emerald-500 flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-xl shadow-violet-500/20">
            📊
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-wide">TEMS Gateway</h2>
          <p className="text-sm text-slate-400 mt-1">Task & Expense Management System</p>
        </div>

        {/* Validation Errors */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Tip */}
        <div className="mb-6 p-3 rounded-lg bg-slate-800/40 border border-slate-700 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Seed credentials for immediate test:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Admin: <code className="text-violet-400">admin@tems.com</code> / <code className="text-violet-400">Password123!</code></li>
            <li>Manager: <code className="text-violet-400">manager@tems.com</code> / <code className="text-violet-400">Password123!</code></li>
            <li>Employee: <code className="text-violet-400">employee@tems.com</code> / <code className="text-violet-400">Password123!</code></li>
          </ul>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 outline-none text-slate-200 placeholder-slate-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 outline-none text-slate-200 placeholder-slate-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-violet-600 to-emerald-500 text-white font-semibold text-sm hover:from-violet-500 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-violet-600/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Entering System Gateway...' : 'Authenticate Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
