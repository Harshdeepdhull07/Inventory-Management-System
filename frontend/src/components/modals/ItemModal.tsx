import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { Item, Category } from '../../types/index.js';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: Item | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  itemToEdit,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sku, setSku] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [unit, setUnit] = useState<string>('pcs');
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.data);
          if (res.data.data.length > 0 && !categoryId) {
            setCategoryId(res.data.data[0].id);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load categories');
      }
    };
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (itemToEdit) {
      setSku(itemToEdit.sku);
      setName(itemToEdit.name);
      setDescription(itemToEdit.description || '');
      setUnit(itemToEdit.unit || 'pcs');
      setReorderLevel(itemToEdit.reorderLevel || 10);
      setCategoryId(itemToEdit.categoryId);
    } else {
      setSku('');
      setName('');
      setDescription('');
      setUnit('pcs');
      setReorderLevel(10);
      if (categories.length > 0) setCategoryId(categories[0].id);
    }
  }, [itemToEdit, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sku.trim()) {
      setError('SKU is required.');
      return;
    }
    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!categoryId) {
      setError('Category is required.');
      return;
    }

    try {
      setLoading(true);
      if (itemToEdit) {
        await api.put(`/items/${itemToEdit.id}`, {
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          unit: unit.trim() || 'pcs',
          reorderLevel: Number(reorderLevel),
          categoryId,
        });
      } else {
        await api.post('/items', {
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          unit: unit.trim() || 'pcs',
          reorderLevel: Number(reorderLevel),
          categoryId,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center space-x-2 text-sky-400 font-bold">
            <PackagePlus className="w-5 h-5" />
            <span>{itemToEdit ? 'Edit Item Details' : 'Add New Inventory Item'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                SKU (Stock Keeping Unit) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ELEC-KB-001"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Item Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mechanical Keyboard (RGB Brown Switch)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                placeholder="e.g. pcs, box, kg, roll"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Reorder Level (Alert Threshold)
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              placeholder="Technical specs, supplier info, dimensions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{itemToEdit ? 'Save Changes' : 'Create Item'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
