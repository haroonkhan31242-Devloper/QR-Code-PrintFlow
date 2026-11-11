import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, Store } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { ApiError } from '../../lib/api';
import { Link, navigate, useDocumentTitle, useLocation } from '../../lib/router';
import { Alert, Button, Field, Input, Logo, PasswordInput, Spinner } from '../../components/ui';

export function LoginPage({ portal }: { portal: 'admin' | 'shop' }) {
  const isAdmin = portal === 'admin';
  useDocumentTitle(isAdmin ? 'Super Admin sign in' : 'Shop sign in');
  const { user, loading, login } = useAuth();
  const { query } = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [wrongPortal, setWrongPortal] = useState<'admin' | 'shop' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const home = isAdmin ? '/admin' : '/shop';
  const next = query.get('next');
  const target = next && next.startsWith(home) && !next.startsWith('//') ? next : home;

  useEffect(() => {
    if (!loading && user && user.role === (isAdmin ? 'super_admin' : 'shop_owner')) navigate(target, { replace: true });
  }, [loading, user, isAdmin, target]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWrongPortal(null);
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(portal, username.trim(), password);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed. Please try again.');
      if (err instanceof ApiError && err.code === 'USE_ADMIN_LOGIN') setWrongPortal('admin');
      else if (err instanceof ApiError && err.code === 'USE_SHOP_LOGIN') setWrongPortal('shop');
      else setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col bg-surface px-6 py-8 sm:px-12">
        <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Back to home
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <Logo />
          <div className="mt-10 inline-flex w-fit items-center gap-2 rounded-full border border-gold/70 bg-gold-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-ink">
            {isAdmin ? <ShieldCheck className="size-3.5" aria-hidden /> : <Store className="size-3.5" aria-hidden />}
            {isAdmin ? 'Super Admin' : 'Shop owner'}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">Sign in</h1>
          <p className="mt-2 text-[15px] text-muted">
            {isAdmin
              ? 'Manage print shops and their owner accounts.'
              : 'Use the username and password given to you by the platform administrator.'}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            {error && (
              <Alert tone="danger">
                {error}
                {wrongPortal && (
                  <>
                    {' '}
                    <Link to={wrongPortal === 'admin' ? '/admin/login' : '/shop/login'} className="font-semibold text-ink underline underline-offset-4">
                      Go to {wrongPortal === 'admin' ? 'Super Admin' : 'Shop'} sign-in
                    </Link>
                  </>
                )}
              </Alert>
            )}
            <Field label="Username">
              {(p) => (
                <Input
                  {...p}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              )}
            </Field>
            <Field label="Password">
              {(p) => <PasswordInput {...p} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-sm text-muted">
            {isAdmin ? (
              <>
                Running a print shop? <Link to="/shop/login" className="font-semibold text-gold-ink underline-offset-4 hover:underline">Shop sign in</Link>
              </>
            ) : (
              <>Forgot your password? Ask the platform administrator to reset it for you.</>
            )}
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-cream-deep lg:block">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-gold/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 left-10 size-96 rounded-full bg-orange/30 blur-3xl" aria-hidden />
        <div className="relative flex h-full flex-col justify-center px-16">
          <p className="max-w-md text-[34px] font-extrabold leading-tight tracking-tight text-ink" style={{ textWrap: 'balance' }}>
            {isAdmin ? 'Every shop, every account, one calm place.' : 'Your print queue, straight from your customers’ phones.'}
          </p>
          <ul className="mt-8 max-w-md space-y-3 text-[15px] text-ink-soft">
            {(isAdmin
              ? ['Create shops and issue owner logins', 'Activate, deactivate or reset access instantly', 'See activity across the platform']
              : ['Customers scan your QR code and upload files', 'Download, print and update order status', 'Set your own prices per paper size and colour']
            ).map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold-ink" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
