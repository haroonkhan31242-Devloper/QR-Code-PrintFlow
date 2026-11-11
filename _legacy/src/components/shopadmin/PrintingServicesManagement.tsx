import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { PrintingService, ServiceCategory } from '../../types';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
} from 'lucide-react';

export const PrintingServicesManagement: React.FC = () => {
  const { currentShop, addToast } = useApp();
  const shopId = currentShop?.id || 'SHOP-1001';

  const [services, setServices] = useState<PrintingService[]>(() =>
    storage.getServices(shopId)
  );
  const [categories, setCategories] = useState(() => storage.getCategories(shopId));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<PrintingService | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'standard' as ServiceCategory,
    categoryId: categories[0]?.id || '',
    paperSize: 'A4' as any,
    colorMode: 'bw' as any,
    sides: 'both' as any,
    basePrice: 5,
    description: '',
    isActive: true,
  });

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category: 'standard',
      categoryId: categories[0]?.id || '',
      paperSize: 'A4',
      colorMode: 'bw',
      sides: 'both',
      basePrice: 5,
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: PrintingService) => {
    setEditingService(srv);
    setFormData({
      name: srv.name,
      category: srv.category,
      categoryId: srv.categoryId || categories[0]?.id || '',
      paperSize: srv.paperSize,
      colorMode: srv.colorMode,
      sides: srv.sides,
      basePrice: srv.basePrice,
      description: srv.description,
      isActive: srv.isActive,
    });
    setIsModalOpen(true);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const id = editingService ? editingService.id : `SRV-${shopId}-${Date.now().toString().slice(-4)}`;

    const srv: PrintingService = {
      id,
      shopId,
      name: formData.name,
      category: formData.category,
      categoryId: formData.categoryId,
      paperSize: formData.paperSize,
      colorMode: formData.colorMode,
      sides: formData.sides,
      basePrice: Number(formData.basePrice),
      description: formData.description,
      isActive: formData.isActive,
    };

    storage.saveService(srv);
    setServices(storage.getServices(shopId));
    setIsModalOpen(false);
    addToast('success', `Service "${srv.name}" saved!`);

  };

  const handleToggleActive = (srv: PrintingService) => {
    const updated = { ...srv, isActive: !srv.isActive };
    storage.saveService(updated);
    setServices(storage.getServices(shopId));
    addToast('info', `Service "${srv.name}" ${updated.isActive ? 'activated' : 'deactivated'}`);
  };

  const handleDelete = (id: string, name: string) => {
    storage.deleteService(id, shopId);
    setServices(storage.getServices(shopId));
    addToast('warning', `Removed service: ${name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Printing Services & Capabilities
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define which printing specifications, paper sizes, and finishes are offered to customers scanning your QR code
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Printing Service</span>
        </button>
      </div>

      {/* Services List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Service Details</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Specs</th>
                <th className="py-2.5 px-4">Base Rate</th>
                <th className="py-2.5 px-4">Customer Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{srv.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {srv.description}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="capitalize font-medium text-slate-700 dark:text-slate-300">
                      {srv.category.replace('_', ' ')}
                    </div>
                    {srv.categoryId && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {categories.find((c) => c.id === srv.categoryId)?.name || 'Custom Category'}
                      </span>
                    )}
                  </td>


                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {srv.paperSize} • {srv.colorMode.toUpperCase()}
                    </div>
                    <div className="text-[11px] text-slate-400 capitalize">{srv.sides} sided</div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    PKR {srv.basePrice}
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(srv)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                        srv.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {srv.isActive ? 'Active in Portal' : 'Hidden'}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(srv)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(srv.id, srv.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingService ? 'Edit Printing Service' : 'Add New Printing Service'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal Deed Print (B&W)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Shop Category (Department) *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isActive ? '' : '(Inactive)'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Determines which tab in customer QR portal displays this service.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Type
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="standard">Standard Print</option>
                    <option value="large_format">Large Format</option>
                    <option value="finishing">Finishing & Binding</option>
                    <option value="specialty">Specialty / Photo</option>
                  </select>
                </div>


                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paper Size
                  </label>
                  <select
                    value={formData.paperSize}
                    onChange={(e) => setFormData({ ...formData, paperSize: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="A4">A4 (Standard 8.27 x 11.69 in)</option>
                    <option value="A3">A3 (11.7 x 16.5 in)</option>
                    <option value="Legal">Legal (8.5 x 14 in)</option>
                    <option value="Letter">Letter (8.5 x 11 in)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color Mode
                  </label>
                  <select
                    value={formData.colorMode}
                    onChange={(e) => setFormData({ ...formData, colorMode: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="bw">Black & White Only</option>
                    <option value="color">Full Colour Only</option>
                    <option value="both">Both B&W and Colour</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Base Rate (PKR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Paper weight, finish, recommended use..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-slate-700 dark:text-slate-300">
                  Enable and show this service in customer QR portal
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
