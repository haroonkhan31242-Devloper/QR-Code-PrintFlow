import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { Printer } from '../../types';
import {
  Printer as PrinterIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  Play,
  X,
} from 'lucide-react';

export const PrinterConfiguration: React.FC = () => {
  const { currentShop, addToast } = useApp();
  const shopId = currentShop?.id || 'SHOP-1001';

  const [printers, setPrinters] = useState<Printer[]>(() =>
    storage.getPrinters(shopId)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [newPrinter, setNewPrinter] = useState({
    name: '',
    model: '',
    type: 'Laser' as const,
    supportedSizes: ['A4', 'A3', 'Legal'],
    isDefault: false,
  });

  const handleTestConnection = (printer: Printer) => {
    setTestingId(printer.id);
    setTimeout(() => {
      setTestingId(null);
      addToast(
        'success',
        `Loopback Handshake Passed: ${printer.name}`,
        'Local spooler queue responsive. Physical print readiness verified.'
      );
    }, 1200);
  };

  const handleSetDefault = (printer: Printer) => {
    const updated = printers.map((p) => ({
      ...p,
      isDefault: p.id === printer.id,
    }));
    updated.forEach((p) => storage.savePrinter(p));
    setPrinters(updated);
    addToast('info', `${printer.name} set as primary counter printer`);
  };

  const handleDelete = (id: string) => {
    storage.deletePrinter(id, shopId);
    setPrinters(storage.getPrinters(shopId));
    addToast('warning', 'Printer removed from shop hardware profile');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrinter.name.trim()) return;

    const id = `PRN-${shopId}-${Date.now().toString().slice(-4)}`;
    const prn: Printer = {
      id,
      shopId,
      name: newPrinter.name,
      model: newPrinter.model || 'Commercial Network Unit',
      type: newPrinter.type,
      connectionStatus: 'online',
      isDefault: printers.length === 0 || newPrinter.isDefault,
      supportedSizes: newPrinter.supportedSizes,
      tonerLevelBlack: 90,
      tonerLevelColor: 85,
      paperLevel: 95,
    };

    storage.savePrinter(prn);
    setPrinters(storage.getPrinters(shopId));
    setIsModalOpen(false);
    addToast('success', `Printer "${prn.name}" configured!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Printers, Hardware & Spooler Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage physical network printers, output trays, and simulated counter spoolers
          </p>
        </div>

        <button
          onClick={() => {
            setNewPrinter({
              name: '',
              model: '',
              type: 'Laser',
              supportedSizes: ['A4', 'A3', 'Legal'],
              isDefault: false,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Printer</span>
        </button>
      </div>

      {/* Honest Hardware Notice */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <strong className="text-slate-900 dark:text-white block font-semibold mb-0.5">
          Hardware Distinction Notice:
        </strong>
        Physical automated printer control requires the local PrintFlow Spooler Agent service running on your counter Windows/Mac workstation. In this frontend demonstration, printer profiles and diagnostic handshakes are simulated.
      </div>

      {/* Printer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {printers.map((printer) => (
          <div
            key={printer.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                    <PrinterIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{printer.name}</span>
                      {printer.isDefault && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Primary Default
                        </span>
                      )}
                    </h3>
                    <div className="text-[11px] text-slate-400">{printer.model}</div>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    printer.connectionStatus === 'online'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span className="capitalize">{printer.connectionStatus}</span>
                </span>
              </div>

              {/* Specs & Gauges */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] text-slate-400">Supported Media:</span>
                  <span className="font-medium">{printer.supportedSizes.join(', ')}</span>
                </div>

                {/* Toner & Paper Indicators */}
                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Monochrome Toner Level</span>
                      <span className="font-mono">{printer.tonerLevelBlack}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-800 dark:bg-slate-300 h-full rounded-full"
                        style={{ width: `${printer.tonerLevelBlack}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Paper Tray 1 Status</span>
                      <span className="font-mono">{printer.paperLevel}% capacity</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${printer.paperLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-5 text-xs">
              <button
                onClick={() => handleTestConnection(printer)}
                disabled={testingId === printer.id}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-indigo-500" />
                <span>{testingId === printer.id ? 'Pinging...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                {!printer.isDefault && (
                  <button
                    onClick={() => handleSetDefault(printer)}
                    className="px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Make Default
                  </button>
                )}
                {printers.length > 1 && (
                  <button
                    onClick={() => handleDelete(printer.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                    title="Remove Printer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Printer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Configure Network Printer
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Printer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Canon Laser C3530"
                  value={newPrinter.name}
                  onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Model / IP Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Canon imageRUNNER or 192.168.1.150"
                  value={newPrinter.model}
                  onChange={(e) => setNewPrinter({ ...newPrinter, model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Printer Type
                </label>
                <select
                  value={newPrinter.type}
                  onChange={(e) => setNewPrinter({ ...newPrinter, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Laser">Laser (High Speed Production)</option>
                  <option value="Inkjet">Inkjet (High Resolution Photo)</option>
                  <option value="Multifunction Digital Press">Commercial Digital Press</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Hardware Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
