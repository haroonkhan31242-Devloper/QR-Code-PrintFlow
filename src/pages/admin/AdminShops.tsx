import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Plus, Search, Store } from 'lucide-react';
import type { Shop, ShopWithStats } from '../../../shared/types';
import { api, ApiError } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { Link, navigate, useDocumentTitle, useLocation } from '../../lib/router';
import { timeAgo } from '../../lib/format';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, PasswordInput, Select, Skeleton } from '../../components/ui';
import { CredentialsModal } from '../../components/shared';
import { useToast } from '../../components/toast';
import { ShopFields, emptyShopForm, validateShopForm, type ShopFormValues } from './ShopForm';

export function AdminShops() {
  useDocumentTitle('Shops');
  const { query } = useLocation();
  const { data, error, loading, reload } = useApi<{ shops: ShopWithStats[] }>('/api/admin/shops');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [creating, setCreating] = useState(query.get('new') === '1');
  const [created, setCreated] = useState<{ shop: Shop; username: string; password: string } | null>(null);

  useEffect(() => {
    if (query.get('new') === '1') navigate('/admin/shops', { replace: true });
  }, [query]);

  const shops = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.shops ?? []).filter(
      (s) =>
        (status === 'all' || s.status === status) &&
        (!term || [s.name, s.ownerName, s.city, s.ownerUsername ?? '', s.phone].some((v) => v.toLowerCase().includes(term))),
    );
  }, [data, q, status]);

  return (
    <>
      <PageHeader
        title="Shops"
        description="Create print shops and manage their owner accounts."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Add a shop
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:px-6">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input aria-label="Search shops" placeholder="Search by shop, owner, city or username" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as any)} className="sm:w-44">
            <option value="all">All shops</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </Select>
        </div>

        {error ? (
          <ErrorState message={error.message} onRetry={() => reload()} />
        ) : loading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !data?.shops.length ? (
          <EmptyState
            icon={<Store className="size-6" />}
            title="No shops yet"
            description="Add your first print shop. You’ll get a username and temporary password to give to the owner."
            action={<Button onClick={() => setCreating(true)}>Add a shop</Button>}
          />
        ) : shops.length === 0 ? (
          <EmptyState icon={<Search className="size-6" />} title="No matching shops" description="Try a different search or filter." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-cream/70 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold">Shop</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Owner login</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Orders</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Last order</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shops.map((s) => (
                    <tr key={s.id} className="group cursor-pointer hover:bg-cream/60" onClick={() => navigate(`/admin/shops/${s.id}`)}>
                      <td className="px-6 py-4">
                        <Link to={`/admin/shops/${s.id}`} className="font-semibold text-ink hover:underline" onClick={(e) => e.stopPropagation()}>
                          {s.name}
                        </Link>
                        <p className="text-xs text-muted">{[s.ownerName, s.city].filter(Boolean).join(' · ')}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-ink-soft">{s.ownerUsername ?? '—'}</p>
                        <p className="text-xs text-muted">Signed in {timeAgo(s.ownerLastLoginAt)}</p>
                      </td>
                      <td className="tabular px-4 py-4 text-ink-soft">
                        {s.orderCount}
                        {s.pendingCount > 0 && <span className="ml-2"><Badge tone="orange">{s.pendingCount} new</Badge></span>}
                      </td>
                      <td className="px-4 py-4 text-muted">{timeAgo(s.lastOrderAt)}</td>
                      <td className="px-4 py-4">
                        {s.status === 'active' ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ChevronRight className="ml-auto size-4 text-muted group-hover:text-ink" aria-hidden />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {shops.map((s) => (
                <li key={s.id}>
                  <Link to={`/admin/shops/${s.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-cream/60">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-ink">{s.name}</p>
                        {s.status !== 'active' && <Badge tone="danger">Off</Badge>}
                      </div>
                      <p className="truncate text-sm text-muted">
                        @{s.ownerUsername} · {s.orderCount} orders
                      </p>
                    </div>
                    {s.pendingCount > 0 && <Badge tone="orange">{s.pendingCount}</Badge>}
                    <ChevronRight className="size-4 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <CreateShopModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(r) => {
          setCreating(false);
          setCreated(r);
          reload(true);
        }}
      />
      {created && (
        <CredentialsModal
          open
          onClose={() => setCreated(null)}
          title={`${created.shop.name} is ready`}
          username={created.username}
          password={created.password}
          shopUrl={`${window.location.origin}/s/${created.shop.qrToken}`}
        />
      )}
    </>
  );
}

function CreateShopModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (r: { shop: Shop; username: string; password: string }) => void;
}) {
  const toast = useToast();
  const [values, setValues] = useState<ShopFormValues>(emptyShopForm);
  const [ownerUsername, setOwnerUsername] = useState('');
  const [passwordMode, setPasswordMode] = useState<'generate' | 'custom'>('generate');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(emptyShopForm);
      setOwnerUsername('');
      setOwnerPassword('');
      setPasswordMode('generate');
      setErrors({});
      setFormError(null);
    }
  }, [open]);

  const suggestUsername = () => {
    if (ownerUsername || !values.name) return;
    setOwnerUsername(values.name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateShopForm(values, { requireOwner: true });
    if (!/^[a-z0-9._-]{3,40}$/i.test(ownerUsername.trim())) errs.ownerUsername = '3–40 characters: letters, numbers, dots, dashes or underscores.';
    if (passwordMode === 'custom' && (ownerPassword.length < 8 || !/[A-Za-z]/.test(ownerPassword) || !/\d/.test(ownerPassword))) {
      errs.ownerPassword = 'At least 8 characters with letters and numbers.';
    }
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const r = await api.post<{ shop: Shop; credentials: { username: string; temporaryPassword: string } }>('/api/admin/shops', {
        ...values,
        ownerUsername: ownerUsername.trim(),
        ownerPassword: passwordMode === 'custom' ? ownerPassword : undefined,
      });
      toast('success', 'Shop created', r.shop.name);
      onCreated({ shop: r.shop, username: r.credentials.username, password: r.credentials.temporaryPassword });
    } catch (err) {
      if (err instanceof ApiError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof ApiError ? err.message : 'Could not create shop.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Add a shop"
      description="Creates the shop, its QR code, default prices and the owner’s login."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="create-shop-form" loading={saving}>
            Create shop
          </Button>
        </>
      }
    >
      <form id="create-shop-form" onSubmit={submit} noValidate className="space-y-6">
        {formError && <Alert tone="danger">{formError}</Alert>}
        <div onBlur={suggestUsername}>
          <ShopFields values={values} onChange={setValues} errors={errors} />
        </div>
        <fieldset className="space-y-4 rounded-xl border border-line bg-cream/50 p-4">
          <legend className="px-1 text-sm font-bold text-ink">Owner login</legend>
          <Field label="Username" required error={errors.ownerUsername} hint="The owner signs in with this.">
            {(p) => (
              <Input {...p} value={ownerUsername} onChange={(e) => setOwnerUsername(e.target.value.toLowerCase())} autoCapitalize="none" spellCheck={false} autoComplete="off" maxLength={40} />
            )}
          </Field>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Temporary password</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {(['generate', 'custom'] as const).map((m) => (
                <label key={m} className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-sm has-[:checked]:border-gold-ink has-[:checked]:bg-gold-soft">
                  <input type="radio" name="pw-mode" value={m} checked={passwordMode === m} onChange={() => setPasswordMode(m)} className="accent-[#7a5c14]" />
                  {m === 'generate' ? 'Generate one for me' : 'Set it myself'}
                </label>
              ))}
            </div>
          </div>
          {passwordMode === 'custom' && (
            <Field label="Password" error={errors.ownerPassword}>
              {(p) => <PasswordInput {...p} value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} autoComplete="new-password" />}
            </Field>
          )}
          <p className="text-sm text-muted">The owner will be asked to choose their own password at first sign-in.</p>
        </fieldset>
      </form>
    </Modal>
  );
}
