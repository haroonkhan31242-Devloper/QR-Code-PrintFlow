import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { QRCodeRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Printer,
  Ban,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  History,
  FileText,
  Search,
  Sparkles,
} from 'lucide-react';

export const QRCodeManagement: React.FC = () => {
  const { currentShop, addToast, reloadShops, setActiveRole, setCustomerShopToken, setActiveView } = useApp();

  const [qrs, setQrs] = useState<QRCodeRecord[]>([]);
  const [activeQr, setActiveQr] = useState<QRCodeRecord | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Modals
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const shopId = currentShop?.id || 'SHOP-1001';

  // Load QR codes for current shop
  const loadQrs = () => {
    const list = storage.getQRCodes(shopId);
    setQrs(list);
    const active = list.find((q) => q.status === 'active') || null;
    setActiveQr(active);

    if (active) {
      // Build real customer URL
      const customerUrl = `${window.location.origin}/?shop=${shopId}&token=${active.token}`;
      QRCode.toDataURL(customerUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code render error:', err));
    } else {
      setQrDataUrl('');
    }
  };

  useEffect(() => {
    loadQrs();
  }, [shopId]);

  const activeCustomerUrl = activeQr
    ? `${window.location.origin}/?shop=${shopId}&token=${activeQr.token}`
    : '';

  // 1. Download PNG QR Code
  const handleDownloadPNG = () => {
    if (!qrDataUrl || !activeQr) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${currentShop?.name || 'Shop'}_QR_${activeQr.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'High-resolution QR code downloaded');
  };

  // 2. Reprint Active QR Code (retains identical token without mutating ID)
  const handleReprintActive = () => {
    if (!activeQr) {
      addToast('error', 'No active QR code available to print');
      return;
    }
    setShowPosterModal(true);
    addToast('info', 'Opening printable counter poster', `Identity retained: ${activeQr.id}`);
  };

  // 3. Revoke QR Code Workflow
  const handleRevokeConfirm = () => {
    if (!activeQr) return;
    try {
      storage.revokeQRCode(activeQr.id, shopId);
      loadQrs();
      reloadShops();
      setShowRevokeConfirm(false);
      addToast(
        'warning',
        `QR Code ${activeQr.id} Revoked!`,
        'New customer requests through this QR will now be blocked.'
      );
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to revoke QR code');
    }
  };

  // 4. Generate Replacement QR Code
  const handleGenerateReplacement = () => {
    try {
      const { newQr } = storage.generateReplacementQRCode(shopId);
      loadQrs();
      reloadShops();
      addToast(
        'success',
        `Replacement QR Code Generated: ${newQr.id}`,
        'Existing orders and pricing preserved intact.'
      );
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to issue replacement QR code');
    }
  };

  const handleCopyLink = () => {
    if (!activeCustomerUrl) return;
    navigator.clipboard.writeText(activeCustomerUrl);
    setCopiedUrl(true);
    addToast('info', 'Customer portal URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSimulateScan = () => {
    if (!activeQr) {
      addToast('error', 'Cannot scan: Active QR code is revoked');
      return;
    }
    storage.recordQRScan(activeQr.token);
    setActiveRole('customer');
    setCustomerShopToken(activeQr.token);
    setActiveView('customer_portal');
  };

  // Filtered QR history
  const filteredHistory = qrs.filter(
    (q) =>
      q.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      q.token.toLowerCase().includes(historySearch.toLowerCase()) ||
      q.status.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Shop QR Code Identity & Poster Suite
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customers scan this shop-specific QR code at your counter to upload documents and submit print jobs
        </p>
      </div>

      {/* Main Grid: Active QR Card & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active QR Display */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Active Counter QR Code
                </h3>
              </div>

              {activeQr ? (
                <StatusBadge status="active" />
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  QR Revoked / No Active Code
                </span>
              )}
            </div>

            {activeQr ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Visual Scannable QR Code */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md shrink-0 text-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${currentShop?.name}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-xs text-slate-400">
                      Generating scannable QR...
                    </div>
                  )}
                  <span className="font-mono text-[11px] text-slate-600 font-bold block mt-1.5">
                    {activeQr.id}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3.5 flex-1 min-w-0 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Shop Identity
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                      {currentShop?.name}
                    </h4>
                    <span className="text-slate-500 dark:text-slate-400">
                      {currentShop?.address}, {currentShop?.city}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Identifier:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {activeQr.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Issued On:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(activeQr.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Scan Activity:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {activeQr.scansCount} customer scans
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Active Status:</span>
                      <span className="font-medium text-emerald-600">Scannable & Online</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Customer Direct Link:
                    </span>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <input
                        type="text"
                        readOnly
                        value={activeCustomerUrl}
                        className="bg-transparent flex-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 focus:outline-hidden truncate"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Copy Link"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 text-center bg-rose-50/50 dark:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900 rounded-2xl">
                <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Active QR Code Has Been Revoked
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                  Customer scanning is currently disabled. Incoming requests via previous counter
                  stands are blocked. Generate a new replacement identity to resume accepting orders.
                </p>
                <button
                  onClick={handleGenerateReplacement}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Generate Replacement QR Code
                </button>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          {activeQr && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 mt-6">
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={handleDownloadPNG}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>

                <button
                  onClick={handleReprintActive}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  title="Print counter stand poster without generating a new ID"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Counter Poster</span>
                </button>

                <button
                  onClick={handleSimulateScan}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Simulate Customer Scan</span>
                </button>
              </div>

              {/* Revoke Action */}
              <button
                onClick={() => setShowRevokeConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900/60 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Revoke QR Code</span>
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Operational Best Practices Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Counter Deployment Guide
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-0.5">
                  1. Place at Entrance & Counter
                </strong>
                Download the high-resolution poster, laminate it with A4 protective gloss, and position it near the entrance and billing desks.
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-0.5">
                  2. Reprinting vs Revoking
                </strong>
                Reprinting an existing poster keeps the same URL active without breaking customer workflows. Only revoke if a printed stand was compromised or lost.
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-0.5">
                  3. Zero-Friction Uploads
                </strong>
                Customers scan with their native iPhone Camera or Google Lens. No mobile app download or registration required.
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Current Shop ID:{' '}
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {shopId}
            </span>
          </div>
        </div>
      </div>

      {/* QR Code History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              QR Code History & Audit Trail
            </h3>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search history by ID or status..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">QR Identifier</th>
                <th className="py-2.5 px-3">Token Hash</th>
                <th className="py-2.5 px-3">Created Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Scans</th>
                <th className="py-2.5 px-3">Revocation / Replacement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredHistory.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {q.id}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {q.token}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {new Date(q.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={q.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {q.scansCount}
                  </td>
                  <td className="py-3 px-3 text-[11px]">
                    {q.revokedAt ? (
                      <span className="text-rose-500">
                        Revoked: {new Date(q.revokedAt).toLocaleDateString()}
                        {q.replacementRef && ` (Replaced by ${q.replacementRef})`}
                      </span>
                    ) : (
                      <span className="text-slate-400">— Active —</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revocation Confirmation Dialog */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Revoke QR Code {activeQr?.id}?
              </h3>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-5 leading-relaxed">
              <p>
                <strong>Warning:</strong> Once revoked, this QR code can <strong>never</strong> be
                reactivated again.
              </p>
              <p>
                Any customer attempting to scan old printed stands with this QR code will see a
                professional notice that the QR is inactive and will be prompted to request the new
                code at the counter.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Existing orders, customer files, and pricing configuration will remain completely intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => setShowRevokeConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-xs"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Poster Modal */}
      {showPosterModal && activeQr && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl text-slate-900 relative my-6">
            {/* Modal Controls */}
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Printer className="w-4 h-4" />
                <span>Print-Ready Counter Stand Poster</span>
              </div>
              <button
                onClick={() => setShowPosterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
              >
                Close
              </button>
            </div>

            {/* Poster Content for Window Print */}
            <div className="text-center space-y-4 border-4 border-slate-900 rounded-3xl p-6 bg-slate-50/50">
              <div className="inline-block bg-slate-900 text-white font-black text-xs uppercase px-4 py-1 rounded-full tracking-widest">
                PrintFlow Express Portal
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {currentShop?.name}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Fast Digital Xerox, Document Printing & Finishing Services
                </p>
              </div>

              {/* QR Image */}
              <div className="inline-block p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-sm">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-56 h-56 mx-auto object-contain"
                />
                <div className="mt-2 font-mono text-xs font-black text-slate-900">
                  ID: {activeQr.id}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5 text-xs text-slate-800 text-left bg-white p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-center text-indigo-700 uppercase tracking-wider text-[11px] mb-2">
                  How to print in 3 simple steps:
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <span>Open your mobile camera or Google Lens & scan this QR.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <span>Upload your PDF, Word, or image files & choose preferences.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <span>Review estimated price & collect fresh prints at the counter!</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                {currentShop?.address} • Phone: {currentShop?.contactNumber}
              </div>
            </div>

            {/* Print Trigger Button */}
            <div className="no-print mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPosterModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Poster (Window.Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
