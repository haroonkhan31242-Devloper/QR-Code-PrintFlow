import { useAuth } from '../../lib/auth';
import { useDocumentTitle } from '../../lib/router';
import { Card, CardHeader, PageHeader } from '../../components/ui';
import { ChangePasswordForm } from './ChangePasswordForm';

export function AccountPage() {
  useDocumentTitle('Account');
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Account" description="Your sign-in details." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
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
        <Card>
          <CardHeader title="Change password" description="Changing your password signs you out on other devices." />
          <div className="p-5 sm:p-6">
            <ChangePasswordForm />
          </div>
        </Card>
      </div>
    </>
  );
}
