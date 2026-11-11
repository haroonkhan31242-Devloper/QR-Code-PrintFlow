export type UserRole = 'super_admin' | 'shop_admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  shopId?: string; // defined if role === 'shop_admin'
  username?: string;
  password?: string;
  status?: 'active' | 'suspended' | 'deactivated';
  avatarUrl?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export type ShopStatus = 'active' | 'suspended' | 'deactivated';

export interface ShopCategory {
  id: string; // e.g. "CAT-1001-DOC"
  shopId: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  servicesCount?: number;
  createdAt?: string;
}

export interface Shop {
  id: string; // e.g. "SHOP-1001"
  name: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  address: string;
  city: string;
  status: ShopStatus;
  subscriptionPlanId: string;
  subscriptionExpiresAt: string;
  createdAt: string;
  activeQrId: string;
  activeQrToken: string;
  operatingHours: string;
  logoUrl?: string;
  categoryIds?: string[];
  adminUsername?: string;
}

export type QRStatus = 'active' | 'revoked' | 'replaced';

export interface QRCodeRecord {
  id: string; // e.g. "QR-1001-A"
  shopId: string;
  token: string;
  status: QRStatus;
  createdAt: string;
  revokedAt?: string;
  replacementRef?: string;
  scansCount: number;
}

export type ServiceCategory = 'standard' | 'large_format' | 'finishing' | 'specialty';

export interface PrintingService {
  id: string;
  shopId: string;
  name: string;
  category: ServiceCategory;
  categoryId?: string; // Associated ShopCategory ID
  paperSize: 'A4' | 'A3' | 'Legal' | 'Letter' | 'Custom';
  colorMode: 'bw' | 'color' | 'both';
  sides: 'single' | 'double' | 'both';
  basePrice: number; // in PKR
  isActive: boolean;
  description: string;
}

export type AuthResult =
  | { success: true; user: User; shop: Shop }
  | {
      success: false;
      reason:
        | 'invalid_credentials'
        | 'shop_suspended'
        | 'account_suspended'
        | 'account_deactivated'
        | 'not_found';
      message: string;
      shopId?: string;
      shopName?: string;
    };


export interface PricingRule {
  id: string;
  shopId: string;
  paperSize: string;
  colorMode: 'bw' | 'color';
  pricePerPageSingle: number; // PKR
  pricePerPageDouble: number; // PKR
  updatedAt: string;
}

export interface AdditionalOption {
  id: string;
  shopId: string;
  name: string;
  type: 'staple' | 'spiral_binding' | 'lamination' | 'paper_quality';
  price: number;
  enabled: boolean;
}

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  estimatedPages: number;
  previewUrl?: string;
  uploadedAt: string;
}

export type OrderStatus =
  | 'new'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'printing_initiated'
  | 'printing_in_progress'
  | 'printing_completed'
  | 'completed_handover'
  | 'cancelled'
  | 'printing_failed';

export type PaymentMethod = 'cash' | 'jazzcash' | 'easypaisa' | 'online';
export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'failed' | 'refunded';

export interface CustomerOrder {
  id: string; // e.g. "ORD-8941"
  shopId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialNotes?: string;
  status: OrderStatus;
  rejectionReason?: string;
  printingFailureReason?: string;
  files: UploadedDocument[];
  preferences: {
    colorMode: 'bw' | 'color';
    paperSize: 'A4' | 'A3' | 'Legal';
    sides: 'single' | 'double';
    copies: number;
    pageRange: 'all' | string;
    finishingOption?: string;
  };
  pricingSnapshot: {
    baseRatePerPage: number;
    copies: number;
    pagesCount: number;
    sidesFactor: number;
    finishingCost: number;
    estimatedTotal: number;
    currency: string;
  };
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionRef?: string;
  assignedPrinterId?: string;
  submittedAt: string;
  reviewedAt?: string;
  completedAt?: string;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
}

export interface Printer {
  id: string;
  shopId: string;
  name: string;
  model: string;
  type: 'Laser' | 'Inkjet' | 'Multifunction Digital Press';
  connectionStatus: 'online' | 'ready' | 'offline' | 'busy';
  isDefault: boolean;
  supportedSizes: string[];
  tonerLevelBlack: number;
  tonerLevelColor: number;
  paperLevel: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // PKR / mo
  billingPeriod: 'monthly' | 'yearly';
  description: string;
  features: string[];
  activeShopsCount: number;
}

export interface AuditLog {
  id: string;
  shopId?: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface NotificationItem {
  id: string;
  targetRole: 'super_admin' | 'shop_admin' | 'customer';
  targetShopId?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'order' | 'system' | 'payment' | 'qr';
}

export interface SupportTicket {
  id: string;
  shopId: string;
  shopName: string;
  subject: string;
  category: 'technical' | 'billing' | 'hardware' | 'feature';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  messages: {
    sender: string;
    text: string;
    timestamp: string;
    isAdminReply?: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}
