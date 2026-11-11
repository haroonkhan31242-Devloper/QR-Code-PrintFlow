import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { CustomerOrder } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  AlertTriangle,
  Building,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const OrderTracker: React.FC = () => {
  const { customerTrackingOrderId, setCustomerTrackingOrderId } = useApp();

  const [inputOrderId, setInputOrderId] = useState(customerTrackingOrderId || 'ORD-8941');
  const [searchedOrder, setSearchedOrder] = useState<CustomerOrder | null>(() => {
    return storage.getOrderById(customerTrackingOrderId || 'ORD-8941') || null;
  });
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputOrderId.trim()) return;

    const ord = storage.getOrderById(inputOrderId.trim());
    if (ord) {
      setSearchedOrder(ord);
      setNotFound(false);
      setCustomerTrackingOrderId(ord.id);
    } else {
      setSearchedOrder(null);
      setNotFound(true);
    }
  };

  const getTimelineSteps = (order: CustomerOrder) => {
    const isRejected = order.status === 'rejected';
    const isFailed = order.status === 'printing_failed';

    const baseSteps = [
      { key: 'new', label: 'Order Submitted', desc: 'Received at shop counter queue' },
      { key: 'approved', label: 'Shop Review & Approval', desc: 'Files & page counts verified by operator' },
      { key: 'printing_in_progress', label: 'Printing In Progress', desc: 'Job processing on physical laser/press' },
      { key: 'printing_completed', label: 'Ready for Collection', desc: 'Fresh prints at counter pickup desk' },
      { key: 'completed_handover', label: 'Completed & Handed Over', desc: 'Collected by recipient' },
    ];

    const currentIdx = (() => {
      switch (order.status) {
        case 'new':
        case 'pending_review':
          return 0;
        case 'approved':
          return 1;
        case 'printing_initiated':
        case 'printing_in_progress':
          return 2;
        case 'printing_completed':
          return 3;
        case 'completed_handover':
          return 4;
        default:
          return 1;
      }
    })();

    return { baseSteps, currentIdx, isRejected, isFailed };
  };

  const shop = searchedOrder ? storage.getShopById(searchedOrder.shopId) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Track Your Print Job
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter your Order ID to monitor live shop review, printing progress, and collection readiness
        </p>
      </div>

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter Order ID (e.g. ORD-8941)..."
            value={inputOrderId}
            onChange={(e) => setInputOrderId(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-transparent text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-hidden"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Track Status
        </button>
      </form>

      {notFound && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No order found matching "{inputOrderId}". Please check your order ticket receipt or ask the shop operator.
        </div>
      )}

      {/* Searched Order Details */}
      {searchedOrder && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  {searchedOrder.id}
                </span>
                <StatusBadge status={searchedOrder.status} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {shop?.name || searchedOrder.shopId}
                </span>
                <span>•</span>
                <span>{shop?.city}</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 block">Estimated Charges</span>
              <span className="font-mono font-extrabold text-lg text-slate-900 dark:text-white">
                PKR {searchedOrder.finalAmount || searchedOrder.pricingSnapshot.estimatedTotal}
              </span>
            </div>
          </div>

          {/* Rejection Alert if applicable */}
          {searchedOrder.status === 'rejected' && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-sm block">Printing Request Rejected</strong>
                <p className="mt-0.5 leading-relaxed">
                  Reason provided by shop operator: "{searchedOrder.rejectionReason || 'Document could not be processed.'}"
                </p>
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">
                  Please consult counter staff to re-submit an unlocked or compatible file.
                </p>
              </div>
            </div>
          )}

          {/* Failure Alert if applicable */}
          {searchedOrder.status === 'printing_failed' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-sm block">Temporary Hardware Delay</strong>
                <p className="mt-0.5 leading-relaxed">
                  The printer encountered a brief interruption ({searchedOrder.printingFailureReason}). The operator is clearing the spooler and will resume printing shortly.
                </p>
              </div>
            </div>
          )}

          {/* Visual Order Timeline */}
          {searchedOrder.status !== 'rejected' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Live Fulfillment Progress:
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {getTimelineSteps(searchedOrder).baseSteps.map((step, idx) => {
                  const currentIdx = getTimelineSteps(searchedOrder).currentIdx;
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step.key} className="relative flex items-start gap-3 text-xs">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isCurrent
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/60 animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>

                      <div>
                        <div
                          className={`font-bold ${
                            isCurrent
                              ? 'text-indigo-600 dark:text-indigo-400 text-sm'
                              : isDone
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submitted Files & Specs */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-900 dark:text-white mb-1">
              Order Summary:
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Customer: <strong>{searchedOrder.customerName}</strong> ({searchedOrder.customerPhone})
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Specifications: {searchedOrder.preferences.paperSize} •{' '}
              <strong className="uppercase">{searchedOrder.preferences.colorMode}</strong> •{' '}
              {searchedOrder.preferences.sides}-Sided • {searchedOrder.preferences.copies} cop{searchedOrder.preferences.copies === 1 ? 'y' : 'ies'}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Files: {searchedOrder.files.map((f) => f.name).join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
