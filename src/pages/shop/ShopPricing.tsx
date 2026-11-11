import React, { useEffect, useState } from 'react';
import { COLOR_MODES, PAPER_SIZES, type FinishingOption, type PriceRule } from '../../../shared/types';
import { api, ApiError } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useDocumentTitle } from '../../lib/router';
import { COLOR_LABEL, FINISHING_LABEL } from '../../lib/format';
import { Button, Card, CardHeader, ErrorState, Input, PageHeader, Skeleton, Toggle } from '../../components/ui';
import { useToast } from '../../components/toast';

type Grid = Record<string, { enabled: boolean; single: string; double: string }>;
const key = (size: string, mode: string) => `${size}:${mode}`;

export function ShopPricing() {
  useDocumentTitle('Prices');
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi<{ prices: PriceRule[]; finishing: FinishingOption[] }>('/api/shop/pricing');
  const [grid, setGrid] = useState<Grid>({});
  const [finishing, setFinishing] = useState<{ code: FinishingOption['code']; enabled: boolean; price: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data) return;
    const g: Grid = {};
    for (const size of PAPER_SIZES)
      for (const mode of COLOR_MODES) {
        const r = data.prices.find((p) => p.paperSize === size && p.colorMode === mode);
        g[key(size, mode)] = { enabled: Boolean(r), single: r ? String(r.priceSingle) : '', double: r ? String(r.priceDouble) : '' };
      }
    setGrid(g);
    setFinishing(data.finishing.map((f) => ({ code: f.code, enabled: f.enabled, price: String(f.price) })));
    setDirty(false);
  }, [data]);

  const update = (k: string, patch: Partial<Grid[string]>) => {
    setGrid((g) => ({ ...g, [k]: { ...g[k], ...patch } }));
    setDirty(true);
  };

  const valid = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;

  const save = async () => {
    const prices: PriceRule[] = [];
    for (const size of PAPER_SIZES)
      for (const mode of COLOR_MODES) {
        const row = grid[key(size, mode)];
        if (!row?.enabled) continue;
        if (!valid(row.single) || !valid(row.double)) {
          toast('error', `Check the ${size} ${COLOR_LABEL[mode].toLowerCase()} prices`, 'Enter a number of 0 or more.');
          return;
        }
        prices.push({ paperSize: size, colorMode: mode, priceSingle: Number(row.single), priceDouble: Number(row.double) });
      }
    if (!prices.length) {
      toast('error', 'Turn on at least one paper option', 'Customers need something to choose.');
      return;
    }
    if (finishing.some((f) => !valid(f.price))) {
      toast('error', 'Check the finishing prices');
      return;
    }
    setSaving(true);
    try {
      const r = await api.put<{ prices: PriceRule[]; finishing: FinishingOption[] }>('/api/shop/pricing', {
        prices,
        finishing: finishing.map((f) => ({ code: f.code, enabled: f.enabled, price: Number(f.price) })),
      });
      setData(r);
      toast('success', 'Prices saved', 'Customers see the new prices right away.');
    } catch (err) {
      toast('error', 'Could not save prices', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  if (error)
    return (
      <Card>
        <ErrorState message={error.message} onRetry={() => reload()} />
      </Card>
    );

  return (
    <>
      <PageHeader
        title="Prices"
        description="What customers are charged per sheet. The estimate on the upload page uses these."
        actions={
          <Button onClick={save} loading={saving} disabled={!dirty || loading}>
            Save prices
          </Button>
        }
      />
      {loading || !data ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Printing" description="Price per sheet in rupees. Double-sided is the price for one sheet printed on both sides." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-cream/70 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold">Paper</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Offered</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Single-sided</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Double-sided</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {PAPER_SIZES.flatMap((size) =>
                    COLOR_MODES.map((mode) => {
                      const k = key(size, mode);
                      const row = grid[k];
                      if (!row) return null;
                      const label = `${size} ${COLOR_LABEL[mode].toLowerCase()}`;
                      return (
                        <tr key={k} className={row.enabled ? '' : 'bg-cream/40'}>
                          <th scope="row" className="px-6 py-3 font-semibold text-ink">
                            {size} <span className="font-normal text-muted">· {COLOR_LABEL[mode]}</span>
                          </th>
                          <td className="px-4 py-3">
                            <Toggle checked={row.enabled} onChange={(v) => update(k, { enabled: v })} label={`Offer ${label}`} />
                          </td>
                          <td className="px-4 py-3">
                            <PriceInput label={`${label} single-sided price`} value={row.single} disabled={!row.enabled} onChange={(v) => update(k, { single: v })} />
                          </td>
                          <td className="px-4 py-3">
                            <PriceInput label={`${label} double-sided price`} value={row.double} disabled={!row.enabled} onChange={(v) => update(k, { double: v })} />
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Finishing" description="Charged once per copy." />
            <ul className="divide-y divide-line">
              {finishing.map((f, i) => (
                <li key={f.code} className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
                  <Toggle
                    checked={f.enabled}
                    label={`Offer ${FINISHING_LABEL[f.code]}`}
                    onChange={(v) => {
                      setFinishing((list) => list.map((x, j) => (j === i ? { ...x, enabled: v } : x)));
                      setDirty(true);
                    }}
                  />
                  <span className="flex-1 font-semibold text-ink">{FINISHING_LABEL[f.code]}</span>
                  <PriceInput
                    label={`${FINISHING_LABEL[f.code]} price`}
                    value={f.price}
                    disabled={!f.enabled}
                    onChange={(v) => {
                      setFinishing((list) => list.map((x, j) => (j === i ? { ...x, price: v } : x)));
                      setDirty(true);
                    }}
                  />
                </li>
              ))}
            </ul>
          </Card>
          {dirty && (
            <div className="sticky bottom-4 flex justify-end">
              <Button onClick={save} loading={saving} className="shadow-pop">
                Save prices
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PriceInput({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="relative w-32">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted" aria-hidden>
        Rs
      </span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.5"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="tabular pl-9"
        aria-invalid={!disabled && (value.trim() === '' || Number(value) < 0) ? true : undefined}
      />
    </div>
  );
}
