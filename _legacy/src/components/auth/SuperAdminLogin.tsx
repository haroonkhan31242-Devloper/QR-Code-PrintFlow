import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage, DEMO_USERS } from '../../services/storage';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export const SuperAdminLogin: React.FC = () => {
  const { switchUser, setActiveView, addToast } = useApp();

  const [identifier, setIdentifier] = useState('superadmin@printflow.io');
  const [password, setPassword] = useState('super123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your Super Admin email/username and password.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const cleanId = identifier.trim().toLowerCase();
      const users = storage.getUsers();
      const superUser = users.find(
        (u) =>
          u.role === 'super_admin' &&
          ((u.email && u.email.toLowerCase() === cleanId) ||
            (u.username && u.username.toLowerCase() === cleanId))
      );

      if (!superUser || superUser.password !== password.trim()) {
        setErrorMessage('Invalid administrative credentials. Access is restricted to Platform Super Administrators.');
        return;
      }

      switchUser(superUser);
      addToast('success', 'Super Admin Authentication Successful', 'Welcome to the platform control engine.');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div
          onClick={() => setActiveView('home')}
          className="flex items-center gap-2 cursor-pointer font-extrabold text-base tracking-tight text-white"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span>
            PrintFlow <span className="text-indigo-400 font-semibold text-xs ml-1 px-1.5 py-0.5 rounded-sm bg-indigo-950 border border-indigo-800">Super Admin</span>
          </span>
        </div>

        <button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Portal</span>
        </button>
      </header>

      {/* Main Authentication Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/80 mb-3 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Platform Super Administration
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter your platform master credentials to access multi-tenant infrastructure.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Super Admin Email / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="superadmin@printflow.io"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Access Rights...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Central Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Autofill */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-2">
                Demonstration Credentials:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('superadmin@printflow.io');
                  setPassword('super123');
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                <span>superadmin@printflow.io</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-indigo-400">super123</span>
              </button>
            </div>
          </div>

          {/* Separation Note */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Are you a Printing Shop Owner?</span>
            <button
              onClick={() => setActiveView('shop_login')}
              className="font-semibold text-indigo-400 hover:underline"
            >
              Shop Owner Login &rarr;
            </button>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        PrintFlow Multi-Tenant Printing Platform &bull; Super Admin Console
      </footer>
    </div>
  );
};
