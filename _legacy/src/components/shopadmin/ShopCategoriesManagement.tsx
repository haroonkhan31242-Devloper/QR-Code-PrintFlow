import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { ShopCategory, PrintingService } from '../../types';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Maximize2,
  BookOpen,
  Briefcase,
  Copy,
  Palette,
  GraduationCap,
  FolderOpen,
  Info,
  Printer,
  Sparkles,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Maximize2,
  BookOpen,
  Briefcase,
  Copy,
  Palette,
  GraduationCap,
  FolderOpen,
  Layers,
};

export const ShopCategoriesManagement: React.FC = () => {
  const { currentShop, addToast, reloadCategories } = useApp();
  const shopId = currentShop?.id || 'SHOP-1001';

  const [categories, setCategories] = useState<ShopCategory[]>(() =>
    storage.getCategories(shopId)
  );
  const [services, setServices] = useState<PrintingService[]>(() =>
    storage.getServices(shopId)
  );

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);

  const refreshData = () => {
    const cats = storage.getCategories(shopId);
    setCategories(cats);
    setServices(storage.getServices(shopId));
    reloadCategories();
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIcon('Layers');
    setIsActive(true);
    setDisplayOrder(categories.length + 1);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: ShopCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'Layers');
    setIsActive(cat.isActive);
    setDisplayOrder(cat.displayOrder || 1);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Category name is required');
      return;
    }

    const catId = editingCategory ? editingCategory.id : `CAT-${shopId.replace('SHOP-', '')}-${Date.now().toString().slice(-4)}`;

    const newCategory: ShopCategory = {
      id: catId,
      shopId,
      name: name.trim(),
      description: description.trim(),
      icon,
      isActive,
      displayOrder: Number(displayOrder) || 1,
      createdAt: editingCategory?.createdAt || new Date().toISOString(),
    };

    storage.saveCategory(newCategory);
    addToast('success', editingCategory ? 'Category Updated' : 'Category Created', `"${newCategory.name}" saved successfully.`);
    setModalOpen(false);
    refreshData();
  };

  const handleDelete = (cat: ShopCategory) => {
    const assignedServices = services.filter((s) => s.categoryId === cat.id);
    if (assignedServices.length > 0) {
      if (
        !confirm(
          `Notice: ${assignedServices.length} printing service(s) are currently assigned to "${cat.name}". Deleting this category will unassign those services. Proceed?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
        return;
      }
    }

    storage.deleteCategory(cat.id, shopId);
    addToast('info', 'Category Deleted', `Category "${cat.name}" has been removed.`);
    refreshData();
  };

  const handleToggleStatus = (cat: ShopCategory) => {
    storage.toggleCategoryActive(cat.id, shopId);
    addToast('info', `Status Changed`, `"${cat.name}" is now ${!cat.isActive ? 'Active' : 'Inactive'}`);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Shop Categories
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize the printing specialties and service types offered at <strong>{currentShop?.name}</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-white">
            How Categories Work
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            <strong>Categories</strong> represent overarching service departments (e.g. Thesis Printing, Large Format CAD, Binding & Finishing). In the customer QR portal, customers filter your printing services by selecting these categories. Individual rates and paper specs are managed under <strong>Printing Services</strong>.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const IconComponent = (cat.icon && ICON_MAP[cat.icon]) || Layers;
          const assignedServices = services.filter((s) => s.categoryId === cat.id);

          return (
            <div
              key={cat.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                cat.isActive
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        cat.isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cat.id} &bull; Order #{cat.displayOrder}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(cat)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      cat.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {cat.description || 'No description provided.'}
                </p>

                {/* Assigned Services List Preview */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Printer className="w-3 h-3" />
                      <span>Assigned Services</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {assignedServices.length}
                    </span>
                  </div>

                  {assignedServices.length > 0 ? (
                    <div className="space-y-1">
                      {assignedServices.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between"
                        >
                          <span className="truncate pr-2">&bull; {s.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            PKR {s.basePrice}
                          </span>
                        </div>
                      ))}
                      {assignedServices.length > 3 && (
                        <div className="text-[10px] text-indigo-500 font-medium">
                          +{assignedServices.length - 3} more service(s)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      No services linked yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-sm">
                {editingCategory ? 'Edit Category' : 'Create Shop Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Document & Thesis Printing"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe the services and paper types grouped in this category..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Visual Icon
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="FileText">FileText (Standard Docs)</option>
                    <option value="Maximize2">Maximize2 (Large Format/CAD)</option>
                    <option value="BookOpen">BookOpen (Binding/Thesis)</option>
                    <option value="Briefcase">Briefcase (Commercial/Legal)</option>
                    <option value="Copy">Copy (Photocopy/Volume)</option>
                    <option value="Palette">Palette (Photo/Fine Art)</option>
                    <option value="GraduationCap">GraduationCap (Academic/Campus)</option>
                    <option value="FolderOpen">FolderOpen (Coursepacks)</option>
                    <option value="Layers">Layers (General Specialty)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Sequence Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Category is active and visible in customer QR order portal
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
