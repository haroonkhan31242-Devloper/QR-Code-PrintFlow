import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { User, Shop } from '../../types';
import {
  Users,
  Search,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Store,
  Mail,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

export const ShopAdministratorsView: React.FC = () => {
  const { shops, switchUser, addToast } = useApp();

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const shopAdmins = users.filter((u) => u.role === 'shop_admin');

  const filteredAdmins = shopAdmins.filter((u) => {
    const term = search.toLowerCase();
    const shop = shops.find((s) => s.id === u.shopId);
    return (
      u.name.toLowerCase().includes(term) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      u.email.toLowerCase().includes(term) ||
      (u.shopId && u.shopId.toLowerCase().includes(term)) ||
      (shop && shop.name.toLowerCase().includes(term))
    );
  });

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated = { ...user, status: newStatus as any };
    storage.saveUser(updated);
    setUsers(storage.getUsers());
    addToast(
      newStatus === 'active' ? 'success' : 'warning',
      `Account Status Changed`,
      `User ${user.name} (@${user.username}) is now ${newStatus.toUpperCase()}`
    );
  };

  const handleOpenReset = (user: User) => {
    const generated = `Print@${Math.floor(1000 + Math.random() * 9000)}`;
    setResetModalUser(user);
    setNewPassword(generated);
  };

  const handleConfirmReset = () => {
    if (!resetModalUser) return;
    const updated = { ...resetModalUser, password: newPassword };
    storage.saveUser(updated);
    setUsers(storage.getUsers());
    addToast('success', 'Credentials Updated', `New password saved for @${resetModalUser.username}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Shop Administrators
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {shopAdmins.length} Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage authenticated owner credentials, access status, and passwords for all print shops.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, handle, or shop..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Username / Handle</th>
                <th className="py-3 px-4">Associated Shop</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAdmins.map((admin) => {
                const shop = shops.find((s) => s.id === admin.shopId);
                const isActive = admin.status !== 'suspended' && admin.status !== 'deactivated';

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            admin.avatarUrl ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={admin.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{admin.name}</div>
                          <div className="text-[11px] text-slate-400">{admin.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      @{admin.username || 'unassigned'}
                    </td>

                    <td className="py-3.5 px-4">
                      {shop ? (
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <span>{shop.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">{shop.id} &bull; {shop.city}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">{admin.shopId || 'None'}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          admin.status === 'active' || (!admin.status && isActive)
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : admin.status === 'suspended'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {admin.status === 'active' || (!admin.status && isActive) ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-amber-500" />
                            <span className="capitalize">{admin.status || 'Suspended'}</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {admin.lastLoginAt ? (
                        <span>{new Date(admin.lastLoginAt).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-slate-400 italic">Never logged in</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReset(admin)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                          title="Generate new password"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            admin.status === 'active' || (!admin.status && isActive)
                              ? 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          }`}
                        >
                          {admin.status === 'active' || (!admin.status && isActive) ? 'Suspend' : 'Activate'}
                        </button>

                        <button
                          onClick={() => switchUser(admin)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Switch into this shop session"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-900 dark:text-white text-xs">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2 font-bold text-sm">
              <KeyRound className="w-5 h-5" />
              <span>Reset Shop Admin Password</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-[11px]">
              Set or generate a new administrative password for{' '}
              <strong>{resetModalUser.name}</strong> (@{resetModalUser.username}).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">New Initial Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Username:</span>
                  <span className="font-bold">{resetModalUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Email:</span>
                  <span>{resetModalUser.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() =>
                  copyToClipboard(
                    `Shop Admin Credentials:\nUsername: ${resetModalUser.username}\nPassword: ${newPassword}\nShop ID: ${resetModalUser.shopId}`
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleConfirmReset();
                    setResetModalUser(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
