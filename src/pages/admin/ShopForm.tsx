import React from 'react';
import { Field, Input } from '../../components/ui';

export interface ShopFormValues {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  operatingHours: string;
}

export const emptyShopForm: ShopFormValues = { name: '', ownerName: '', phone: '', email: '', address: '', city: '', operatingHours: '' };

export function validateShopForm(v: ShopFormValues, opts: { requireOwner: boolean }) {
  const e: Record<string, string> = {};
  if (v.name.trim().length < 2) e.name = 'Enter the shop name.';
  if (opts.requireOwner && !v.ownerName.trim()) e.ownerName = 'Enter the owner’s name.';
  if (!/^[+\d][\d\s()-]{5,}$/.test(v.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email address.';
  return e;
}

/** Shop detail fields shared by the Super Admin forms and the shop settings page. */
export function ShopFields({
  values,
  onChange,
  errors,
  showOwner = true,
}: {
  values: ShopFormValues;
  onChange: (v: ShopFormValues) => void;
  errors: Record<string, string>;
  showOwner?: boolean;
}) {
  const bind = (key: keyof ShopFormValues) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [key]: e.target.value }),
  });
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Shop name" required error={errors.name} className="sm:col-span-2">
        {(p) => <Input {...p} {...bind('name')} maxLength={80} />}
      </Field>
      {showOwner && (
        <Field label="Owner name" required error={errors.ownerName}>
          {(p) => <Input {...p} {...bind('ownerName')} maxLength={80} autoComplete="off" />}
        </Field>
      )}
      <Field label="Phone" required error={errors.phone}>
        {(p) => <Input {...p} {...bind('phone')} type="tel" maxLength={30} />}
      </Field>
      <Field label="Email" error={errors.email} className={showOwner ? 'sm:col-span-2' : ''}>
        {(p) => <Input {...p} {...bind('email')} type="email" maxLength={120} />}
      </Field>
      <Field label="Address" error={errors.address} className="sm:col-span-2">
        {(p) => <Input {...p} {...bind('address')} maxLength={200} />}
      </Field>
      <Field label="City" error={errors.city}>
        {(p) => <Input {...p} {...bind('city')} maxLength={60} />}
      </Field>
      <Field label="Opening hours" hint="Shown to customers, e.g. Mon–Sat 9am–9pm" error={errors.operatingHours}>
        {(p) => <Input {...p} {...bind('operatingHours')} maxLength={80} />}
      </Field>
    </div>
  );
}
