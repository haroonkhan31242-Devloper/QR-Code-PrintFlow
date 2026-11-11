// Types shared by the API server and the React client.

export type Role = 'super_admin' | 'shop_owner';
export type ShopStatus = 'active' | 'inactive';
export type ColorMode = 'bw' | 'color';
export type PaperSize = 'A4' | 'A3' | 'Legal';
export type Sides = 'single' | 'double';
export type FinishingCode = 'none' | 'staple' | 'spiral_binding' | 'lamination';

export type OrderStatus = 'pending' | 'accepted' | 'printing' | 'ready' | 'completed' | 'rejected';
export type PaymentStatus = 'unpaid' | 'paid';

export const PAPER_SIZES: PaperSize[] = ['A4', 'A3', 'Legal'];
export const COLOR_MODES: ColorMode[] = ['bw', 'color'];
export const FINISHING_CODES: Exclude<FinishingCode, 'none'>[] = ['staple', 'spiral_binding', 'lamination'];

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'accepted', 'printing', 'ready', 'completed', 'rejected'];

/** Allowed status transitions, enforced on the server. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['printing', 'rejected'],
  printing: ['ready'],
  ready: ['completed'],
  completed: [],
  rejected: [],
};

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  shopId: string | null;
  mustChangePassword: boolean;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  operatingHours: string;
  status: ShopStatus;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopWithStats extends Shop {
  ownerUsername: string | null;
  ownerLastLoginAt: string | null;
  orderCount: number;
  pendingCount: number;
  lastOrderAt: string | null;
}

export interface PriceRule {
  paperSize: PaperSize;
  colorMode: ColorMode;
  priceSingle: number;
  priceDouble: number;
}

export interface FinishingOption {
  code: Exclude<FinishingCode, 'none'>;
  name: string;
  price: number;
  enabled: boolean;
}

export interface OrderFile {
  id: string;
  originalName: string;
  mime: string;
  size: number;
  pages: number;
  createdAt: string;
  purged: boolean;
}

export interface OrderEvent {
  status: OrderStatus;
  note: string | null;
  actor: string;
  createdAt: string;
}

export interface Order {
  id: string;
  shopId: string;
  orderNo: number;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  colorMode: ColorMode;
  paperSize: PaperSize;
  sides: Sides;
  copies: number;
  finishing: FinishingCode;
  pageCount: number;
  estimatedTotal: number;
  finalAmount: number | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
}

export interface OrderDetail extends Order {
  files: OrderFile[];
  events: OrderEvent[];
}

export interface PublicShop {
  name: string;
  address: string;
  city: string;
  phone: string;
  operatingHours: string;
  isOpen: boolean;
  prices: PriceRule[];
  finishing: FinishingOption[];
}

export interface PublicTracking {
  trackingCode: string;
  orderNo: number;
  shopName: string;
  status: OrderStatus;
  estimatedTotal: number;
  finalAmount: number | null;
  paymentStatus: PaymentStatus;
  rejectionReason: string | null;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
  events: { status: OrderStatus; createdAt: string }[];
}

export interface ActivityEntry {
  id: number;
  shopId: string | null;
  shopName: string | null;
  actor: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface AdminStats {
  shopsTotal: number;
  shopsActive: number;
  ordersTotal: number;
  ordersToday: number;
  ordersPending: number;
  storageBytes: number;
  last7Days: { date: string; count: number }[];
  topShops: { id: string; name: string; orders: number }[];
}

export interface ShopStats {
  ordersToday: number;
  pending: number;
  inProgress: number;
  readyForPickup: number;
  completedThisMonth: number;
  revenueThisMonth: number;
  last7Days: { date: string; count: number }[];
}

export type PrintJobStatus = 'queued' | 'printing' | 'done' | 'failed' | 'cancelled';

export interface PrintJob {
  id: string;
  orderId: string;
  fileCount: number;
  printer: string;
  copies: number;
  sides: Sides;
  colorMode: ColorMode;
  paperSize: PaperSize;
  status: PrintJobStatus;
  error: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrintAgentStatus {
  paired: boolean;
  online: boolean;
  name: string;
  printers: string[];
  defaultPrinter: string | null;
  lastSeenAt: string | null;
}

export const ALLOWED_UPLOAD_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'] as const;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 10;
