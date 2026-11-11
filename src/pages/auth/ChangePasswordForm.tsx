import React, { useState } from 'react';
import { authService, ServiceError } from '../../services';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/toast';
import { Alert, Button, Field, PasswordInput } from '../../components/ui';

export function ChangePasswordForm({ submitLabel = 'Update password', onDone }: { submitLabel?: string; onDone?: () => void }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!current) errs.currentPassword = 'Enter your current password.';
    if (next.length < 8) errs.newPassword = 'Use at least 8 characters.';
    else if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) errs.newPassword = 'Use both letters and numbers.';
    if (confirm !== next) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      setUser(await authService.changePassword(current, next));
      setCurrent('');
      setNext('');
      setConfirm('');
      toast('success', 'Password updated', 'Other devices have been signed out.');
      onDone?.();
    } catch (err) {
      if (err instanceof ServiceError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof ServiceError ? err.message : 'Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <Field label="Current password" error={errors.currentPassword}>
        {(p) => <PasswordInput {...p} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}
      </Field>
      <Field label="New password" hint="At least 8 characters, with letters and numbers." error={errors.newPassword}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
      </Field>
      <Field label="Confirm new password" error={errors.confirm}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
      </Field>
      <Button type="submit" loading={saving}>
        {submitLabel}
      </Button>
    </form>
  );
}
