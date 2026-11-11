import { KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { navigate, useDocumentTitle } from '../../lib/router';
import { Button, Card, Logo } from '../../components/ui';
import { ChangePasswordForm } from './ChangePasswordForm';

/** Shown after signing in with a temporary password. Every other service call is blocked until it is changed. */
export function ForcePasswordChange() {
  useDocumentTitle('Set a new password');
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Logo />
      <Card className="mt-8 w-full max-w-md p-6 sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gold-soft text-gold-ink" aria-hidden>
          <KeyRound className="size-5" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">Set your own password</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Welcome, {user?.name}. You signed in with a temporary password. Choose a new one to continue.
        </p>
        <div className="mt-6">
          <ChangePasswordForm submitLabel="Save and continue" />
        </div>
      </Card>
      <Button
        variant="ghost"
        className="mt-4"
        icon={<LogOut className="size-4" />}
        onClick={async () => {
          const to = user?.role === 'super_admin' ? '/admin/login' : '/shop/login';
          await logout();
          navigate(to, { replace: true });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
