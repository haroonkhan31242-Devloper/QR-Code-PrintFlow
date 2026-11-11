import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { CustomerOrder, OrderStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  ShoppingBag,
  Search,
  Filter,
  Store,
  Calendar,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  X,
  CreditCard,
  Download,
} from 'lucide-react';

export const AllOrdersView: React.FC = () => {
  const { shops } = useApp();

  const [orders] = useState<CustomerOrder[]>(() => storage.getOrders());
  const [search, setSearch] = useState('');
  const [shopFilter, setShopFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  const totalVolume = orders.reduce((sum, o) => sum + (o.finalAmount || o.pricingSnapshot.estimatedTotal), 0);
  const pendingCount = orders.filter((o) => ['new', 'pending_review'].includes(o.status)).length;
  const inProgressCount = orders.filter((o) => ['approved', 'printing_initiated', 'printing_in_progress'].includes(o.status)).length;
  const completedCount = orders.filter((o) => ['printing_completed', 'completed_handover'].includes(o.status)).length;

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.shopId.toLowerCase().includes(search.toLowerCase());

    const matchesShop = shopFilter === 'all' || o.shopId === shopFilter;
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    return matchesSearch && matchesShop && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              All Platform Orders
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {orders.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global monitoring of all walk-in customer printing transactions across every registered shop.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Volume</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            PKR {totalVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{orders.length} total orders</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-amber-500 font-semibold uppercase">Pending Review</span>
          <div className="text-xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting shop action</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-blue-500 font-semibold uppercase">In Production</span>
          <div className="text-xl font-black text-blue-600 mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Printing / spooling</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-500 font-semibold uppercase">Completed</span>
          <div className="text-xl font-black text-emerald-600 mt-1">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready or handed over</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, customer, or phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Printing Shops</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="printing_in_progress">Printing In Progress</option>
            <option value="printing_completed">Printing Completed</option>
            <option value="completed_handover">Completed Handover</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Print Shop</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Specs & Files</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No orders matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const shop = shops.find((s) => s.id === ord.shopId);
                  const amount = ord.finalAmount || ord.pricingSnapshot.estimatedTotal;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {ord.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {shop?.name || ord.shopId}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{ord.shopId}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400">{ord.customerPhone}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {ord.files.length} document(s) &bull; {ord.preferences.paperSize} ({ord.preferences.colorMode.toUpperCase()})
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {ord.preferences.sides} sided &bull; {ord.preferences.copies} cop{ord.preferences.copies === 1 ? 'y' : 'ies'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        PKR {amount}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={ord.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-slate-900 dark:text-white text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  #{selectedOrder.id}
                </span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer Info</span>
                <div className="font-bold text-sm">{selectedOrder.customerName}</div>
                <div className="text-slate-500">{selectedOrder.customerPhone}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Shop</span>
                <div className="font-bold text-sm">
                  {shops.find((s) => s.id === selectedOrder.shopId)?.name || selectedOrder.shopId}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">{selectedOrder.shopId}</div>
              </div>
            </div>

            {/* Files List */}
            <div className="space-y-2 mb-4">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                Uploaded Files ({selectedOrder.files.length})
              </span>
              <div className="space-y-1.5">
                {selectedOrder.files.map((f) => (
                  <div
                    key={f.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-medium truncate">{f.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">
                      {(f.size / 1024 / 1024).toFixed(2)} MB &bull; ~{f.estimatedPages} pages
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Snapshot */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-2 mb-4">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Print Specifications & Rate Calculation
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div>Paper: <strong>{selectedOrder.preferences.paperSize}</strong></div>
                <div>Color: <strong>{selectedOrder.preferences.colorMode.toUpperCase()}</strong></div>
                <div>Sides: <strong>{selectedOrder.preferences.sides}</strong></div>
                <div>Copies: <strong>{selectedOrder.preferences.copies}</strong></div>
              </div>
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900 flex justify-between font-bold text-sm">
                <span>Final Amount:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  PKR {selectedOrder.finalAmount || selectedOrder.pricingSnapshot.estimatedTotal}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-2 text-xs">
                Order Activity Timeline
              </span>
              <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-2 pl-3">
                {selectedOrder.timeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
                    <div className="font-medium text-[11px] capitalize">{item.status.replace('_', ' ')}</div>
                    {item.note && <div className="text-[10px] text-slate-400">{item.note}</div>}
                    <div className="text-[9px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
