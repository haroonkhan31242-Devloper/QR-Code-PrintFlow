import React, { useEffect, useState } from 'react';
import type { Shop } from '../../shared/types';
import { shopService, ServiceError } from '../../services';
import { useDocumentTitle } from '../../lib/router';
import { Button, Card, CardHeader, PageHeader, Skeleton } from '../../components/ui';
import { useToast } from '../../components/toast';
import { ChangePasswordForm } from '../auth/ChangePasswordForm';
import { ShopFields, validateShopForm, type ShopFormValues } from '../admin/ShopForm';
import { useShop } from './ShopContext';

export function ShopSettings() {
  useDocumentTitle('Settings');
  const toast = useToast();
  const { shop, setShop } = useShop();
  const [values, setValues] = useState<ShopFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shop) setValues({ name: shop.name, ownerName: shop.ownerName, phone: shop.phone, email: shop.email, address: shop.address, city: shop.city, operatingHours: shop.operatingHours });
  }, [shop?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    const errs = validateShopForm(values, { requireOwner: false });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const r = { shop: await shopService.updateMyShop(values) };
      setShop(r.shop);
      toast('success', 'Shop details saved');
    } catch (err) {
      if (err instanceof ServiceError && err.field) setErrors({ [err.field]: err.message });
      else toast('error', 'Could not save', err instanceof ServiceError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Your shop details and sign-in password." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Shop details" description="Customers see these on your upload page." />
          {!values ? (
            <Skeleton className="m-6 h-72" />
          ) : (
            <form onSubmit={save} noValidate className="space-y-6 p-5 sm:p-6">
              <ShopFields values={values} onChange={setValues} errors={errors} showOwner={false} />
              <div className="flex justify-end">
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </Card>
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader title="Change password" description="Other devices are signed out after a change." />
            <div className="p-5 sm:p-6">
              <ChangePasswordForm />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
