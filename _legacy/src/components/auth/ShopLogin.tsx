import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  Store,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const ShopLogin: React.FC = () => {
  const { loginShopOwner, setActiveView, setActiveRole, addToast } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Error & Status states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    'invalid_credentials' | 'shop_suspended' | 'account_suspended' | 'account_deactivated' | null
  >(null);
  const [suspendedDetails, setSuspendedDetails] = useState<{ id?: string; name?: string } | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [enteredToken, setEnteredToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset' | 'success'>('request');
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorType(null);
    setSuspendedDetails(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your administrator username or registered email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    // Simulate authenticating against the storage service
    setTimeout(() => {
      const result = storage.authenticateShopOwner(identifier, password);
      setLoading(false);

      if (result.success) {
        if (rememberMe) {
          try {
            localStorage.setItem('printflow_remember_shop_user', identifier);
          } catch {
            // ignore
          }
        }
        loginShopOwner(result.user, result.shop);
      } else {
        setErrorType(result.reason === 'not_found' ? 'invalid_credentials' : result.reason);
        setErrorMessage(result.message);
        if (result.shopId) {
          setSuspendedDetails({ id: result.shopId, name: result.shopName });
        }
      }
    }, 450);
  };

  const handleAutofill = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setErrorMessage(null);
    setErrorType(null);
    setSuspendedDetails(null);
  };

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your username or registered email.');
      return;
    }

    const res = storage.requestPasswordReset(forgotIdentifier);
    if (res.success && res.token) {
      setResetToken(res.token);
      setEnteredToken(res.token); // Autofill token in demonstration mode
      setForgotStep('reset');
    } else {
      setForgotError(res.message);
    }
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    const res = storage.resetPasswordWithToken(forgotIdentifier, enteredToken, newPassword);
    if (res.success) {
      setForgotStep('success');
      setPassword(newPassword);
      setIdentifier(forgotIdentifier);
      addToast('success', 'Password Reset Successful', 'You can now sign in with your new password.');
    } else {
      setForgotError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100">
      {/* Top Bar with Clear Navigation */}
      <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
        <div
          onClick={() => {
            setActiveRole('customer');
            setActiveView('customer_portal');
          }}
          className="flex items-center gap-2 cursor-pointer font-extrabold text-base tracking-tight text-slate-900 dark:text-white"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Store className="w-4 h-4" />
          </div>
          <span>PrintFlow <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs ml-1 px-1.5 py-0.5 rounded-sm bg-indigo-50 dark:bg-indigo-950">Shop Portal</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveRole('customer');
              setActiveView('customer_portal');
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Customer Portal</span>
          </button>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-100 dark:border-indigo-900">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Shop Owner Sign In
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Access your isolated printing orders, queues, pricing, and hardware telemetry.
              </p>
            </div>

            {/* Error / Suspension Alerts */}
            {errorMessage && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  errorType === 'shop_suspended' || errorType === 'account_suspended'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                    : errorType === 'account_deactivated'
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}
              >
                {errorType === 'shop_suspended' || errorType === 'account_suspended' ? (
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold mb-0.5">
                    {errorType === 'shop_suspended'
                      ? 'Shop Operations Suspended'
                      : errorType === 'account_suspended'
                      ? 'Administrator Account Suspended'
                      : errorType === 'account_deactivated'
                      ? 'Account Deactivated'
                      : 'Authentication Failed'}
                  </div>
                  <div>{errorMessage}</div>
                  {suspendedDetails && (
                    <div className="mt-2 text-[11px] p-2 bg-white/70 dark:bg-black/30 rounded border border-amber-300 dark:border-amber-800">
                      <strong>Shop:</strong> {suspendedDetails.name} ({suspendedDetails.id})<br />
                      <strong>Resolution:</strong> Settle outstanding subscription billing or contact Platform Super Admin.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shop Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. apexadmin or admin@apexprint.pk"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(identifier);
                      setForgotStep('request');
                      setForgotError(null);
                      setResetToken(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400 text-xs">Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Shop Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demonstration Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Demonstration Credentials
                </span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">Click to fill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleAutofill('apexadmin', 'apex123')}
                  className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Apex QuickPrint</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    User: <code className="text-indigo-600 dark:text-indigo-400">apexadmin</code> / <code className="text-slate-600 dark:text-slate-300">apex123</code>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutofill('metroadmin', 'metro123')}
                  className="p-2 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Metro Graphics</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    User: <code className="text-indigo-600 dark:text-indigo-400">metroadmin</code> / <code className="text-slate-600 dark:text-slate-300">metro123</code>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutofill('campusadmin', 'campus123')}
                  className="p-2 text-left rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                >
                  <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Varsity Xerox (Suspended)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Tests suspended shop guard
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutofill('deactivateduser', 'deact123')}
                  className="p-2 text-left rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <div className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>Deactivated Account</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Tests deactivated account guard
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Super Admin Separation Note */}
          <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Are you a Platform Super Administrator?</span>
            <button
              onClick={() => {
                setActiveRole('super_admin');
                setActiveView('dashboard');
              }}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Super Admin Portal →
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Account Password Recovery</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter your administrator username or registered email address. A demonstration recovery token will be generated.
                </p>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                  <strong>Notice:</strong> This is an interactive demonstration environment. Real external email SMTP delivery is not simulated with fake dispatches; instead, a valid one-time recovery token is issued on-screen.
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. apexadmin or admin@apexprint.pk"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    Generate Recovery Token
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="font-semibold mb-1">Demonstration Recovery Code Issued:</div>
                  <code className="text-sm font-mono font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-800 inline-block">
                    {resetToken}
                  </code>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                    Enter your new password below to reset access for <strong>{forgotIdentifier}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Recovery Code
                  </label>
                  <input
                    type="text"
                    value={enteredToken}
                    onChange={(e) => setEnteredToken(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  >
                    Set New Password & Return
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Password Updated Successfully</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your password has been changed. You may now sign in using your new credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-900">
        PrintFlow Multi-Shop Platform &bull; Pakistan Commercial Printing Network &bull; Secure Multi-Tenant Architecture
      </footer>
    </div>
  );
};
