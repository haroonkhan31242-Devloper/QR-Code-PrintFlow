import {
  Shop,
  QRCodeRecord,
  PrintingService,
  PricingRule,
  AdditionalOption,
  CustomerOrder,
  Printer,
  SubscriptionPlan,
  AuditLog,
  NotificationItem,
  SupportTicket,
  User,
  OrderStatus,
  ShopStatus,
  ShopCategory,
  AuthResult,
} from '../types';

const STORAGE_KEYS = {
  SHOPS: 'printflow_shops_v1',
  QR_CODES: 'printflow_qrcodes_v1',
  SERVICES: 'printflow_services_v1',
  CATEGORIES: 'printflow_categories_v1',
  PRICING: 'printflow_pricing_v1',
  ADDITIONAL_OPTIONS: 'printflow_add_options_v1',
  ORDERS: 'printflow_orders_v1',
  PRINTERS: 'printflow_printers_v1',
  SUBSCRIPTIONS: 'printflow_subscriptions_v1',
  AUDIT_LOGS: 'printflow_audit_logs_v1',
  NOTIFICATIONS: 'printflow_notifications_v1',
  TICKETS: 'printflow_tickets_v1',
  CURRENT_USER: 'printflow_current_user_v1',
  USERS: 'printflow_users_v1',
  THEME: 'printflow_theme_v1',
};

// Seed Demonstration Accounts
export const DEMO_USERS: User[] = [
  {
    id: 'USR-SUPER',
    email: 'superadmin@printflow.io',
    username: 'superadmin',
    password: 'super123',
    name: 'Platform Super Admin',
    role: 'super_admin',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'USR-SHOP-1',
    email: 'admin@apexprint.pk',
    username: 'apexadmin',
    password: 'apex123',
    name: 'Tariq Mehmood',
    role: 'shop_admin',
    shopId: 'SHOP-1001',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'USR-SHOP-2',
    email: 'manager@metroprint.pk',
    username: 'metroadmin',
    password: 'metro123',
    name: 'Zainab Farooq',
    role: 'shop_admin',
    shopId: 'SHOP-1002',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-15T12:00:00Z',
  },
  {
    id: 'USR-SHOP-3',
    email: 'admin@campusprint.pk',
    username: 'campusadmin',
    password: 'campus123',
    name: 'Bilal Hussain',
    role: 'shop_admin',
    shopId: 'SHOP-1003',
    status: 'active', // Note: Shop SHOP-1003 itself is suspended, testing suspended shop flow!
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-01T08:30:00Z',
  },
  {
    id: 'USR-SHOP-SUSPENDED',
    email: 'suspended@apexprint.pk',
    username: 'suspendedowner',
    password: 'suspend123',
    name: 'Hamza Rafiq (Suspended)',
    role: 'shop_admin',
    shopId: 'SHOP-1001',
    status: 'suspended',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'USR-SHOP-DEACTIVATED',
    email: 'deactivated@printflow.io',
    username: 'deactivateduser',
    password: 'deact123',
    name: 'Kashif Ali (Deactivated)',
    role: 'shop_admin',
    shopId: 'SHOP-1001',
    status: 'deactivated',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-20T10:00:00Z',
  },
];


// Seed Demonstration Subscription Plans
const SEED_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'PLAN-BASIC',
    name: 'Starter Print Hub',
    price: 3500,
    billingPeriod: 'monthly',
    description: 'Essential single-counter setup for local neighborhood print shops.',
    features: [
      'Single Shop Profile',
      'Dynamic QR Code Generator',
      'Up to 300 Monthly Orders',
      'Basic Document Preview',
      'Standard Email & In-App Alerts',
    ],
    activeShopsCount: 1,
  },
  {
    id: 'PLAN-PRO',
    name: 'Pro Commercial Press',
    price: 7500,
    billingPeriod: 'monthly',
    description: 'Advanced multi-service management for busy commercial digital printing studios.',
    features: [
      'Unlimited QR Code Generation & Revocation',
      'Unlimited Customer Printing Orders',
      'Priority Customer Queue Management',
      'Full Printer Hardware Telemetry',
      'Direct JazzCash & Easypaisa Integration',
      'Custom Branded Scannable Posters',
      'Creative AI Poster Studio (1K/2K/4K)',
    ],
    activeShopsCount: 2,
  },
  {
    id: 'PLAN-ENTERPRISE',
    name: 'Campus Enterprise Chain',
    price: 18000,
    billingPeriod: 'monthly',
    description: 'Full multi-counter orchestration for universities, corporate centers, and retail chains.',
    features: [
      'Multiple Counter Staff Logins',
      'High-Throughput Queue Auto-Dispatch',
      'Enterprise SLA & Dedicated Manager',
      'API & ERP Printing Hooks',
      'Multi-Format Motion Poster Studio',
    ],
    activeShopsCount: 0,
  },
];

// Seed Demonstration Categories (Multiple Categories Per Shop)
export const SEED_CATEGORIES: ShopCategory[] = [
  // SHOP-1001 Categories
  {
    id: 'CAT-1001-1',
    shopId: 'SHOP-1001',
    name: 'Document & Thesis Printing',
    description: 'Crisp 1200 DPI monochrome & color documents, thesis reports, and course materials.',
    icon: 'FileText',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'CAT-1001-2',
    shopId: 'SHOP-1001',
    name: 'Large Format, Posters & CAD',
    description: 'Tabloid CAD drawings, architectural blueprints, schematics, and high-impact color posters.',
    icon: 'Maximize2',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'CAT-1001-3',
    shopId: 'SHOP-1001',
    name: 'Binding, Lamination & Finishing',
    description: 'Clear acetate spiral wire ring binding, thermal lamination, and presentation finishing.',
    icon: 'BookOpen',
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'CAT-1001-4',
    shopId: 'SHOP-1001',
    name: 'Commercial & Legal Services',
    description: 'Official 8.5 x 14 inch legal agreements, court affidavits, and corporate documents.',
    icon: 'Briefcase',
    isActive: true,
    displayOrder: 4,
  },

  // SHOP-1002 Categories
  {
    id: 'CAT-1002-1',
    shopId: 'SHOP-1002',
    name: 'High-Speed Copy & Documentation',
    description: 'High-speed automated double-sided document copy and black & white volume prints.',
    icon: 'Copy',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'CAT-1002-2',
    shopId: 'SHOP-1002',
    name: 'Fine Graphic & Canvas Art',
    description: 'Studio calibrated color reproduction, glossy photo prints, and marketing presentations.',
    icon: 'Palette',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'CAT-1002-3',
    shopId: 'SHOP-1002',
    name: 'Finishing & Presentation',
    description: 'Gloss and matte lamination, wire binding, corner stapling.',
    icon: 'Layers',
    isActive: true,
    displayOrder: 3,
  },

  // SHOP-1003 Categories
  {
    id: 'CAT-1003-1',
    shopId: 'SHOP-1003',
    name: 'Student Assignments & Notes',
    description: 'Subsidized rapid printing for student lecture notes, problem sets, and homework.',
    icon: 'GraduationCap',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'CAT-1003-2',
    shopId: 'SHOP-1003',
    name: 'Past Papers & Coursepacks',
    description: 'Curated university past papers and bundled semester reading packets.',
    icon: 'FolderOpen',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'CAT-1003-3',
    shopId: 'SHOP-1003',
    name: 'Fast Ring Binding',
    description: 'Same-day spiral comb binding for term reports and project submissions.',
    icon: 'BookOpen',
    isActive: true,
    displayOrder: 3,
  },
];

// Seed Demonstration Shops
const SEED_SHOPS: Shop[] = [
  {
    id: 'SHOP-1001',
    name: 'Apex QuickPrint Express',
    ownerName: 'Tariq Mehmood',
    contactNumber: '+92 300 8472910',
    email: 'apexprint.lhr@gmail.com',
    address: 'Shop #14, Main Commercial Boulevard, Gulberg III',
    city: 'Lahore',
    status: 'active',
    subscriptionPlanId: 'PLAN-PRO',
    subscriptionExpiresAt: '2027-04-15T00:00:00Z',
    createdAt: '2026-01-10T10:00:00Z',
    activeQrId: 'QR-1001-B',
    activeQrToken: 'tok_apex_gulberg_92a',
    operatingHours: '08:30 AM - 10:00 PM (Mon-Sat)',
    logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=80',
    categoryIds: ['CAT-1001-1', 'CAT-1001-2', 'CAT-1001-3', 'CAT-1001-4'],
    adminUsername: 'apexadmin',
  },
  {
    id: 'SHOP-1002',
    name: 'Metro Digital Graphics & Copy',
    ownerName: 'Zainab Farooq',
    contactNumber: '+92 321 4920194',
    email: 'metrocopy.khi@gmail.com',
    address: 'Plot 42-C, 10th Commercial Street, Phase II Ext, DHA',
    city: 'Karachi',
    status: 'active',
    subscriptionPlanId: 'PLAN-PRO',
    subscriptionExpiresAt: '2027-05-20T00:00:00Z',
    createdAt: '2026-02-15T12:00:00Z',
    activeQrId: 'QR-1002-A',
    activeQrToken: 'tok_metro_dha_41x',
    operatingHours: '09:00 AM - 11:30 PM (Daily)',
    logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=150&auto=format&fit=crop&q=80',
    categoryIds: ['CAT-1002-1', 'CAT-1002-2', 'CAT-1002-3'],
    adminUsername: 'metroadmin',
  },
  {
    id: 'SHOP-1003',
    name: 'Varsity Campus Xerox & Print',
    ownerName: 'Bilal Hussain',
    contactNumber: '+92 333 5519283',
    email: 'varsityprint.isb@gmail.com',
    address: 'Student Service Center, H-12 Campus',
    city: 'Islamabad',
    status: 'suspended',
    subscriptionPlanId: 'PLAN-BASIC',
    subscriptionExpiresAt: '2026-03-01T00:00:00Z',
    createdAt: '2026-03-01T08:30:00Z',
    activeQrId: 'QR-1003-A',
    activeQrToken: 'tok_varsity_h12_77z',
    operatingHours: '08:00 AM - 08:00 PM (Mon-Fri)',
    logoUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=150&auto=format&fit=crop&q=80',
    categoryIds: ['CAT-1003-1', 'CAT-1003-2', 'CAT-1003-3'],
    adminUsername: 'campusadmin',
  },
];

// Seed QR Code Records
const SEED_QR_CODES: QRCodeRecord[] = [
  {
    id: 'QR-1001-A',
    shopId: 'SHOP-1001',
    token: 'tok_apex_old_11z',
    status: 'revoked',
    createdAt: '2026-01-10T10:15:00Z',
    revokedAt: '2026-04-02T14:20:00Z',
    replacementRef: 'QR-1001-B',
    scansCount: 420,
  },
  {
    id: 'QR-1001-B',
    shopId: 'SHOP-1001',
    token: 'tok_apex_gulberg_92a',
    status: 'active',
    createdAt: '2026-04-02T14:25:00Z',
    scansCount: 894,
  },
  {
    id: 'QR-1002-A',
    shopId: 'SHOP-1002',
    token: 'tok_metro_dha_41x',
    status: 'active',
    createdAt: '2026-02-15T12:30:00Z',
    scansCount: 1350,
  },
  {
    id: 'QR-1003-A',
    shopId: 'SHOP-1003',
    token: 'tok_varsity_h12_77z',
    status: 'active',
    createdAt: '2026-03-01T08:45:00Z',
    scansCount: 240,
  },
];

// Seed Printing Services
const SEED_SERVICES: PrintingService[] = [
  // SHOP-1001 Services
  {
    id: 'SRV-1001-1',
    shopId: 'SHOP-1001',
    categoryId: 'CAT-1001-1',
    name: 'A4 Document Laser Print (B&W)',
    category: 'standard',
    paperSize: 'A4',
    colorMode: 'bw',
    sides: 'both',
    basePrice: 5,
    isActive: true,
    description: 'Crisp 1200 DPI monochrome text & reports on 80 GSM bond paper.',
  },
  {
    id: 'SRV-1001-2',
    shopId: 'SHOP-1001',
    categoryId: 'CAT-1001-1',
    name: 'A4 Vibrant Colour Digital Print',
    category: 'standard',
    paperSize: 'A4',
    colorMode: 'color',
    sides: 'both',
    basePrice: 25,
    isActive: true,
    description: 'Rich graphic presentation and flyer printing on premium smooth stock.',
  },
  {
    id: 'SRV-1001-3',
    shopId: 'SHOP-1001',
    categoryId: 'CAT-1001-2',
    name: 'A3 Engineering / Poster Print (B&W)',
    category: 'large_format',
    paperSize: 'A3',
    colorMode: 'bw',
    sides: 'single',
    basePrice: 15,
    isActive: true,
    description: 'Tabloid CAD drawings, schematics, and enlarged study sheets.',
  },
  {
    id: 'SRV-1001-4',
    shopId: 'SHOP-1001',
    categoryId: 'CAT-1001-2',
    name: 'A3 Full-Colour Glossy Poster',
    category: 'large_format',
    paperSize: 'A3',
    colorMode: 'color',
    sides: 'single',
    basePrice: 50,
    isActive: true,
    description: 'High-impact color banners, project posters, and charts.',
  },
  {
    id: 'SRV-1001-5',
    shopId: 'SHOP-1001',
    categoryId: 'CAT-1001-4',
    name: 'Legal Court & Affidavit Print',
    category: 'standard',
    paperSize: 'Legal',
    colorMode: 'bw',
    sides: 'both',
    basePrice: 8,
    isActive: true,
    description: 'Official 8.5 x 14 inch legal agreements, stamp paper duplicates.',
  },
  {
    id: 'SRV-1001-6',
    shopId: 'SHOP-1001',
    categoryId: 'CAT-1001-3',
    name: 'Spiral Wire Ring Binding',
    category: 'finishing',
    paperSize: 'A4',
    colorMode: 'both',
    sides: 'both',
    basePrice: 80,
    isActive: true,
    description: 'Plastic spiral ring with transparent clear acetate front and card back.',
  },
  {
    id: 'SRV-1001-7',
    shopId: 'SHOP-1001',
    categoryId: 'CAT-1001-3',
    name: 'Thermal Heat Lamination (A4)',
    category: 'finishing',
    paperSize: 'A4',
    colorMode: 'both',
    sides: 'both',
    basePrice: 50,
    isActive: true,
    description: 'Waterproof 150-micron protective gloss lamination.',
  },

  // SHOP-1002 Services
  {
    id: 'SRV-1002-1',
    shopId: 'SHOP-1002',
    categoryId: 'CAT-1002-1',
    name: 'A4 B&W High-Speed Photocopy',
    category: 'standard',
    paperSize: 'A4',
    colorMode: 'bw',
    sides: 'both',
    basePrice: 7,
    isActive: true,
    description: 'High-speed automated double-sided document copy.',
  },
  {
    id: 'SRV-1002-2',
    shopId: 'SHOP-1002',
    categoryId: 'CAT-1002-2',
    name: 'A4 Pro Colour Laser Print',
    category: 'standard',
    paperSize: 'A4',
    colorMode: 'color',
    sides: 'both',
    basePrice: 30,
    isActive: true,
    description: 'Studio calibrated color reproduction for portfolios and marketing collateral.',
  },
  {
    id: 'SRV-1002-3',
    shopId: 'SHOP-1002',
    categoryId: 'CAT-1002-2',
    name: 'A3 Heavyweight Colour Print',
    category: 'large_format',
    paperSize: 'A3',
    colorMode: 'color',
    sides: 'single',
    basePrice: 60,
    isActive: true,
    description: 'Printed on 200 GSM coated cardstock for menus and architectural boards.',
  },


  // SHOP-1003 Services
  {
    id: 'SRV-1003-1',
    shopId: 'SHOP-1003',
    categoryId: 'CAT-1003-1',
    name: 'Campus Student A4 B&W Print',
    category: 'standard',
    paperSize: 'A4',
    colorMode: 'bw',
    sides: 'both',
    basePrice: 4,
    isActive: true,
    description: 'Affordable academic subsidized lecture notes and assignments.',
  },
  {
    id: 'SRV-1003-2',
    shopId: 'SHOP-1003',
    categoryId: 'CAT-1003-2',
    name: 'Midterm & Final Past Papers Pack',
    category: 'standard',
    paperSize: 'A4',
    colorMode: 'bw',
    sides: 'both',
    basePrice: 120,
    isActive: true,
    description: 'Bound 5-year past examination compilation for engineering & sciences.',
  },
  {
    id: 'SRV-1003-3',
    shopId: 'SHOP-1003',
    categoryId: 'CAT-1003-3',
    name: 'Express Student Spiral Binding',
    category: 'finishing',
    paperSize: 'A4',
    colorMode: 'both',
    sides: 'both',
    basePrice: 50,
    isActive: true,
    description: 'Rapid plastic comb ring binding with heavy front sheet.',
  },
];


// Seed Pricing Rules
const SEED_PRICING: PricingRule[] = [
  // Shop 1001
  {
    id: 'PRC-1001-1',
    shopId: 'SHOP-1001',
    paperSize: 'A4',
    colorMode: 'bw',
    pricePerPageSingle: 5,
    pricePerPageDouble: 8,
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'PRC-1001-2',
    shopId: 'SHOP-1001',
    paperSize: 'A4',
    colorMode: 'color',
    pricePerPageSingle: 25,
    pricePerPageDouble: 45,
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'PRC-1001-3',
    shopId: 'SHOP-1001',
    paperSize: 'A3',
    colorMode: 'bw',
    pricePerPageSingle: 15,
    pricePerPageDouble: 25,
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'PRC-1001-4',
    shopId: 'SHOP-1001',
    paperSize: 'A3',
    colorMode: 'color',
    pricePerPageSingle: 50,
    pricePerPageDouble: 90,
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'PRC-1001-5',
    shopId: 'SHOP-1001',
    paperSize: 'Legal',
    colorMode: 'bw',
    pricePerPageSingle: 8,
    pricePerPageDouble: 14,
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Shop 1002
  {
    id: 'PRC-1002-1',
    shopId: 'SHOP-1002',
    paperSize: 'A4',
    colorMode: 'bw',
    pricePerPageSingle: 7,
    pricePerPageDouble: 12,
    updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'PRC-1002-2',
    shopId: 'SHOP-1002',
    paperSize: 'A4',
    colorMode: 'color',
    pricePerPageSingle: 30,
    pricePerPageDouble: 55,
    updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'PRC-1002-3',
    shopId: 'SHOP-1002',
    paperSize: 'A3',
    colorMode: 'bw',
    pricePerPageSingle: 20,
    pricePerPageDouble: 35,
    updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'PRC-1002-4',
    shopId: 'SHOP-1002',
    paperSize: 'A3',
    colorMode: 'color',
    pricePerPageSingle: 60,
    pricePerPageDouble: 110,
    updatedAt: '2026-03-10T00:00:00Z',
  },
];

// Seed Additional Options
const SEED_ADDITIONAL_OPTIONS: AdditionalOption[] = [
  {
    id: 'OPT-1',
    shopId: 'SHOP-1001',
    name: 'Top-Left Corner Staple',
    type: 'staple',
    price: 5,
    enabled: true,
  },
  {
    id: 'OPT-2',
    shopId: 'SHOP-1001',
    name: 'Plastic Spiral Ring Binding',
    type: 'spiral_binding',
    price: 80,
    enabled: true,
  },
  {
    id: 'OPT-3',
    shopId: 'SHOP-1001',
    name: 'Protective Gloss Lamination',
    type: 'lamination',
    price: 50,
    enabled: true,
  },
  {
    id: 'OPT-4',
    shopId: 'SHOP-1002',
    name: 'Corner Staple',
    type: 'staple',
    price: 10,
    enabled: true,
  },
  {
    id: 'OPT-5',
    shopId: 'SHOP-1002',
    name: 'Premium Thermal Book Binding',
    type: 'spiral_binding',
    price: 120,
    enabled: true,
  },
];

// Seed Customer Orders
const SEED_ORDERS: CustomerOrder[] = [
  {
    id: 'ORD-8941',
    shopId: 'SHOP-1001',
    customerName: 'Hamza Naveed',
    customerPhone: '+92 312 9018241',
    customerEmail: 'hamza.nav@gmail.com',
    specialNotes: 'Please print in order and staple top-left corner.',
    status: 'new',
    files: [
      {
        id: 'DOC-1',
        name: 'Final_Semester_Project_Documentation_v3.pdf',
        size: 3420000,
        type: 'application/pdf',
        estimatedPages: 18,
        uploadedAt: '2026-11-09T08:15:00Z',
      },
    ],
    preferences: {
      colorMode: 'bw',
      paperSize: 'A4',
      sides: 'double',
      copies: 2,
      pageRange: 'all',
      finishingOption: 'staple',
    },
    pricingSnapshot: {
      baseRatePerPage: 8,
      copies: 2,
      pagesCount: 9, // 18 pages double sided = 9 sheets
      sidesFactor: 1,
      finishingCost: 10, // 2 copies * 5 PKR staple
      estimatedTotal: 154,
      currency: 'PKR',
    },
    finalAmount: 154,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    submittedAt: '2026-11-09T08:15:00Z',
    timeline: [
      {
        status: 'new',
        timestamp: '2026-11-09T08:15:00Z',
        note: 'Customer scanned QR and submitted request.',
      },
    ],
  },
  {
    id: 'ORD-8940',
    shopId: 'SHOP-1001',
    customerName: 'Ayesha Siddiqui',
    customerPhone: '+92 321 4455882',
    customerEmail: 'ayesha.designs@yahoo.com',
    specialNotes: 'High quality color output required for client pitch deck.',
    status: 'approved',
    files: [
      {
        id: 'DOC-2',
        name: 'Brand_Identity_Guidelines_Presentation.pdf',
        size: 8900000,
        type: 'application/pdf',
        estimatedPages: 12,
        uploadedAt: '2026-11-09T07:45:00Z',
      },
    ],
    preferences: {
      colorMode: 'color',
      paperSize: 'A4',
      sides: 'single',
      copies: 1,
      pageRange: 'all',
      finishingOption: 'spiral_binding',
    },
    pricingSnapshot: {
      baseRatePerPage: 25,
      copies: 1,
      pagesCount: 12,
      sidesFactor: 1,
      finishingCost: 80,
      estimatedTotal: 380,
      currency: 'PKR',
    },
    finalAmount: 380,
    paymentMethod: 'jazzcash',
    paymentStatus: 'submitted',
    paymentTransactionRef: 'JC-9920194821',
    submittedAt: '2026-11-09T07:45:00Z',
    reviewedAt: '2026-11-09T07:55:00Z',
    timeline: [
      {
        status: 'new',
        timestamp: '2026-11-09T07:45:00Z',
        note: 'Order submitted.',
      },
      {
        status: 'approved',
        timestamp: '2026-11-09T07:55:00Z',
        note: 'Reviewed documents and approved by Shop Admin.',
      },
    ],
  },
  {
    id: 'ORD-8939',
    shopId: 'SHOP-1001',
    customerName: 'Muhammad Umair',
    customerPhone: '+92 345 8899123',
    specialNotes: 'Double sided legal court lease contract.',
    status: 'printing_in_progress',
    files: [
      {
        id: 'DOC-3',
        name: 'Commercial_Rental_Agreement_Stamp.pdf',
        size: 1540000,
        type: 'application/pdf',
        estimatedPages: 6,
        uploadedAt: '2026-11-09T07:10:00Z',
      },
    ],
    preferences: {
      colorMode: 'bw',
      paperSize: 'Legal',
      sides: 'double',
      copies: 3,
      pageRange: 'all',
    },
    pricingSnapshot: {
      baseRatePerPage: 14,
      copies: 3,
      pagesCount: 3,
      sidesFactor: 1,
      finishingCost: 0,
      estimatedTotal: 126,
      currency: 'PKR',
    },
    finalAmount: 126,
    paymentMethod: 'cash',
    paymentStatus: 'verified',
    assignedPrinterId: 'PRN-1001-A',
    submittedAt: '2026-11-09T07:10:00Z',
    reviewedAt: '2026-11-09T07:20:00Z',
    timeline: [
      { status: 'new', timestamp: '2026-11-09T07:10:00Z' },
      { status: 'approved', timestamp: '2026-11-09T07:20:00Z' },
      {
        status: 'printing_in_progress',
        timestamp: '2026-11-09T07:25:00Z',
        note: 'Sent to Canon imageRUNNER C3530 Tray 3 (Legal).',
      },
    ],
  },
  {
    id: 'ORD-8938',
    shopId: 'SHOP-1001',
    customerName: 'Sara Qureshi',
    customerPhone: '+92 300 2341990',
    status: 'completed_handover',
    files: [
      {
        id: 'DOC-4',
        name: 'Medical_Lab_Reports_BloodWork.pdf',
        size: 820000,
        type: 'application/pdf',
        estimatedPages: 4,
        uploadedAt: '2026-11-08T16:30:00Z',
      },
    ],
    preferences: {
      colorMode: 'bw',
      paperSize: 'A4',
      sides: 'single',
      copies: 1,
      pageRange: 'all',
    },
    pricingSnapshot: {
      baseRatePerPage: 5,
      copies: 1,
      pagesCount: 4,
      sidesFactor: 1,
      finishingCost: 0,
      estimatedTotal: 20,
      currency: 'PKR',
    },
    finalAmount: 20,
    paymentMethod: 'cash',
    paymentStatus: 'verified',
    submittedAt: '2026-11-08T16:30:00Z',
    completedAt: '2026-11-08T16:42:00Z',
    timeline: [
      { status: 'new', timestamp: '2026-11-08T16:30:00Z' },
      { status: 'approved', timestamp: '2026-11-08T16:32:00Z' },
      { status: 'printing_completed', timestamp: '2026-11-08T16:36:00Z' },
      { status: 'completed_handover', timestamp: '2026-11-08T16:42:00Z', note: 'Customer collected print at counter.' },
    ],
  },
  {
    id: 'ORD-8937',
    shopId: 'SHOP-1001',
    customerName: 'Imran Bashir',
    customerPhone: '+92 333 1122334',
    status: 'rejected',
    rejectionReason: 'Password-protected encrypted PDF file. Please unlock before submitting.',
    files: [
      {
        id: 'DOC-5',
        name: 'Bank_Statement_Confidential_Locked.pdf',
        size: 1100000,
        type: 'application/pdf',
        estimatedPages: 5,
        uploadedAt: '2026-11-08T14:10:00Z',
      },
    ],
    preferences: {
      colorMode: 'bw',
      paperSize: 'A4',
      sides: 'single',
      copies: 2,
      pageRange: 'all',
    },
    pricingSnapshot: {
      baseRatePerPage: 5,
      copies: 2,
      pagesCount: 5,
      sidesFactor: 1,
      finishingCost: 0,
      estimatedTotal: 50,
      currency: 'PKR',
    },
    finalAmount: 50,
    paymentMethod: 'cash',
    paymentStatus: 'failed',
    submittedAt: '2026-11-08T14:10:00Z',
    timeline: [
      { status: 'new', timestamp: '2026-11-08T14:10:00Z' },
      {
        status: 'rejected',
        timestamp: '2026-11-08T14:18:00Z',
        note: 'Rejected: Password protected file.',
      },
    ],
  },
  {
    id: 'ORD-8936',
    shopId: 'SHOP-1001',
    customerName: 'Kashif Mehmood',
    customerPhone: '+92 301 7722119',
    status: 'printing_failed',
    printingFailureReason: 'Paper jam in internal duplexer unit. Technician clearing rollers.',
    files: [
      {
        id: 'DOC-6',
        name: 'Company_Tax_Returns_2025.pdf',
        size: 2100000,
        type: 'application/pdf',
        estimatedPages: 14,
        uploadedAt: '2026-11-08T11:00:00Z',
      },
    ],
    preferences: {
      colorMode: 'bw',
      paperSize: 'A4',
      sides: 'double',
      copies: 1,
      pageRange: 'all',
    },
    pricingSnapshot: {
      baseRatePerPage: 8,
      copies: 1,
      pagesCount: 7,
      sidesFactor: 1,
      finishingCost: 0,
      estimatedTotal: 56,
      currency: 'PKR',
    },
    finalAmount: 56,
    paymentMethod: 'easypaisa',
    paymentStatus: 'verified',
    assignedPrinterId: 'PRN-1001-A',
    submittedAt: '2026-11-08T11:00:00Z',
    timeline: [
      { status: 'new', timestamp: '2026-11-08T11:00:00Z' },
      { status: 'approved', timestamp: '2026-11-08T11:05:00Z' },
      {
        status: 'printing_failed',
        timestamp: '2026-11-08T11:12:00Z',
        note: 'Printer error: Jam in duplexer.',
      },
    ],
  },

  // SHOP-1002 Orders (isolated tenant)
  {
    id: 'ORD-7201',
    shopId: 'SHOP-1002',
    customerName: 'Fahad Mustafa',
    customerPhone: '+92 321 7890123',
    status: 'new',
    files: [
      {
        id: 'DOC-7',
        name: 'Restaurant_Takeaway_Menu_A3.pdf',
        size: 5600000,
        type: 'application/pdf',
        estimatedPages: 2,
        uploadedAt: '2026-11-09T09:00:00Z',
      },
    ],
    preferences: {
      colorMode: 'color',
      paperSize: 'A3',
      sides: 'single',
      copies: 25,
      pageRange: 'all',
      finishingOption: 'lamination',
    },
    pricingSnapshot: {
      baseRatePerPage: 60,
      copies: 25,
      pagesCount: 2,
      sidesFactor: 1,
      finishingCost: 1250,
      estimatedTotal: 4250,
      currency: 'PKR',
    },
    finalAmount: 4250,
    paymentMethod: 'online',
    paymentStatus: 'submitted',
    submittedAt: '2026-11-09T09:00:00Z',
    timeline: [{ status: 'new', timestamp: '2026-11-09T09:00:00Z' }],
  },
];

// Seed Printers
const SEED_PRINTERS: Printer[] = [
  {
    id: 'PRN-1001-A',
    shopId: 'SHOP-1001',
    name: 'Canon imageRUNNER ADVANCE C3530',
    model: 'iR-ADV C3530i III',
    type: 'Multifunction Digital Press',
    connectionStatus: 'online',
    isDefault: true,
    supportedSizes: ['A4', 'A3', 'Legal', 'Letter'],
    tonerLevelBlack: 84,
    tonerLevelColor: 72,
    paperLevel: 90,
  },
  {
    id: 'PRN-1001-B',
    shopId: 'SHOP-1001',
    name: 'HP LaserJet Enterprise M608dn',
    model: 'LaserJet M608',
    type: 'Laser',
    connectionStatus: 'ready',
    isDefault: false,
    supportedSizes: ['A4', 'Legal'],
    tonerLevelBlack: 62,
    tonerLevelColor: 0,
    paperLevel: 45,
  },
  {
    id: 'PRN-1002-A',
    shopId: 'SHOP-1002',
    name: 'Epson SureColor P7000 Pro Photo',
    model: 'SC-P7000',
    type: 'Inkjet',
    connectionStatus: 'online',
    isDefault: true,
    supportedSizes: ['A4', 'A3', 'Custom'],
    tonerLevelBlack: 95,
    tonerLevelColor: 88,
    paperLevel: 80,
  },
];

// Seed Audit Logs
const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    userId: 'USR-SUPER',
    userName: 'Platform Super Admin',
    action: 'Shop Registration Verified',
    details: 'Verified and onboarded Metro Digital Graphics & Copy (SHOP-1002).',
    timestamp: '2026-02-15T12:05:00Z',
    severity: 'info',
  },
  {
    id: 'AUD-002',
    shopId: 'SHOP-1001',
    userId: 'USR-SHOP-1',
    userName: 'Tariq Mehmood',
    action: 'QR Code Revocation & Replacement',
    details: 'Revoked QR-1001-A due to faded printed counter stand; issued replacement QR-1001-B.',
    timestamp: '2026-04-02T14:25:00Z',
    severity: 'warning',
  },
  {
    id: 'AUD-003',
    shopId: 'SHOP-1001',
    userId: 'USR-SHOP-1',
    userName: 'Tariq Mehmood',
    action: 'Pricing Update',
    details: 'Updated A4 Colour Single-Sided price from PKR 20 to PKR 25.',
    timestamp: '2026-03-01T00:00:00Z',
    severity: 'info',
  },
  {
    id: 'AUD-004',
    userId: 'USR-SUPER',
    userName: 'Platform Super Admin',
    action: 'Shop Account Suspended',
    details: 'Suspended Varsity Campus Xerox & Print (SHOP-1003) due to expired subscription.',
    timestamp: '2026-03-01T08:30:00Z',
    severity: 'alert',
  },
];

// Seed Notifications
const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-1',
    targetRole: 'super_admin',
    title: 'New Shop Onboarding Request',
    message: 'Falcon Color Labs (Rawalpindi) submitted verification documents.',
    timestamp: '2026-11-09T09:30:00Z',
    read: false,
    type: 'system',
  },
  {
    id: 'NOTIF-2',
    targetRole: 'shop_admin',
    targetShopId: 'SHOP-1001',
    title: 'Incoming Print Job #ORD-8941',
    message: 'Hamza Naveed uploaded 18-page thesis document via counter QR code.',
    timestamp: '2026-11-09T08:15:00Z',
    read: false,
    type: 'order',
  },
  {
    id: 'NOTIF-3',
    targetRole: 'shop_admin',
    targetShopId: 'SHOP-1001',
    title: 'JazzCash Payment Received',
    message: 'Customer verified PKR 380 for Order #ORD-8940.',
    timestamp: '2026-11-09T07:50:00Z',
    read: true,
    type: 'payment',
  },
];

// Seed Support Tickets
const SEED_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-101',
    shopId: 'SHOP-1001',
    shopName: 'Apex QuickPrint Express',
    subject: 'Assistance setting up network printer port over static IP',
    category: 'hardware',
    priority: 'medium',
    status: 'in_progress',
    messages: [
      {
        sender: 'Tariq Mehmood',
        text: 'Hello Super Admin, our new Canon C3530 requires raw port 9100 configuration. How do we test queue communication?',
        timestamp: '2026-11-08T10:00:00Z',
      },
      {
        sender: 'Platform Super Admin',
        text: 'Hi Tariq, please use the Test Connection interface in the Printer Settings module. The local spooler proxy supports direct TCP/IP handshakes.',
        timestamp: '2026-11-08T11:20:00Z',
        isAdminReply: true,
      },
    ],
    createdAt: '2026-11-08T10:00:00Z',
    updatedAt: '2026-11-08T11:20:00Z',
  },
];

// Storage Helper
class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`Error reading key ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving key ${key} to storage:`, e);
    }
  }

  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.SHOPS)) {
      this.setItem(STORAGE_KEYS.SHOPS, SEED_SHOPS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QR_CODES)) {
      this.setItem(STORAGE_KEYS.QR_CODES, SEED_QR_CODES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.setItem(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      this.setItem(STORAGE_KEYS.SERVICES, SEED_SERVICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRICING)) {
      this.setItem(STORAGE_KEYS.PRICING, SEED_PRICING);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADDITIONAL_OPTIONS)) {
      this.setItem(STORAGE_KEYS.ADDITIONAL_OPTIONS, SEED_ADDITIONAL_OPTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      this.setItem(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRINTERS)) {
      this.setItem(STORAGE_KEYS.PRINTERS, SEED_PRINTERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
      this.setItem(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTION_PLANS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      this.setItem(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, DEMO_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[1]); // Default to Apex Shop Admin
    }
  }

  public resetAllData() {
    this.setItem(STORAGE_KEYS.SHOPS, SEED_SHOPS);
    this.setItem(STORAGE_KEYS.QR_CODES, SEED_QR_CODES);
    this.setItem(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    this.setItem(STORAGE_KEYS.SERVICES, SEED_SERVICES);
    this.setItem(STORAGE_KEYS.PRICING, SEED_PRICING);
    this.setItem(STORAGE_KEYS.ADDITIONAL_OPTIONS, SEED_ADDITIONAL_OPTIONS);
    this.setItem(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    this.setItem(STORAGE_KEYS.PRINTERS, SEED_PRINTERS);
    this.setItem(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTION_PLANS);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    this.setItem(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    this.setItem(STORAGE_KEYS.USERS, DEMO_USERS);
  }

  // Users Management
  public getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  // Current User / Session
  public getCurrentUser(): User {
    return this.getItem<User>(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[1]);
  }

  public setCurrentUser(user: User): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Shop Categories Management (Multiple Categories Per Shop)
  public getCategories(shopId?: string): ShopCategory[] {
    const categories = this.getItem<ShopCategory[]>(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    if (!shopId) return categories;
    return categories
      .filter((c) => c.shopId === shopId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getCategoryById(id: string): ShopCategory | undefined {
    return this.getCategories().find((c) => c.id === id);
  }

  public saveCategory(category: ShopCategory): void {
    const categories = this.getItem<ShopCategory[]>(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    const index = categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);

    // Also update shop's categoryIds list if not present
    const shop = this.getShopById(category.shopId);
    if (shop) {
      const existingIds = shop.categoryIds || [];
      if (!existingIds.includes(category.id)) {
        this.updateShop(shop.id, { categoryIds: [...existingIds, category.id] });
      }
    }

    this.addAuditLog({
      shopId: category.shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'Category Updated',
      details: `${index >= 0 ? 'Updated' : 'Created'} category "${category.name}" (Status: ${category.isActive ? 'Active' : 'Inactive'})`,
      severity: 'info',
    });
  }

  public deleteCategory(id: string, shopId: string): void {
    const categories = this.getItem<ShopCategory[]>(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    const filtered = categories.filter((c) => !(c.id === id && c.shopId === shopId));
    this.setItem(STORAGE_KEYS.CATEGORIES, filtered);

    // Update shop's categoryIds
    const shop = this.getShopById(shopId);
    if (shop && shop.categoryIds) {
      this.updateShop(shopId, {
        categoryIds: shop.categoryIds.filter((cid) => cid !== id),
      });
    }

    this.addAuditLog({
      shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'Category Deleted',
      details: `Deleted category ID: ${id}`,
      severity: 'warning',
    });
  }

  public toggleCategoryActive(id: string, shopId: string): void {
    const categories = this.getItem<ShopCategory[]>(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    const category = categories.find((c) => c.id === id && c.shopId === shopId);
    if (category) {
      category.isActive = !category.isActive;
      this.setItem(STORAGE_KEYS.CATEGORIES, categories);
      this.addAuditLog({
        shopId,
        userId: this.getCurrentUser().id,
        userName: this.getCurrentUser().name,
        action: 'Category Status Changed',
        details: `Category "${category.name}" is now ${category.isActive ? 'Active' : 'Inactive'}`,
        severity: 'info',
      });
    }
  }

  // Shop Owner Authentication
  public authenticateShopOwner(identifier: string, passwordAttempt: string): AuthResult {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = passwordAttempt.trim();

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        reason: 'invalid_credentials',
        message: 'Username/Email and password are required.',
      };
    }

    const users = this.getUsers();
    const user = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!user) {
      return {
        success: false,
        reason: 'invalid_credentials',
        message: 'Invalid credentials. No account found matching this username or email.',
      };
    }

    if (user.role !== 'shop_admin') {
      return {
        success: false,
        reason: 'invalid_credentials',
        message: 'This portal is strictly for Printing Shop Owners. Platform Super Admins must use the administrative console.',
      };
    }

    if (user.password !== cleanPass) {
      return {
        success: false,
        reason: 'invalid_credentials',
        message: 'Invalid credentials. The password you entered is incorrect.',
      };
    }

    // Check account status
    if (user.status === 'deactivated') {
      return {
        success: false,
        reason: 'account_deactivated',
        message: 'Your shop administrator account has been deactivated. Please contact platform administration.',
      };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        reason: 'account_suspended',
        message: 'Your shop administrator account is currently suspended. Please contact platform support.',
      };
    }

    // Check associated shop
    if (!user.shopId) {
      return {
        success: false,
        reason: 'not_found',
        message: 'No print shop is associated with this administrator account.',
      };
    }

    const shop = this.getShopById(user.shopId);
    if (!shop) {
      return {
        success: false,
        reason: 'not_found',
        message: `Associated shop (${user.shopId}) could not be located in the platform database.`,
      };
    }

    if (shop.status === 'suspended') {
      return {
        success: false,
        reason: 'shop_suspended',
        shopId: shop.id,
        shopName: shop.name,
        message: `Your shop (${shop.name} - ${shop.id}) is currently suspended by Platform Administration. Operational dashboard access is restricted.`,
      };
    }

    if (shop.status === 'deactivated') {
      return {
        success: false,
        reason: 'account_deactivated',
        shopId: shop.id,
        shopName: shop.name,
        message: `Your shop (${shop.name} - ${shop.id}) has been permanently deactivated. Access is revoked.`,
      };
    }

    // Authenticated!
    user.lastLoginAt = new Date().toISOString();
    this.saveUser(user);
    this.setCurrentUser(user);

    this.addAuditLog({
      shopId: shop.id,
      userId: user.id,
      userName: user.name,
      action: 'Shop Owner Sign In',
      details: `Shop Owner "${user.name}" (${user.username || user.email}) signed in to ${shop.name} (${shop.id})`,
      severity: 'info',
    });

    return {
      success: true,
      user,
      shop,
    };
  }

  // Demonstration Password Reset Flow
  public requestPasswordReset(identifier: string): { success: boolean; token?: string; message: string } {
    const cleanId = identifier.trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!user) {
      return {
        success: false,
        message: 'No shop owner account found with that username or email address.',
      };
    }

    const resetToken = `RST-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      token: resetToken,
      message: `Password reset request authorized. In demonstration mode, use reset code: ${resetToken}`,
    };
  }

  public resetPasswordWithToken(
    identifier: string,
    token: string,
    newPass: string
  ): { success: boolean; message: string } {
    const cleanId = identifier.trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!user) {
      return { success: false, message: 'Account not found.' };
    }

    if (!token || !token.startsWith('RST-')) {
      return { success: false, message: 'Invalid or expired recovery code.' };
    }

    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    user.password = newPass;
    this.saveUser(user);

    this.addAuditLog({
      shopId: user.shopId,
      userId: user.id,
      userName: user.name,
      action: 'Password Reset',
      details: `Password was reset successfully for account ${user.username || user.email}`,
      severity: 'info',
    });

    return { success: true, message: 'Your password has been successfully updated! You can now sign in.' };
  }

  // Theme
  public getTheme(): 'light' | 'dark' {
    return this.getItem<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light');
  }

  public setTheme(theme: 'light' | 'dark'): void {
    this.setItem(STORAGE_KEYS.THEME, theme);
  }

  // Shops
  public getShops(): Shop[] {
    return this.getItem<Shop[]>(STORAGE_KEYS.SHOPS, SEED_SHOPS);
  }

  public getShopById(shopId: string): Shop | undefined {
    return this.getShops().find((s) => s.id === shopId);
  }

  public getShopByToken(token: string): { shop?: Shop; qrRecord?: QRCodeRecord } {
    const qrs = this.getQRCodes();
    const qrRecord = qrs.find((q) => q.token === token);
    if (!qrRecord) return {};
    const shop = this.getShopById(qrRecord.shopId);
    return { shop, qrRecord };
  }

  public createShop(
    shopData: Omit<Shop, 'id' | 'createdAt' | 'activeQrId' | 'activeQrToken'> & {
      customUsername?: string;
      customPassword?: string;
      categoryNames?: string[];
    }
  ): { shop: Shop; adminUser: User; tempPass: string } {
    const shops = this.getShops();
    const nextNum = 1001 + shops.length;
    const shopId = `SHOP-${nextNum}`;
    const qrId = `QR-${nextNum}-A`;
    const token = `tok_${shopData.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10)}_${Math.random().toString(36).slice(2, 6)}`;

    // Create default or custom categories for new shop
    const defaultCatNames = shopData.categoryNames && shopData.categoryNames.length > 0
      ? shopData.categoryNames
      : ['Document & Thesis Printing', 'Flyers & Color Posters', 'Binding & Finishing'];

    const newCategories: ShopCategory[] = defaultCatNames.map((cName, idx) => ({
      id: `CAT-${nextNum}-${idx + 1}`,
      shopId,
      name: cName,
      description: `Comprehensive printing and processing services for ${cName.toLowerCase()}.`,
      icon: idx === 0 ? 'FileText' : idx === 1 ? 'Maximize2' : 'BookOpen',
      isActive: true,
      displayOrder: idx + 1,
    }));

    const allCategories = this.getCategories();
    this.setItem(STORAGE_KEYS.CATEGORIES, [...allCategories, ...newCategories]);

    const username = shopData.customUsername?.trim() || `${shopData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}admin`;
    const tempPass = shopData.customPassword?.trim() || `Print@${Math.floor(1000 + Math.random() * 9000)}`;

    const newShop: Shop = {
      ...shopData,
      id: shopId,
      createdAt: new Date().toISOString(),
      activeQrId: qrId,
      activeQrToken: token,
      operatingHours: shopData.operatingHours || '09:00 AM - 09:00 PM',
      categoryIds: newCategories.map((c) => c.id),
      adminUsername: username,
    };

    const newQr: QRCodeRecord = {
      id: qrId,
      shopId,
      token,
      status: 'active',
      createdAt: new Date().toISOString(),
      scansCount: 0,
    };

    const adminUser: User = {
      id: `USR-${shopId}`,
      name: shopData.ownerName,
      email: shopData.email || `admin.${shopId.toLowerCase()}@printflow.io`,
      username,
      password: tempPass,
      status: 'active',
      role: 'shop_admin',
      shopId,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };

    shops.unshift(newShop);
    this.setItem(STORAGE_KEYS.SHOPS, shops);

    // Save admin user into users list
    const users = this.getUsers();
    users.push(adminUser);
    this.setItem(STORAGE_KEYS.USERS, users);

    const qrs = this.getQRCodes();
    qrs.push(newQr);
    this.setItem(STORAGE_KEYS.QR_CODES, qrs);

    // Seed initial default services for this shop linked to categories
    const defaultServices: PrintingService[] = [
      {
        id: `SRV-${shopId}-1`,
        shopId,
        categoryId: newCategories[0]?.id,
        name: 'A4 Document Laser Print (B&W)',
        category: 'standard',
        paperSize: 'A4',
        colorMode: 'bw',
        sides: 'both',
        basePrice: 5,
        isActive: true,
        description: 'Standard black and white printing.',
      },
      {
        id: `SRV-${shopId}-2`,
        shopId,
        categoryId: newCategories[0]?.id,
        name: 'A4 Colour Digital Print',
        category: 'standard',
        paperSize: 'A4',
        colorMode: 'color',
        sides: 'both',
        basePrice: 25,
        isActive: true,
        description: 'Vibrant color print on quality paper.',
      },
    ];
    const allServices = this.getServices();
    this.setItem(STORAGE_KEYS.SERVICES, [...allServices, ...defaultServices]);

    // Seed initial pricing rules
    const defaultPricing: PricingRule[] = [
      {
        id: `PRC-${shopId}-1`,
        shopId,
        paperSize: 'A4',
        colorMode: 'bw',
        pricePerPageSingle: 5,
        pricePerPageDouble: 8,
        updatedAt: new Date().toISOString(),
      },
      {
        id: `PRC-${shopId}-2`,
        shopId,
        paperSize: 'A4',
        colorMode: 'color',
        pricePerPageSingle: 25,
        pricePerPageDouble: 45,
        updatedAt: new Date().toISOString(),
      },
    ];
    const allPricing = this.getPricingRules();
    this.setItem(STORAGE_KEYS.PRICING, [...allPricing, ...defaultPricing]);

    // Audit log
    this.addAuditLog({
      shopId,
      userId: 'USR-SUPER',
      userName: 'Platform Super Admin',
      action: 'Shop Created',
      details: `Created new shop ${shopData.name} (${shopId}) with ${newCategories.length} categories. Admin account provisioned: ${username} (${adminUser.email})`,
      severity: 'info',
    });

    return { shop: newShop, adminUser, tempPass };
  }

  public updateShop(shopId: string, updates: Partial<Shop>): Shop {

    const shops = this.getShops();
    const index = shops.findIndex((s) => s.id === shopId);
    if (index === -1) throw new Error(`Shop ${shopId} not found`);

    shops[index] = { ...shops[index], ...updates };
    this.setItem(STORAGE_KEYS.SHOPS, shops);

    this.addAuditLog({
      shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'Shop Profile Updated',
      details: `Updated details for ${shops[index].name}`,
      severity: 'info',
    });

    return shops[index];
  }

  public setShopStatus(shopId: string, status: ShopStatus): Shop {
    return this.updateShop(shopId, { status });
  }

  // QR Code Management (Core Workflow)
  public getQRCodes(shopId?: string): QRCodeRecord[] {
    const qrs = this.getItem<QRCodeRecord[]>(STORAGE_KEYS.QR_CODES, SEED_QR_CODES);
    if (!shopId) return qrs;
    return qrs.filter((q) => q.shopId === shopId);
  }

  public getActiveQRCode(shopId: string): QRCodeRecord | undefined {
    return this.getQRCodes(shopId).find((q) => q.status === 'active');
  }

  public revokeQRCode(qrId: string, shopId: string): { revoked: QRCodeRecord; shop: Shop } {
    const qrs = this.getQRCodes();
    const qrIndex = qrs.findIndex((q) => q.id === qrId && q.shopId === shopId);
    if (qrIndex === -1) throw new Error('QR Code record not found or unauthorized.');

    const now = new Date().toISOString();
    qrs[qrIndex].status = 'revoked';
    qrs[qrIndex].revokedAt = now;
    this.setItem(STORAGE_KEYS.QR_CODES, qrs);

    // Update shop to note revoked status
    const shop = this.getShopById(shopId);
    if (shop) {
      shop.activeQrToken = '';
      this.updateShop(shopId, { activeQrToken: '' });
    }

    this.addAuditLog({
      shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'QR Code Revoked',
      details: `Revoked active QR Code ${qrId}. New customer requests via this token will be blocked.`,
      severity: 'warning',
    });

    return { revoked: qrs[qrIndex], shop: shop! };
  }

  public generateReplacementQRCode(shopId: string): { newQr: QRCodeRecord; shop: Shop } {
    const qrs = this.getQRCodes();
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error(`Shop ${shopId} not found`);

    const shopQrs = qrs.filter((q) => q.shopId === shopId);
    const suffix = String.fromCharCode(65 + shopQrs.length); // A, B, C, D...
    const newId = `QR-${shopId.replace('SHOP-', '')}-${suffix}`;
    const newToken = `tok_${shop.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 8)}_${Math.random().toString(36).slice(2, 7)}`;

    // Set replacement ref on the latest revoked QR
    const lastRevoked = shopQrs.reverse().find((q) => q.status === 'revoked');
    if (lastRevoked) {
      const idx = qrs.findIndex((q) => q.id === lastRevoked.id);
      if (idx !== -1) {
        qrs[idx].status = 'replaced';
        qrs[idx].replacementRef = newId;
      }
    }

    const newQr: QRCodeRecord = {
      id: newId,
      shopId,
      token: newToken,
      status: 'active',
      createdAt: new Date().toISOString(),
      scansCount: 0,
    };

    qrs.push(newQr);
    this.setItem(STORAGE_KEYS.QR_CODES, qrs);

    const updatedShop = this.updateShop(shopId, {
      activeQrId: newId,
      activeQrToken: newToken,
    });

    this.addAuditLog({
      shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'Replacement QR Code Issued',
      details: `Generated new replacement QR Code ${newId} (token: ${newToken}). Existing orders and pricing preserved intact.`,
      severity: 'info',
    });

    return { newQr, shop: updatedShop };
  }

  public recordQRScan(token: string): void {
    const qrs = this.getQRCodes();
    const qr = qrs.find((q) => q.token === token);
    if (qr) {
      qr.scansCount += 1;
      this.setItem(STORAGE_KEYS.QR_CODES, qrs);
    }
  }

  // Printing Services
  public getServices(shopId?: string): PrintingService[] {
    const services = this.getItem<PrintingService[]>(STORAGE_KEYS.SERVICES, SEED_SERVICES);
    if (!shopId) return services;
    return services.filter((s) => s.shopId === shopId);
  }

  public saveService(service: PrintingService): void {
    const services = this.getServices();
    const index = services.findIndex((s) => s.id === service.id);
    if (index >= 0) {
      services[index] = service;
    } else {
      services.push(service);
    }
    this.setItem(STORAGE_KEYS.SERVICES, services);

    this.addAuditLog({
      shopId: service.shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'Printing Service Saved',
      details: `${service.isActive ? 'Enabled' : 'Disabled'}/Updated service: ${service.name}`,
      severity: 'info',
    });
  }

  public deleteService(id: string, shopId: string): void {
    const services = this.getServices();
    const filtered = services.filter((s) => !(s.id === id && s.shopId === shopId));
    this.setItem(STORAGE_KEYS.SERVICES, filtered);
  }

  // Pricing Rules
  public getPricingRules(shopId?: string): PricingRule[] {
    const pricing = this.getItem<PricingRule[]>(STORAGE_KEYS.PRICING, SEED_PRICING);
    if (!shopId) return pricing;
    return pricing.filter((p) => p.shopId === shopId);
  }

  public savePricingRule(rule: PricingRule): void {
    const pricing = this.getPricingRules();
    const index = pricing.findIndex((p) => p.id === rule.id);
    rule.updatedAt = new Date().toISOString();
    if (index >= 0) {
      pricing[index] = rule;
    } else {
      pricing.push(rule);
    }
    this.setItem(STORAGE_KEYS.PRICING, pricing);

    this.addAuditLog({
      shopId: rule.shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'Pricing Rule Changed',
      details: `Updated ${rule.paperSize} (${rule.colorMode.toUpperCase()}): Single PKR ${rule.pricePerPageSingle}, Double PKR ${rule.pricePerPageDouble}`,
      severity: 'info',
    });
  }

  // Additional Options
  public getAdditionalOptions(shopId?: string): AdditionalOption[] {
    const opts = this.getItem<AdditionalOption[]>(STORAGE_KEYS.ADDITIONAL_OPTIONS, SEED_ADDITIONAL_OPTIONS);
    if (!shopId) return opts;
    return opts.filter((o) => o.shopId === shopId);
  }

  public saveAdditionalOption(opt: AdditionalOption): void {
    const opts = this.getAdditionalOptions();
    const index = opts.findIndex((o) => o.id === opt.id);
    if (index >= 0) {
      opts[index] = opt;
    } else {
      opts.push(opt);
    }
    this.setItem(STORAGE_KEYS.ADDITIONAL_OPTIONS, opts);
  }

  // Customer Orders (Strict Tenant Isolation)
  public getOrders(shopId?: string): CustomerOrder[] {
    const orders = this.getItem<CustomerOrder[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    if (!shopId) return orders;
    return orders.filter((o) => o.shopId === shopId);
  }

  public getOrderById(orderId: string, shopId?: string): CustomerOrder | undefined {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
    if (!order) return undefined;
    if (shopId && order.shopId !== shopId) return undefined; // Tenant isolation!
    return order;
  }

  public createOrder(orderData: Omit<CustomerOrder, 'id' | 'submittedAt' | 'timeline'>): CustomerOrder {
    const orders = this.getOrders();
    const nextNum = 8942 + orders.length;
    const orderId = `ORD-${nextNum}`;
    const now = new Date().toISOString();

    const newOrder: CustomerOrder = {
      ...orderData,
      id: orderId,
      submittedAt: now,
      timeline: [
        {
          status: 'new',
          timestamp: now,
          note: `Customer ${orderData.customerName} submitted printing request with ${orderData.files.length} document(s).`,
        },
      ],
    };

    orders.unshift(newOrder);
    this.setItem(STORAGE_KEYS.ORDERS, orders);

    // Notify shop admin
    this.addNotification({
      targetRole: 'shop_admin',
      targetShopId: orderData.shopId,
      title: `New Print Order #${orderId}`,
      message: `${orderData.customerName} requested ${orderData.preferences.copies} copy of ${orderData.files.map((f) => f.name).join(', ')}.`,
      type: 'order',
    });

    this.addAuditLog({
      shopId: orderData.shopId,
      userId: 'CUSTOMER',
      userName: orderData.customerName,
      action: 'Order Placed',
      details: `New order #${orderId} submitted (Estimated Total: PKR ${orderData.pricingSnapshot.estimatedTotal})`,
      severity: 'info',
    });

    return newOrder;
  }

  public updateOrderStatus(
    orderId: string,
    shopId: string,
    status: OrderStatus,
    extra?: {
      rejectionReason?: string;
      printingFailureReason?: string;
      note?: string;
      assignedPrinterId?: string;
    }
  ): CustomerOrder {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId && o.shopId === shopId);
    if (index === -1) throw new Error('Order not found or unauthorized.');

    const now = new Date().toISOString();
    const order = orders[index];
    order.status = status;

    if (extra?.rejectionReason) order.rejectionReason = extra.rejectionReason;
    if (extra?.printingFailureReason) order.printingFailureReason = extra.printingFailureReason;
    if (extra?.assignedPrinterId) order.assignedPrinterId = extra.assignedPrinterId;

    if (status === 'approved' && !order.reviewedAt) order.reviewedAt = now;
    if (status === 'completed_handover' || status === 'printing_completed') order.completedAt = now;

    order.timeline.push({
      status,
      timestamp: now,
      note: extra?.note || extra?.rejectionReason || extra?.printingFailureReason || `Status updated to ${status}`,
    });

    this.setItem(STORAGE_KEYS.ORDERS, orders);

    this.addAuditLog({
      shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: `Order ${status.toUpperCase()}`,
      details: `Order #${orderId} moved to ${status}. ${extra?.note || ''}`,
      severity: status === 'rejected' || status === 'printing_failed' ? 'warning' : 'info',
    });

    return order;
  }

  public adjustFinalAmount(orderId: string, shopId: string, newAmount: number): CustomerOrder {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId && o.shopId === shopId);
    if (index === -1) throw new Error('Order not found or unauthorized.');

    orders[index].finalAmount = newAmount;
    this.setItem(STORAGE_KEYS.ORDERS, orders);

    this.addAuditLog({
      shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'Order Price Adjusted',
      details: `Order #${orderId} adjusted to PKR ${newAmount}`,
      severity: 'info',
    });

    return orders[index];
  }

  public updatePaymentStatus(
    orderId: string,
    shopId: string,
    status: CustomerOrder['paymentStatus'],
    transactionRef?: string
  ): CustomerOrder {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId && o.shopId === shopId);
    if (index === -1) throw new Error('Order not found or unauthorized.');

    orders[index].paymentStatus = status;
    if (transactionRef) orders[index].paymentTransactionRef = transactionRef;
    this.setItem(STORAGE_KEYS.ORDERS, orders);

    this.addAuditLog({
      shopId,
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action: 'Payment Status Updated',
      details: `Order #${orderId} payment marked as ${status.toUpperCase()}`,
      severity: 'info',
    });

    return orders[index];
  }

  // Printers
  public getPrinters(shopId?: string): Printer[] {
    const printers = this.getItem<Printer[]>(STORAGE_KEYS.PRINTERS, SEED_PRINTERS);
    if (!shopId) return printers;
    return printers.filter((p) => p.shopId === shopId);
  }

  public savePrinter(printer: Printer): void {
    const printers = this.getPrinters();
    const index = printers.findIndex((p) => p.id === printer.id);
    if (index >= 0) {
      printers[index] = printer;
    } else {
      printers.push(printer);
    }
    this.setItem(STORAGE_KEYS.PRINTERS, printers);
  }

  public deletePrinter(id: string, shopId: string): void {
    const printers = this.getPrinters();
    const filtered = printers.filter((p) => !(p.id === id && p.shopId === shopId));
    this.setItem(STORAGE_KEYS.PRINTERS, filtered);
  }

  // Subscription Plans
  public getSubscriptionPlans(): SubscriptionPlan[] {
    return this.getItem<SubscriptionPlan[]>(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTION_PLANS);
  }

  public saveSubscriptionPlan(plan: SubscriptionPlan): void {
    const plans = this.getSubscriptionPlans();
    const index = plans.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.push(plan);
    }
    this.setItem(STORAGE_KEYS.SUBSCRIPTIONS, plans);
  }

  // Audit Logs
  public getAuditLogs(shopId?: string): AuditLog[] {
    const logs = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    if (!shopId) return logs;
    return logs.filter((l) => !l.shopId || l.shopId === shopId);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200)); // Cap at 200
  }

  // Notifications
  public getNotifications(role: 'super_admin' | 'shop_admin', shopId?: string): NotificationItem[] {
    const notifs = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    return notifs.filter((n) => {
      if (role === 'super_admin') return n.targetRole === 'super_admin';
      return n.targetRole === 'shop_admin' && (!n.targetShopId || n.targetShopId === shopId);
    });
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): void {
    const notifs = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const newNotif: NotificationItem = {
      ...item,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifs.unshift(newNotif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 100));
  }

  public markNotificationRead(id: string): void {
    const notifs = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const item = notifs.find((n) => n.id === id);
    if (item) {
      item.read = true;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  public markAllNotificationsRead(role: 'super_admin' | 'shop_admin', shopId?: string): void {
    const notifs = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    notifs.forEach((n) => {
      if (role === 'super_admin' && n.targetRole === 'super_admin') n.read = true;
      if (role === 'shop_admin' && n.targetRole === 'shop_admin' && (!n.targetShopId || n.targetShopId === shopId)) {
        n.read = true;
      }
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  // Support Tickets
  public getSupportTickets(shopId?: string): SupportTicket[] {
    const tickets = this.getItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, SEED_TICKETS);
    if (!shopId) return tickets;
    return tickets.filter((t) => t.shopId === shopId);
  }

  public createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): SupportTicket {
    const tickets = this.getSupportTickets();
    const newTicket: SupportTicket = {
      ...ticket,
      id: `TCK-${100 + tickets.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tickets.unshift(newTicket);
    this.setItem(STORAGE_KEYS.TICKETS, tickets);
    return newTicket;
  }

  public addTicketReply(ticketId: string, message: { sender: string; text: string; isAdminReply?: boolean }): void {
    const tickets = this.getSupportTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.messages.push({
        ...message,
        timestamp: new Date().toISOString(),
      });
      ticket.updatedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.TICKETS, tickets);
    }
  }
}

export const storage = new StorageService();
storage.init();
