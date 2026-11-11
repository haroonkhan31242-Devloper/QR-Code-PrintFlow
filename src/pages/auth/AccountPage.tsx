import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { navigate, useDocumentTitle } from '../../lib/router';
import { resetDemoData } from '../../services';
import { Button, Card, CardHeader, PageHeader } from '../../components/ui';
import { ConfirmModal } from '../../components/shared';
import { useToast } from '../../components/toast';
import { ChangePasswordForm } from './ChangePasswordForm';

export function AccountPage() {
  useDocumentTitle('Account');
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Account" description="Your sign-in details." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile" />
            <dl className="divide-y divide-line px-5 sm:px-6">
              <div className="flex justify-between gap-4 py-3.5 text-sm">
                <dt className="text-muted">Name</dt>
                <dd className="font-semibold text-ink">{user?.name}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3.5 text-sm">
                <dt className="text-muted">Username</dt>
                <dd className="font-semibold text-ink">{user?.username}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3.5 text-sm">
                <dt className="text-muted">Role</dt>
                <dd className="font-semibold text-ink">{user?.role === 'super_admin' ? 'Super Admin' : 'Shop owner'}</dd>
              </div>
            </dl>
          </Card>
          {user?.role === 'super_admin' && <DemoDataCard />}
        </div>
        <Card className="h-fit">
          <CardHeader title="Change password" description="Changing your password signs you out on other devices." />
          <div className="p-5 sm:p-6">
            <ChangePasswordForm />
          </div>
        </Card>
      </div>
    </>
  );
}

/** All data lives in this browser only (local demo). Lets the admin start again from the demo data. */
function DemoDataCard() {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <CardHeader title="Demo data" description="Shops, orders and files are stored only in this browser." />
      <div className="p-5 sm:p-6">
        <Button variant="secondary" icon={<RotateCcw className="size-4" />} onClick={() => setConfirm(true)}>
          Reset demo data
        </Button>
      </div>
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        danger
        loading={busy}
        title="Reset all demo data?"
        description="Every shop, order and uploaded file in this browser is deleted and the demo accounts are recreated. This cannot be undone. You will be signed out."
        confirmLabel="Reset everything"
        onConfirm={async () => {
          setBusy(true);
          try {
            await resetDemoData();
            toast('success', 'Demo data reset');
            navigate('/admin/login', { replace: true });
          } catch (err) {
            toast('error', 'Could not reset', err instanceof Error ? err.message : undefined);
          } finally {
            setBusy(false);
            setConfirm(false);
          }
        }}
      />
    </Card>
  );
}
