import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { CustomerOrder, OrderStatus, PaymentStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  ClipboardList,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Printer,
  FileText,
  DollarSign,
  Download,
  AlertTriangle,
  RotateCw,
  Clock,
  Sparkles,
  X,
  CreditCard,
} from 'lucide-react';

export const ShopOrderManagement: React.FC = () => {
  const { currentShop, selectedOrderIdForReview, setSelectedOrderIdForReview, addToast } = useApp();

  const shopId = currentShop?.id || 'SHOP-1001';
  const orders = storage.getOrders(shopId);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(() => {
    if (selectedOrderIdForReview) {
      return orders.find((o) => o.id === selectedOrderIdForReview) || null;
    }
    return null;
  });

  // Rejection modal
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Failure simulation modal
  const [failureModalOpen, setFailureModalOpen] = useState(false);
  const [failureReason, setFailureReason] = useState('Paper jam in duplex feeder unit');

  // Preview file modal
  const [previewFile, setPreviewFile] = useState<{ name: string; type: string } | null>(null);

  // Status tabs definition
  const tabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'new', label: 'New', count: orders.filter((o) => o.status === 'new').length },
    { id: 'pending_review', label: 'Pending Review', count: orders.filter((o) => o.status === 'pending_review').length },
    { id: 'approved', label: 'Approved', count: orders.filter((o) => o.status === 'approved').length },
    { id: 'printing_in_progress', label: 'Printing', count: orders.filter((o) => ['printing_initiated', 'printing_in_progress'].includes(o.status)).length },
    { id: 'completed', label: 'Completed', count: orders.filter((o) => ['printing_completed', 'completed_handover'].includes(o.status)).length },
    { id: 'rejected', label: 'Rejected', count: orders.filter((o) => o.status === 'rejected').length },
    { id: 'printing_failed', label: 'Printing Failed', count: orders.filter((o) => o.status === 'printing_failed').length },
  ];

  // Filtering
  const filteredOrders = orders.filter((order) => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'completed'
        ? ['printing_completed', 'completed_handover'].includes(order.status)
        : activeTab === 'printing_in_progress'
        ? ['printing_initiated', 'printing_in_progress'].includes(order.status)
        : order.status === activeTab;

    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const refreshOrders = () => {
    if (selectedOrder) {
      const refreshed = storage.getOrderById(selectedOrder.id, shopId);
      setSelectedOrder(refreshed || null);
    }
  };

  // 1. Approve Workflow
  const handleApprove = (order: CustomerOrder) => {
    try {
      const updated = storage.updateOrderStatus(order.id, shopId, 'approved', {
        note: 'Shop Administrator verified documents and approved request for queue.',
      });
      setSelectedOrder(updated);
      addToast('success', `Order #${order.id} Approved!`, 'Moved to printing queue.');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to approve order');
    }
  };

  // 2. Reject Workflow
  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !rejectionReason.trim()) return;

    try {
      const updated = storage.updateOrderStatus(selectedOrder.id, shopId, 'rejected', {
        rejectionReason: rejectionReason.trim(),
        note: `Order rejected by Shop Admin: ${rejectionReason.trim()}`,
      });
      setSelectedOrder(updated);
      setRejectionModalOpen(false);
      setRejectionReason('');
      addToast('warning', `Order #${selectedOrder.id} Rejected`, 'Customer will see the recorded rejection reason.');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to reject order');
    }
  };

  // 3. Printing Workflow Transitions
  const handlePrintingTransition = (newStatus: OrderStatus, note?: string) => {
    if (!selectedOrder) return;
    try {
      const updated = storage.updateOrderStatus(selectedOrder.id, shopId, newStatus, { note });
      setSelectedOrder(updated);
      addToast('info', `Order #${selectedOrder.id} transitioned to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to update printing state');
    }
  };

  // 4. Simulate Failure
  const handleSimulateFailure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const updated = storage.updateOrderStatus(selectedOrder.id, shopId, 'printing_failed', {
        printingFailureReason: failureReason,
        note: `Printer Alert: ${failureReason}`,
      });
      setSelectedOrder(updated);
      setFailureModalOpen(false);
      addToast('error', `Simulated failure recorded on #${selectedOrder.id}`);
    } catch (err: any) {
      addToast('error', err?.message);
    }
  };

  // 5. Payment Verification
  const handleVerifyPayment = (order: CustomerOrder) => {
    const nextStatus: PaymentStatus = order.paymentStatus === 'verified' ? 'pending' : 'verified';
    const updated = storage.updatePaymentStatus(order.id, shopId, nextStatus);
    setSelectedOrder(updated);
    addToast('success', `Payment status marked as ${nextStatus.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Printing Orders Queue & Operations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review incoming uploads, approve or reject jobs, and supervise the printing workflow
          </p>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID or customer phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Documents</th>
                <th className="py-3 px-4">Specs & Copies</th>
                <th className="py-3 px-4">Charges</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No printing orders found in this category.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {order.id}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(order.submittedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.customerPhone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {order.files[0]?.name || 'Document'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.files.length} file{order.files.length === 1 ? '' : 's'} (
                        {order.files.reduce((s, f) => s + f.estimatedPages, 0)} pgs)
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {order.preferences.paperSize} • {order.preferences.colorMode.toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.preferences.copies} cop{order.preferences.copies === 1 ? 'y' : 'ies'} •{' '}
                        {order.preferences.sides}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        PKR {order.finalAmount || order.pricingSnapshot.estimatedTotal}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {order.finalAmount !== order.pricingSnapshot.estimatedTotal ? 'Adjusted' : 'Estimated'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={order.paymentStatus} size="sm" />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Process</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Document Review Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-6 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">
                  {selectedOrder.id}
                </span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setSelectedOrderIdForReview(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs mb-4">
              <div>
                <span className="text-[11px] text-slate-400 block">Customer Information</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {selectedOrder.customerName}
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedOrder.customerPhone}
                </div>
                {selectedOrder.specialNotes && (
                  <div className="mt-2 text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200 dark:border-amber-800/60">
                    Note: "{selectedOrder.specialNotes}"
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Printing Specifications</span>
                <div className="space-y-1 mt-1 text-slate-700 dark:text-slate-300 font-medium">
                  <div>Color Mode: <strong className="uppercase">{selectedOrder.preferences.colorMode}</strong></div>
                  <div>Paper Size: <strong>{selectedOrder.preferences.paperSize}</strong></div>
                  <div>Sides: <strong className="capitalize">{selectedOrder.preferences.sides}-Sided</strong></div>
                  <div>Copies: <strong>{selectedOrder.preferences.copies}</strong></div>
                  <div>Finishing: <strong className="capitalize">{selectedOrder.preferences.finishingOption || 'None'}</strong></div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>Customer Uploaded Files ({selectedOrder.files.length})</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Verified Page Inspection
                </span>
              </div>

              <div className="space-y-2">
                {selectedOrder.files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.estimatedPages} estimated pages
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewFile({ name: file.name, type: file.type })}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={`#download-${file.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          addToast('info', `Authorized Download: ${file.name}`);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                        title="Authorized Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown Snapshot */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Agreed Price Snapshot:
                </span>
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                  PKR {selectedOrder.finalAmount || selectedOrder.pricingSnapshot.estimatedTotal}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div>Rate: PKR {selectedOrder.pricingSnapshot.baseRatePerPage}/pg</div>
                <div>Copies: {selectedOrder.pricingSnapshot.copies}</div>
                <div>Pages: {selectedOrder.pricingSnapshot.pagesCount}</div>
                <div>Finishing: PKR {selectedOrder.pricingSnapshot.finishingCost}</div>
              </div>
            </div>

            {/* Rejection / Failure Banner if present */}
            {selectedOrder.status === 'rejected' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200 mb-4">
                <strong>Rejection Reason:</strong> {selectedOrder.rejectionReason}
              </div>
            )}

            {selectedOrder.status === 'printing_failed' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-200 mb-4">
                <strong>Failure Reason:</strong> {selectedOrder.printingFailureReason}
              </div>
            )}

            {/* Action Buttons & Status Progression */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Operational Actions:
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Stage 1: New / Pending Review -> Approve or Reject */}
                {['new', 'pending_review'].includes(selectedOrder.status) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(selectedOrder)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Request</span>
                    </button>

                    <button
                      onClick={() => setRejectionModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Request</span>
                    </button>
                  </div>
                )}

                {/* Stage 2: Approved -> Initiate Printing */}
                {selectedOrder.status === 'approved' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintingTransition('printing_in_progress', 'Started printing on default commercial laser.')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Initiate Physical Printing</span>
                    </button>

                    <button
                      onClick={() => setFailureModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Simulate Jam/Failure</span>
                    </button>
                  </div>
                )}

                {/* Stage 3: Printing in Progress -> Mark Completed */}
                {['printing_initiated', 'printing_in_progress'].includes(selectedOrder.status) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintingTransition('printing_completed', 'Print job finished. Ready at collection desk.')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Printing Completed</span>
                    </button>

                    <button
                      onClick={() => setFailureModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-medium"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Simulate Hardware Failure</span>
                    </button>
                  </div>
                )}

                {/* Stage 4: Printing Completed -> Handover Completed */}
                {selectedOrder.status === 'printing_completed' && (
                  <button
                    onClick={() => handlePrintingTransition('completed_handover', 'Customer picked up printed documents at counter.')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Handover to Customer</span>
                  </button>
                )}

                {/* Recover from Failure */}
                {selectedOrder.status === 'printing_failed' && (
                  <button
                    onClick={() => handlePrintingTransition('printing_in_progress', 'Cleared duplex paper jam. Resuming spool.')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Recover & Retry Printing</span>
                  </button>
                )}

                {/* Always Available Utility Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Print job routing ticket"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Ticket</span>
                  </button>

                  <button
                    onClick={() => handleVerifyPayment(selectedOrder)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      selectedOrder.paymentStatus === 'verified'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{selectedOrder.paymentStatus === 'verified' ? 'Payment Verified' : 'Mark Paid'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 italic pt-2">
                * Note: Real printer communications require a local spooler bridge. Physical printer
                monitoring is simulated for this frontend demonstration.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Reject Order #{selectedOrder.id}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Enter the reason for rejection. This reason will be displayed on the customer's live tracking screen.
            </p>

            <form onSubmit={handleRejectConfirm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Password protected file, unreadable resolution, or unsupported paper size..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(false)}
                  className="px-4 py-2 border rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Failure Simulation Modal */}
      {failureModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Simulate Printer Error / Failure</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Simulate a printer error scenario (e.g. paper jam, low cyan toner) to test failure handling and manual job recovery.
            </p>

            <form onSubmit={handleSimulateFailure} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Simulated Failure Diagnostics *
                </label>
                <input
                  type="text"
                  required
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFailureModalOpen(false)}
                  className="px-4 py-2 border rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Record Failure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Lightbox Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h4 className="font-bold text-sm truncate max-w-sm">{previewFile.name}</h4>
              </div>
              <button onClick={() => setPreviewFile(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Document Viewer Frame */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-8 text-center min-h-[260px] flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-indigo-500/70 mb-3" />
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                Document Preview Sandbox
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Document verified for resolution, standard font embeddings, and page dimensions. Ready for high-speed counter spooling.
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
