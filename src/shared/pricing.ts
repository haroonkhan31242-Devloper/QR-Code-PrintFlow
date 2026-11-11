import type { ColorMode, FinishingCode, FinishingOption, PaperSize, PriceRule, Sides } from './types';

export interface EstimateInput {
  pageCount: number;
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  sides: Sides;
  finishing: FinishingCode;
}

export interface Estimate {
  sheets: number;
  ratePerSheet: number;
  printCost: number;
  finishingCost: number;
  total: number;
  available: boolean;
}

/**
 * Price estimate used by the customer page (preview) and publicService (saved with the order).
 * Double-sided rate is charged per sheet (2 pages per sheet).
 */
export function estimatePrice(input: EstimateInput, rules: PriceRule[], finishing: FinishingOption[]): Estimate {
  const rule = rules.find((r) => r.paperSize === input.paperSize && r.colorMode === input.colorMode);
  const pages = Math.max(0, Math.floor(input.pageCount));
  const copies = Math.max(1, Math.floor(input.copies));
  if (!rule) {
    return { sheets: 0, ratePerSheet: 0, printCost: 0, finishingCost: 0, total: 0, available: false };
  }
  const sheets = input.sides === 'double' ? Math.ceil(pages / 2) : pages;
  const ratePerSheet = input.sides === 'double' ? rule.priceDouble : rule.priceSingle;
  const printCost = sheets * ratePerSheet * copies;
  let finishingCost = 0;
  if (input.finishing !== 'none') {
    const opt = finishing.find((f) => f.code === input.finishing && f.enabled);
    if (opt) finishingCost = opt.price * copies;
  }
  return {
    sheets,
    ratePerSheet,
    printCost,
    finishingCost,
    total: Math.round((printCost + finishingCost) * 100) / 100,
    available: true,
  };
}

/** Rough PDF page counter that works on raw bytes. */
export function countPdfPages(text: string): number {
  const pageObjects = (text.match(/\/Type\s*\/Page(?!s)\b/g) || []).length;
  let treeCount = 0;
  for (const m of text.matchAll(/\/Count\s+(\d{1,5})/g)) treeCount = Math.max(treeCount, Number(m[1]));
  return Math.min(5000, Math.max(1, pageObjects, treeCount));
}
