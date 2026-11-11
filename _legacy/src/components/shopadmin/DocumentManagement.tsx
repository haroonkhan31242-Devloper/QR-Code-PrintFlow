import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  FolderOpen,
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export const DocumentManagement: React.FC = () => {
  const { currentShop, addToast } = useApp();
  const shopId = currentShop?.id || 'SHOP-1001';

  // Strict tenant isolation: only retrieve documents associated with orders of this shop!
  const orders = storage.getOrders(shopId);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all files
  const allDocuments = orders.flatMap((order) =>
    order.files.map((file) => ({
      ...file,
      orderId: order.id,
      customerName: order.customerName,
      submittedAt: order.submittedAt,
    }))
  );

  const filteredDocs = allDocuments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Document Repository & Archive
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure vault of uploaded customer files associated with print orders for {currentShop?.name}
          </p>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Retention notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Tenant Data Isolation: Only files submitted to this shop are accessible.</span>
        </div>
        <span className="text-[11px] text-slate-400">Default Retention: 30 days</span>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Document Name</th>
                <th className="py-2.5 px-4">Order Reference</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">File Size</th>
                <th className="py-2.5 px-4">Estimated Pages</th>
                <th className="py-2.5 px-4 text-right">Authorized Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No documents uploaded to this shop yet.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr key={`${doc.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-xs">{doc.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        MIME: {doc.type}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {doc.orderId}
                    </td>

                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {doc.customerName}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {doc.estimatedPages} pages
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => addToast('info', `Downloading file: ${doc.name}`)}
                        className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
