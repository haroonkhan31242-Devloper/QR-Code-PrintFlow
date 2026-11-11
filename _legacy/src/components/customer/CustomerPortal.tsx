import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { Shop, QRCodeRecord, UploadedDocument, PricingRule, AdditionalOption, ShopCategory, PrintingService } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  Sparkles,
  CreditCard,
  Building,
  Maximize2,
  BookOpen,
  Briefcase,
  Copy,
  Palette,
  GraduationCap,
  FolderOpen,
  Printer,
  Tag,
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { customerShopToken, setCustomerShopToken, setActiveView, setCustomerTrackingOrderId, addToast } = useApp();

  const [shop, setShop] = useState<Shop | null>(null);
  const [qrRecord, setQrRecord] = useState<QRCodeRecord | null>(null);
  const [isInvalidQr, setIsInvalidQr] = useState(false);
  const [isRevokedQr, setIsRevokedQr] = useState(false);

  // Shop Categories and Services
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [shopServices, setShopServices] = useState<PrintingService[]>([]);

  // Uploaded Files State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);


  // Preferences State
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'Legal'>('A4');
  const [sides, setSides] = useState<'single' | 'double'>('double');
  const [copies, setCopies] = useState<number>(1);
  const [pageRange, setPageRange] = useState<'all' | string>('all');
  const [customRange, setCustomRange] = useState('');
  const [finishingOption, setFinishingOption] = useState<string>('none');

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'jazzcash' | 'easypaisa'>('cash');

  // Review & Submit Step
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'confirmed'>('upload');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shop Rates
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [additionalOptions, setAdditionalOptions] = useState<AdditionalOption[]>([]);

  // Identify Shop from Token or Shop ID
  useEffect(() => {
    const { shop: matchedShop, qrRecord: matchedQr } = storage.getShopByToken(customerShopToken);

    if (matchedQr && matchedQr.status === 'revoked') {
      setIsRevokedQr(true);
      setIsInvalidQr(false);
      setShop(matchedShop || null);
      setQrRecord(matchedQr);
      return;
    }

    if (!matchedShop || !matchedQr || matchedQr.status !== 'active') {
      // Fallback: check if customerShopToken matches a Shop ID directly
      const fallbackShop = storage.getShopById(customerShopToken);
      if (fallbackShop) {
        const activeQr = storage.getActiveQRCode(fallbackShop.id);
        if (activeQr) {
          setShop(fallbackShop);
          setQrRecord(activeQr);
          setIsInvalidQr(false);
          setIsRevokedQr(false);
          setPricingRules(storage.getPricingRules(fallbackShop.id));
          setAdditionalOptions(storage.getAdditionalOptions(fallbackShop.id));
          setShopCategories(storage.getCategories(fallbackShop.id).filter((c) => c.isActive));
          setShopServices(storage.getServices(fallbackShop.id).filter((s) => s.isActive));
          return;
        } else {
          setIsRevokedQr(true);
          setShop(fallbackShop);
          return;
        }
      }

      setIsInvalidQr(true);
      setIsRevokedQr(false);
      setShop(null);
      setQrRecord(null);
      return;
    }

    setIsInvalidQr(false);
    setIsRevokedQr(false);
    setShop(matchedShop);
    setQrRecord(matchedQr);
    setPricingRules(storage.getPricingRules(matchedShop.id));
    setAdditionalOptions(storage.getAdditionalOptions(matchedShop.id));
    setShopCategories(storage.getCategories(matchedShop.id).filter((c) => c.isActive));
    setShopServices(storage.getServices(matchedShop.id).filter((s) => s.isActive));
  }, [customerShopToken]);


  // File Upload Handlers
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newDocs: UploadedDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'doc'];
      if (!ext || !allowed.includes(ext)) {
        addToast('error', 'Unsupported File Format', `"${file.name}" is not supported. Use PDF, DOCX, or images.`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        addToast('error', 'File Too Large', `"${file.name}" exceeds 50MB limit.`);
        continue;
      }

      // Estimate page count realistically based on size or PDF hint
      let pages = 1;
      if (file.type.includes('pdf')) {
        pages = Math.max(1, Math.min(60, Math.round(file.size / (180 * 1024))));
      } else if (file.name.includes('doc')) {
        pages = Math.max(1, Math.round(file.size / (120 * 1024)));
      }

      newDocs.push({
        id: `DOC-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        estimatedPages: pages,
        uploadedAt: new Date().toISOString(),
      });
    }

    setUploadedFiles((prev) => [...prev, ...newDocs]);
    addToast('success', `Added ${newDocs.length} file(s) for printing`);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Dynamic Price Calculation
  const calculateEstimate = () => {
    if (!shop || uploadedFiles.length === 0) return { total: 0, baseRate: 0, finishingCost: 0, sheetsCount: 0 };

    const totalRawPages = uploadedFiles.reduce((sum, f) => sum + f.estimatedPages, 0);

    // Find rule for chosen paper size and color mode
    const rule = pricingRules.find(
      (r) => r.paperSize === paperSize && r.colorMode === colorMode
    ) || { pricePerPageSingle: colorMode === 'color' ? 25 : 5, pricePerPageDouble: colorMode === 'color' ? 45 : 8 };

    const baseRate = sides === 'double' ? rule.pricePerPageDouble : rule.pricePerPageSingle;
    const sheetsCount = sides === 'double' ? Math.ceil(totalRawPages / 2) : totalRawPages;

    // Additional option fee
    let finishingCost = 0;
    if (finishingOption !== 'none') {
      const opt = additionalOptions.find((o) => o.type === finishingOption);
      if (opt && opt.enabled) {
        finishingCost = opt.price * copies;
      }
    }

    const printCost = sheetsCount * baseRate * copies;
    const total = printCost + finishingCost;

    return { total, baseRate, finishingCost, sheetsCount, totalRawPages };
  };

  const pricing = calculateEstimate();

  // Submission
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    if (uploadedFiles.length === 0) {
      addToast('error', 'Please upload at least one document');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      addToast('error', 'Contact Information Required', 'Please provide your name and phone number for counter collection.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = storage.createOrder({
        shopId: shop.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        specialNotes: specialNotes.trim(),
        status: 'new',
        files: uploadedFiles,
        preferences: {
          colorMode,
          paperSize,
          sides,
          copies: Math.max(1, copies),
          pageRange: pageRange === 'all' ? 'all' : customRange || 'all',
          finishingOption: finishingOption !== 'none' ? finishingOption : undefined,
        },
        pricingSnapshot: {
          baseRatePerPage: pricing.baseRate,
          copies,
          pagesCount: pricing.sheetsCount,
          sidesFactor: sides === 'double' ? 1 : 1,
          finishingCost: pricing.finishingCost,
          estimatedTotal: pricing.total,
          currency: 'PKR',
        },
        finalAmount: pricing.total,
        paymentMethod,
        paymentStatus: 'pending',
      });

      setConfirmedOrderId(order.id);
      setCustomerTrackingOrderId(order.id);
      setCurrentStep('confirmed');
      addToast('success', `Printing Request Placed: #${order.id}`, 'Shop administrator has been notified.');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // REVOKED QR SCREEN (Section 6.1 requirement)
  if (isRevokedQr) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Counter QR Code Has Been Revoked
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            This QR code stand is no longer active for{' '}
            <strong>{shop?.name || 'this shop'}</strong>. New customer printing requests through this code have been blocked for security.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 text-left border border-slate-200 dark:border-slate-700">
            <strong className="block font-bold text-slate-900 dark:text-white mb-1">
              What should you do?
            </strong>
            <span>
              Please ask the shop operator at the physical counter for their newly issued QR code or updated counter stand.
            </span>
          </div>

          <button
            onClick={() => {
              setCustomerShopToken('tok_apex_gulberg_92a');
            }}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Switch to Active Demonstration QR
          </button>
        </div>
      </div>
    );
  }

  // INVALID QR SCREEN
  if (isInvalidQr || !shop) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Unrecognized Shop QR Code
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            We could not locate an active print shop matching token: <code className="font-mono">{customerShopToken}</code>.
          </p>

          <button
            onClick={() => setCustomerShopToken('tok_apex_gulberg_92a')}
            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Load Sample Shop (Apex QuickPrint)
          </button>
        </div>
      </div>
    );
  }

  // DEACTIVATED OR SUSPENDED SHOP CHECK
  if (shop.status === 'suspended' || shop.status === 'deactivated') {
    const isDeactivated = shop.status === 'deactivated';
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className={`bg-white dark:bg-slate-900 border rounded-3xl p-8 shadow-xl ${
          isDeactivated
            ? 'border-rose-300 dark:border-rose-800'
            : 'border-amber-300 dark:border-amber-800'
        }`}>
          <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
            isDeactivated
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
          }`}>
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 ${
            isDeactivated
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
          }`}>
            Shop {shop.status}
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {shop.name} is Currently {isDeactivated ? 'Deactivated' : 'Suspended'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
            {isDeactivated
              ? 'This printing shop has been deactivated by Platform Administration. Document uploads and digital orders are currently disabled for this counter.'
              : 'This printing shop is temporarily paused for administrative maintenance. Please check back shortly or visit the counter directly.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveView('home')}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Public Home
            </button>
            <button
              onClick={() => setActiveView('track_order')}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Track Previous Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ORDER CONFIRMATION VIEW (Section 6.6)
  if (currentStep === 'confirmed') {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono mb-2">
            #{confirmedOrderId}
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Printing Request Submitted!
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
            Your document has been sent to <strong>{shop.name}</strong>. The shop operator will review your specifications shortly.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Destination Shop:</span>
              <span className="font-bold text-slate-900 dark:text-white">{shop.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Recipient Name:</span>
              <span className="font-medium text-slate-900 dark:text-white">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated Total:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                PKR {pricing.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Initial Status:</span>
              <span className="text-amber-600 font-semibold">Awaiting Shop Review</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setCustomerTrackingOrderId(confirmedOrderId);
                setActiveView('track_order');
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Track Live Order Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setUploadedFiles([]);
                setCurrentStep('upload');
              }}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Submit Another Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Shop Identity Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Verified Print Shop
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] text-emerald-600 font-semibold">Open for Printing</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {shop.name}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{shop.address}, {shop.city}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 block">Counter Hours:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {shop.operatingHours}
            </span>
          </div>
        </div>
      </div>

      {/* Multiple Categories Filter Section */}
      {shopCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Shop Departments & Printing Specialties
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Select a department below to explore available printing formats & rates
              </p>
            </div>
            {selectedCategoryId !== 'all' && (
              <button
                onClick={() => setSelectedCategoryId('all')}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Reset to All
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategoryId === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Specialties</span>
              <span className="text-[10px] opacity-75 font-mono">({shopServices.length})</span>
            </button>

            {shopCategories.map((cat) => {
              const count = shopServices.filter((s) => s.categoryId === cat.id).length;
              const isSelected = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    // Helpful auto-defaults if category indicates large format or finishing
                    if (cat.name.toLowerCase().includes('large') || cat.name.toLowerCase().includes('cad') || cat.name.toLowerCase().includes('poster')) {
                      setPaperSize('A3');
                    } else if (cat.name.toLowerCase().includes('binding')) {
                      setFinishingOption('spiral_binding');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Category Description Banner */}
          {selectedCategoryId !== 'all' && (
            <div className="mt-2 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs">
              {(() => {
                const activeCat = shopCategories.find((c) => c.id === selectedCategoryId);
                if (!activeCat) return null;
                const relevantServices = shopServices.filter((s) => s.categoryId === activeCat.id);

                return (
                  <div>
                    <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
                      <span>{activeCat.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-mono">
                        Active Category
                      </span>
                    </div>
                    {activeCat.description && (
                      <p className="text-indigo-900/80 dark:text-indigo-300/80 text-[11px] leading-relaxed mb-2">
                        {activeCat.description}
                      </p>
                    )}
                    {relevantServices.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {relevantServices.map((srv) => (
                          <span
                            key={srv.id}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-indigo-200/50 dark:border-indigo-900"
                          >
                            <span className="font-medium">{srv.name}</span>
                            <span className="text-slate-400 font-mono">PKR {srv.basePrice}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Document Upload */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              1. Upload Your Documents
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports PDF, Word Documents, and High-Resolution JPG/PNG photos
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Max 50MB
          </span>
        </div>

        {/* Drag Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFilesSelected(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
          }`}
          onClick={() => {
            const el = document.getElementById('customer-file-input');
            if (el) el.click();
          }}
        >
          <input
            id="customer-file-input"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-2.5" />
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            Tap to upload files or drag & drop here
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Instant upload from your mobile phone storage or iCloud/Drive
          </p>
        </div>

        {/* Uploaded Files Preview List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Uploaded Files ({uploadedFiles.length}):
            </span>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • ~{file.estimatedPages} page(s)
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remove document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Printing Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            2. Choose Printing Preferences
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Configured specifically according to {shop.name}'s available equipment
          </p>
        </div>

        {/* Color Mode */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Print Color Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setColorMode('bw')}
              className={`p-3 rounded-xl border text-left transition-all ${
                colorMode === 'bw'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-bold ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className="font-semibold">Black & White</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Economical 1200 DPI Laser</div>
            </button>

            <button
              type="button"
              onClick={() => setColorMode('color')}
              className={`p-3 rounded-xl border text-left transition-all ${
                colorMode === 'color'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-bold ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className="font-semibold text-purple-600 dark:text-purple-400">Full Colour</div>
              <div className="text-[11px] text-slate-400 mt-0.5">High Quality Digital Color</div>
            </button>
          </div>
        </div>

        {/* Paper Size & Sides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Paper Size
            </label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
            >
              <option value="A4">A4 (Standard 8.27 x 11.69 in)</option>
              <option value="A3">A3 (Poster / Ledger 11.7 x 16.5 in)</option>
              <option value="Legal">Legal Court Paper (8.5 x 14 in)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sides
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSides('double')}
                className={`py-2 px-3 rounded-xl border text-center font-medium ${
                  sides === 'double'
                    ? 'border-indigo-600 bg-indigo-600 text-white font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Double-Sided
              </button>
              <button
                type="button"
                onClick={() => setSides('single')}
                className={`py-2 px-3 rounded-xl border text-center font-medium ${
                  sides === 'single'
                    ? 'border-indigo-600 bg-indigo-600 text-white font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Single-Sided
              </button>
            </div>
          </div>
        </div>

        {/* Copies Counter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Number of Copies
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-base hover:bg-slate-100"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="500"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold font-mono"
              />
              <button
                type="button"
                onClick={() => setCopies(copies + 1)}
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-base hover:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Finishing & Binding
            </label>
            <select
              value={finishingOption}
              onChange={(e) => setFinishingOption(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
            >
              <option value="none">No Binding (Loose Sheets)</option>
              <option value="staple">Corner Staple (+PKR 5)</option>
              <option value="spiral_binding">Spiral Wire Ring Binding (+PKR 80)</option>
              <option value="lamination">Heat Gloss Lamination (+PKR 50)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Step 3: Dynamic Price Estimate Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-sm tracking-tight">
              Dynamic Price Estimate
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
            PKR Currency
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="text-3xl font-black font-mono tracking-tight text-white">
              ₨ {pricing.total}
            </div>
            <span className="text-xs text-indigo-300 font-medium">
              Based on {pricing.sheetsCount} printable sheet(s) × {copies} cop{copies === 1 ? 'y' : 'ies'}
            </span>
          </div>

          <div className="text-xs text-slate-400 space-y-0.5 text-left sm:text-right">
            <div>Rate: ₨ {pricing.baseRate} per sheet</div>
            {pricing.finishingCost > 0 && <div>Finishing: +₨ {pricing.finishingCost}</div>}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          * Note: This amount is an estimate based on shop rates. Final verified charges are confirmed when the operator inspects page counts at the physical counter.
        </p>
      </div>

      {/* Step 4: Customer Reference & Submission Form */}
      <form onSubmit={handleSubmitOrder} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            3. Customer Details & Counter Pickup
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Provide your reference so the shop operator can call your name upon completion
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Usman Ali"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number / WhatsApp *
            </label>
            <input
              type="text"
              required
              placeholder="0300 1234567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Special Instructions for the Operator (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Please print pages 1 to 5 only, staple top-left corner..."
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          />
        </div>

        {/* Payment Choice */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'cash'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-bold ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Cash at Counter
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('jazzcash')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'jazzcash'
                  ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-slate-900 dark:text-white font-bold ring-2 ring-red-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              JazzCash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('easypaisa')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'easypaisa'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white font-bold ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Easypaisa
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting || uploadedFiles.length === 0}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Submit Printing Request (Est. ₨ {pricing.total})</span>
          </button>
        </div>
      </form>
    </div>
  );
};
