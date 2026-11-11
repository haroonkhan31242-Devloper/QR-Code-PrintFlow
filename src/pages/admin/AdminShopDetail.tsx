import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, KeyRound, Power, Trash2 } from 'lucide-react';
import type { ActivityEntry, ShopWithStats } from '../../../shared/types';
import { api, ApiError } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { Link, navigate, useDocumentTitle } from '../../lib/router';
import { formatDate, formatDateTime, timeAgo } from '../../lib/format';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, ErrorState, Field, Input, PageHeader, Skeleton } from '../../components/ui';
import { ConfirmModal, CredentialsModal } from '../../components/shared';
import { useToast } from '../../components/toast';
import { ShopFields, validateShopForm, type ShopFormValues } from './ShopForm';

export function AdminShopDetail({ id }: { id: string }) {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi<{ shop: ShopWithStats }>(`/api/admin/shops/${encodeURIComponent(id)}`);
  const activity = useApi<{ entries: ActivityEntry[] }>(`/api/admin/activity?shopId=${encodeURIComponent(id)}`);
  const shop = data?.shop;
  useDocumentTitle(shop?.name ?? 'Shop');

  const [values, setValues] = useState<ShopFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<null | 'status' | 'reset' | 'delete'>(null);
  const [busy, setBusy] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [creds, setCreds] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    if (shop) {
      setValues({
        name: shop.name,
        ownerName: shop.ownerName,
        phone: shop.phone,
        email: shop.email,
        address: shop.address,
        city: shop.city,
        operatingHours: shop.operatingHours,
      });
    }
  }, [shop?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error)
    return (
      <Card>
        {error.status === 404 ? (
          <EmptyState title="Shop not found" description="It may have been deleted." action={<Link to="/admin/shops" className="text-sm font-semibold text-gold-ink hover:underline">Back to shops</Link>} />
        ) : (
          <ErrorState message={error.message} onRetry={() => reload()} />
        )}
      </Card>
    );
  if (loading || !shop || !values) return <Skeleton className="h-96" />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateShopForm(values, { requireOwner: true });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/shops/${shop.id}`, values);
      await reload(true);
      activity.reload(true);
      toast('success', 'Shop details saved');
    } catch (err) {
      if (err instanceof ApiError && err.field) setErrors({ [err.field]: err.message });
      else toast('error', 'Could not save', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast('error', 'Action failed', err instanceof ApiError ? err.message : undefined);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const active = shop.status === 'active';
  const customerUrl = `${window.location.origin}/s/${shop.qrToken}`;

  return (
    <>
      <Link to="/admin/shops" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All shops
      </Link>
      <PageHeader
        title={shop.name}
        description={`Added ${formatDate(shop.createdAt)} · ${shop.orderCount} orders`}
        actions={active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
      />

      {!active && (
        <div className="mb-6">
          <Alert tone="warning" title="This shop is deactivated">
            The owner cannot sign in and customers cannot upload files. Existing orders are kept.
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Shop details" description="Shown to customers on the upload page." />
          <form onSubmit={save} noValidate className="space-y-6 p-5 sm:p-6">
            <ShopFields values={values} onChange={setValues} errors={errors} />
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Owner account" />
            <div className="space-y-4 p-5 sm:p-6">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Username</dt>
                  <dd className="font-mono font-semibold text-ink">{shop.ownerUsername ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Last sign-in</dt>
                  <dd className="text-ink" title={formatDateTime(shop.ownerLastLoginAt)}>{timeAgo(shop.ownerLastLoginAt)}</dd>
                </div>
              </dl>
              <Button variant="secondary" className="w-full" icon={<KeyRound className="size-4" />} onClick={() => setConfirm('reset')}>
                Reset password
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Customer link" />
            <div className="space-y-3 p-5 sm:p-6">
              <p className="break-all rounded-lg bg-cream px-3 py-2 font-mono text-xs text-ink-soft">{customerUrl}</p>
              <a href={customerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-ink hover:underline">
                Open upload page <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </Card>

          <Card>
            <CardHeader title="Access" />
            <div className="space-y-3 p-5 sm:p-6">
              <Button variant={active ? 'secondary' : 'primary'} className="w-full" icon={<Power className="size-4" />} onClick={() => setConfirm('status')}>
                {active ? 'Deactivate shop' : 'Activate shop'}
              </Button>
              <Button variant="ghost" className="w-full text-danger hover:bg-danger-soft hover:text-danger" icon={<Trash2 className="size-4" />} onClick={() => setConfirm('delete')}>
                Delete shop
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent activity" />
        {activity.loading ? (
          <Skeleton className="m-6 h-24" />
        ) : !activity.data?.entries.length ? (
          <p className="px-6 py-8 text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {activity.data.entries.slice(0, 15).map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 text-sm sm:px-6">
                <span>
                  <span className="font-semibold text-ink">{a.action}</span>
                  {a.details && <span className="text-muted"> · {a.details}</span>}
                </span>
                <span className="text-xs text-muted">
                  {a.actor} · {formatDateTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmModal
        open={confirm === 'status'}
        onClose={() => setConfirm(null)}
        loading={busy}
        title={active ? 'Deactivate this shop?' : 'Activate this shop?'}
        description={
          active
            ? 'The owner will be signed out immediately and customers will not be able to upload files. You can activate it again later.'
            : 'The owner can sign in again and customers can upload files.'
        }
        confirmLabel={active ? 'Deactivate' : 'Activate'}
        danger={active}
        onConfirm={() =>
          run(async () => {
            const r = await api.patch<{ shop: ShopWithStats }>(`/api/admin/shops/${shop.id}/status`, { status: active ? 'inactive' : 'active' });
            setData({ shop: { ...shop, ...r.shop } });
            activity.reload(true);
            toast('success', active ? 'Shop deactivated' : 'Shop activated');
          })
        }
      />

      <ConfirmModal
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        loading={busy}
        title="Reset the owner’s password?"
        description="A new temporary password is generated. The owner is signed out everywhere and must choose a new password at next sign-in."
        confirmLabel="Reset password"
        onConfirm={() =>
          run(async () => {
            const r = await api.post<{ credentials: { username: string; temporaryPassword: string } }>(`/api/admin/shops/${shop.id}/reset-password`);
            setCreds({ username: r.credentials.username, password: r.credentials.temporaryPassword });
            activity.reload(true);
          })
        }
      />

      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => {
          setConfirm(null);
          setDeleteName('');
        }}
        loading={busy}
        danger
        title="Delete this shop permanently?"
        description="This deletes the shop, its owner account, all its orders and every uploaded file. This cannot be undone."
        confirmLabel="Delete forever"
        confirmDisabled={deleteName !== shop.name}
        onConfirm={() =>
          run(async () => {
            await api.del(`/api/admin/shops/${shop.id}`, { confirmName: deleteName });
            toast('success', 'Shop deleted', shop.name);
            navigate('/admin/shops', { replace: true });
          })
        }
      >
        <Field label={`Type “${shop.name}” to confirm`}>
          {(p) => <Input {...p} value={deleteName} onChange={(e) => setDeleteName(e.target.value)} autoComplete="off" />}
        </Field>
      </ConfirmModal>

      {creds && (
        <CredentialsModal open onClose={() => setCreds(null)} title="New temporary password" username={creds.username} password={creds.password} />
      )}
    </>
  );
}
