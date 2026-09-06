import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Boxes, ShieldCheck, UserCheck, Loader2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('manager@inventory.com');
  const [password, setPassword] = useState<string>('Manager@123');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: 'manager' | 'staff' | 'staff2') => {
    if (role === 'manager') {
      setEmail('manager@inventory.com');
      setPassword('Manager@123');
    } else if (role === 'staff') {
      setEmail('staff@inventory.com');
      setPassword('Staff@123');
    } else {
      setEmail('staff2@inventory.com');
      setPassword('Staff@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            BUSY Stock Control System
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Append-Only Inventory & Stock Ledger Engine
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="user@inventory.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-sky-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In to System</span>
            )}
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
            Quick 1-Click Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDemoCredentials('manager')}
              className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 hover:bg-amber-900/40 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Manager Role</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('staff')}
              className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/40 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Warehouse Staff</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
