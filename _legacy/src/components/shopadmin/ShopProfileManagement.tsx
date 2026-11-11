import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { StatusBadge } from '../common/StatusBadge';
import {
  UserCheck,
  Save,
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export const ShopProfileManagement: React.FC = () => {
  const { currentShop, reloadShops, addToast } = useApp();
  const shopId = currentShop?.id || 'SHOP-1001';

  const [formData, setFormData] = useState({
    name: currentShop?.name || '',
    ownerName: currentShop?.ownerName || '',
    contactNumber: currentShop?.contactNumber || '',
    email: currentShop?.email || '',
    address: currentShop?.address || '',
    city: currentShop?.city || '',
    operatingHours: currentShop?.operatingHours || '09:00 AM - 09:00 PM',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.ownerName.trim()) return;

    storage.updateShop(shopId, {
      name: formData.name,
      ownerName: formData.ownerName,
      contactNumber: formData.contactNumber,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      operatingHours: formData.operatingHours,
    });

    reloadShops();
    addToast('success', 'Shop profile updated successfully');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Shop Profile & Retail Details
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Update public information displayed on customer QR landing portals and printed posters
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* System Readonly Identifiers */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[11px] text-slate-400 block">System Tenant ID</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5 block">
              {currentShop?.id}
            </span>
            <span className="text-[10px] text-slate-400">Non-transferrable</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">Current Status</span>
            <div className="mt-1">
              <StatusBadge status={currentShop?.status || 'active'} size="sm" />
            </div>
            <span className="text-[10px] text-slate-400">Governed by Super Admin</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">Active Counter QR</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs mt-0.5 block">
              {currentShop?.activeQrId || 'Revoked'}
            </span>
            <span className="text-[10px] text-slate-400">Linked to customer portal</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Print Shop Brand Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Owner / Manager Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Phone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operating Counter Hours
              </label>
              <input
                type="text"
                placeholder="09:00 AM - 10:00 PM (Mon-Sat)"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Physical Street & Market Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Information</span>
          </button>
        </div>
      </form>
    </div>
  );
};
