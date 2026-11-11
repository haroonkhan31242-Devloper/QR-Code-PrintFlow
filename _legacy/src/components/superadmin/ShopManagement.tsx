import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { StatusBadge } from '../common/StatusBadge';
import { Shop, ShopStatus } from '../../types';
import {
  Store,
  Plus,
  Search,
  KeyRound,
  ShieldCheck,
  Ban,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';

export const ShopManagement: React.FC = () => {
  const { shops, reloadShops, addToast, setSelectedShopIdForDetails, setActiveView, setCurrentShopId } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ShopStatus>('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    shop: Shop;
    username: string;
    email: string;
    tempPass: string;
    categories: string[];
  } | null>(null);

  const [resetModalShop, setResetModalShop] = useState<Shop | null>(null);
  const [newPasswordGenerated, setNewPasswordGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    contactNumber: '',
    email: '',
    username: '',
    password: '',
    address: '',
    city: 'Lahore',
    status: 'active' as ShopStatus,
    subscriptionPlanId: 'PLAN-PRO',
    operatingHours: '09:00 AM - 09:00 PM',
    categories: [
      'Document & Thesis Printing',
      'Large Format, Posters & CAD',
      'Binding, Lamination & Finishing',
    ],
  });

  const subscriptions = storage.getSubscriptionPlans();

  // Cities list
  const cities = Array.from(new Set(shops.map((s) => s.city)));

  // Filtered shops
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(search.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      shop.id.toLowerCase().includes(search.toLowerCase()) ||
      shop.city.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
    const matchesCity = cityFilter === 'all' || shop.city === cityFilter;

    return matchesSearch && matchesStatus && matchesCity;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.ownerName.trim()) {
      addToast('error', 'Validation Error', 'Shop name and owner name are required.');
      return;
    }

    const assignedUser = formData.username.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}admin`;
    const initialPass = formData.password.trim() || `Print@${Math.floor(1000 + Math.random() * 9000)}`;

    const { shop, adminUser, tempPass } = storage.createShop({
      name: formData.name,
      ownerName: formData.ownerName,
      contactNumber: formData.contactNumber,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      status: formData.status,
      subscriptionPlanId: formData.subscriptionPlanId,
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      operatingHours: formData.operatingHours,
      customUsername: assignedUser,
      customPassword: initialPass,
      categoryNames: formData.categories.length > 0 ? formData.categories : undefined,
    });

    reloadShops();
    setIsCreateOpen(false);
    setCreatedCredentials({
      shop,
      username: adminUser.username || assignedUser,
      email: adminUser.email,
      tempPass: tempPass || initialPass,
      categories: formData.categories,
    });
    addToast('success', `Shop ${shop.name} registered!`, `Generated ID: ${shop.id} & Admin Account provisioned`);
  };


  const handleStatusChange = (shopId: string, newStatus: ShopStatus) => {
    storage.setShopStatus(shopId, newStatus);
    reloadShops();
    addToast(
      newStatus === 'active' ? 'success' : 'warning',
      `Shop status updated to ${newStatus.toUpperCase()}`
    );
  };

  const handleResetPassword = (shop: Shop) => {
    const tempPass = `Reset@${Math.floor(1000 + Math.random() * 9000)}`;
    setResetModalShop(shop);
    setNewPasswordGenerated(tempPass);

    storage.addAuditLog({
      shopId: shop.id,
      userId: 'USR-SUPER',
      userName: 'Platform Super Admin',
      action: 'Credentials Reset',
      details: `Generated new temporary administrative credentials for ${shop.name} (${shop.id}).`,
      severity: 'warning',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('info', 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Printing Shops Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provision and administer independent print studios across the platform
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              ownerName: '',
              contactNumber: '',
              email: '',
              username: '',
              password: '',
              address: '',
              city: 'Lahore',
              status: 'active',
              subscriptionPlanId: 'PLAN-PRO',
              operatingHours: '09:00 AM - 09:00 PM',
              categories: [
                'Document & Thesis Printing',
                'Large Format, Posters & CAD',
                'Binding, Lamination & Finishing',
              ],
            });
            setIsCreateOpen(true);
          }}

          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Shop</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by shop name, owner, ID, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
            <option value="deactivated">Deactivated Only</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Shop Name & ID</th>
                <th className="py-3 px-4">Owner & Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No printing shops matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => {
                  const plan = subscriptions.find((p) => p.id === shop.subscriptionPlanId);
                  return (
                    <tr
                      key={shop.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {shop.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                            {shop.id}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400 text-[11px]">
                            QR: {shop.activeQrId || 'Revoked'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {shop.ownerName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {shop.contactNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {shop.city}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          {shop.address}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-semibold">
                          {plan?.name || 'Standard Tier'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={shop.status} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedShopIdForDetails(shop.id);
                              setActiveView('shop_details');
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                            title="Inspect shop profile & orders"
                          >
                            Details
                          </button>

                          {/* Quick tenant login simulator */}
                          <button
                            onClick={() => setCurrentShopId(shop.id)}
                            className="px-2 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-medium transition-colors flex items-center gap-1"
                            title="Simulate logging into this shop's dashboard"
                          >
                            <span>Open as Shop</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {/* Status toggle action */}
                          {shop.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(shop.id, 'suspended')}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Suspend Shop"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(shop.id, 'active')}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Reactivate Shop"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Password reset button */}
                          <button
                            onClick={() => handleResetPassword(shop)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Reset Shop Admin Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Shop Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Store className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Onboard New Printing Shop
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Falcon Color Digital Press"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asad Qureshi"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+92 300 1234567"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="contact@shop.pk"
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
                    placeholder="Lahore, Karachi, Islamabad..."
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    placeholder="09:00 AM - 09:00 PM"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Street Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Full shop unit, building, market name, street..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Administrator Account Credentials */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Shop Administrator Credentials</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Used by owner to sign in at /shop/login</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Username *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. apexadmin"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Unique login handle</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Initial Password
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            password: `Print@${Math.floor(1000 + Math.random() * 9000)}`,
                          })
                        }
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Print@8492"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Leave blank to auto-generate</p>
                  </div>
                </div>
              </div>

              {/* Shop Categories Assignment */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Assign Shop Categories (Specialties)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Select which printing categories this shop provides to customers in their QR portal:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {[
                    'Document & Thesis Printing',
                    'Large Format, Posters & CAD',
                    'Binding, Lamination & Finishing',
                    'Commercial & Legal Services',
                    'Photo & Glossy Media',
                  ].map((catName) => {
                    const isChecked = formData.categories.includes(catName);
                    return (
                      <label
                        key={catName}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                categories: [...formData.categories, catName],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                categories: formData.categories.filter((c) => c !== catName),
                              });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600"
                        />
                        <span className="truncate">{catName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Subscription Tier
                  </label>
                  <select
                    value={formData.subscriptionPlanId}
                    onChange={(e) => setFormData({ ...formData, subscriptionPlanId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {subscriptions.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (PKR {plan.price}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ShopStatus })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="active">Active Immediately</option>
                    <option value="suspended">Suspended Pending Verification</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Provision Shop & Issue QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Credentials Confirmation Card Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 mb-2">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Shop Provisioned & Credentials Generated
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              The shop was successfully created and assigned ID{' '}
              <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
                {createdCredentials.shop.id}
              </strong>
              . Provide these secure credentials to the shop owner:
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Shop ID:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {createdCredentials.shop.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Shop Admin Username:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {createdCredentials.username}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Login Email:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {createdCredentials.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">
                  Initial Password:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  {createdCredentials.tempPass}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-sans">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Assigned Categories:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  {createdCredentials.categories.length} categories active
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  copyToClipboard(
                    `Shop ID: ${createdCredentials.shop.id}\nUsername: ${createdCredentials.username}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.tempPass}\nPortal URL: /shop/login`
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Credentials</span>
              </button>

              <button
                onClick={() => {
                  setCreatedCredentials(null);
                  setActiveView('shop_login');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Test in Shop Login →
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Password Reset Modal */}
      {resetModalShop && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Admin Password Reset
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Generated a new secure temporary password for{' '}
              <strong>{resetModalShop.name}</strong> ({resetModalShop.id}):
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-center text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-5">
              {newPasswordGenerated}
            </div>

            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setResetModalShop(null);
                  setNewPasswordGenerated(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (newPasswordGenerated) copyToClipboard(newPasswordGenerated);
                  setResetModalShop(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs"
              >
                Copy & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
