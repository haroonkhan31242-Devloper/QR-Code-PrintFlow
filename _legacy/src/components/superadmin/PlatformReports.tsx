import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Store,
  Layers,
} from 'lucide-react';

export const PlatformReports: React.FC = () => {
  const { shops, addToast } = useApp();
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '7days' | '30days'>('all');

  const orders = storage.getOrders();
  const services = storage.getServices();

  const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.pricingSnapshot.estimatedTotal), 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // Breakdown by Shop
  const shopBreakdown = shops.map((shop) => {
    const shopOrders = orders.filter((o) => o.shopId === shop.id);
    const shopRev = shopOrders.reduce((sum, o) => sum + (o.finalAmount || o.pricingSnapshot.estimatedTotal), 0);
    return {
      shop,
      orderCount: shopOrders.length,
      revenue: shopRev,
    };
  });

  const handleExportCSV = () => {
    const rows = [
      ['Shop ID', 'Shop Name', 'City', 'Status', 'Orders Count', 'Total Revenue (PKR)'],
      ...shopBreakdown.map((item) => [
        item.shop.id,
        item.shop.name,
        item.shop.city,
        item.shop.status,
        item.orderCount.toString(),
        item.revenue.toString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `printflow_platform_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported platform summary report CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Platform Analytics & Financial Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cross-tenant printing volume, retail gross merchandise value, and shop performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                timeRange === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                timeRange === '30days'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                timeRange === '7days'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Cumulative Gross Volume</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            PKR {totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            Across {orders.length} printing requests
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Average Order Value</span>
          <div className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            PKR {avgOrderValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Includes multi-copy thesis & commercial posters
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Active Tenants Ratio</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {Math.round((shops.filter((s) => s.status === 'active').length / (shops.length || 1)) * 100)}%
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            High platform retention
          </span>
        </div>
      </div>

      {/* Breakdown by Shop Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Retail Performance by Printing Shop
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Shop Details</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3">Jobs Completed</th>
                <th className="py-2.5 px-3">Revenue Volume</th>
                <th className="py-2.5 px-3">Volume Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {shopBreakdown.map((item) => {
                const percent = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
                return (
                  <tr key={item.shop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.shop.name}
                      </div>
                      <div className="font-mono text-slate-400 text-[11px]">{item.shop.id}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                      {item.shop.city}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {item.orderCount}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      PKR {item.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">{percent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
