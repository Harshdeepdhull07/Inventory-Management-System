import React, { useState, useEffect } from 'react';
import { X, ArrowUpFromLine, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { Item, Location } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultItemId?: string;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultItemId,
}) => {
  const { user, isManager } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>(defaultItemId || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, locsRes] = await Promise.all([
          api.get('/items?limit=100&status=ACTIVE'),
          api.get('/locations'),
        ]);
        if (itemsRes.data.success) setItems(itemsRes.data.data);
        if (locsRes.data.success) {
          const allLocs: Location[] = locsRes.data.data.filter((l: Location) => l.isActive);
          const availableLocs = isManager
            ? allLocs
            : allLocs.filter((l) => user?.assignedLocations?.some((al) => al.id === l.id));
          setLocations(availableLocs);
          if (availableLocs.length > 0 && !selectedLocationId) {
            setSelectedLocationId(availableLocs[0].id);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load options');
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, isManager, user]);

  useEffect(() => {
    if (defaultItemId) {
      setSelectedItemId(defaultItemId);
    }
  }, [defaultItemId]);

  // Fetch available stock when item or source location changes
  useEffect(() => {
    const checkStock = async () => {
      if (selectedItemId && selectedLocationId) {
        try {
          const res = await api.get(`/items/${selectedItemId}`);
          if (res.data.success) {
            const locBreakdown = res.data.data.breakdown.find(
              (b: any) => b.locationId === selectedLocationId
            );
            setAvailableStock(locBreakdown ? locBreakdown.stock : 0);
          }
        } catch {
          setAvailableStock(null);
        }
      } else {
        setAvailableStock(null);
      }
    };
    checkStock();
  }, [selectedItemId, selectedLocationId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedItemId) {
      setError('Please select an item.');
      return;
    }
    if (!selectedLocationId) {
      setError('Please select a source location.');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (availableStock !== null && quantity > availableStock) {
      setError(`Cannot issue ${quantity} units. Only ${availableStock} units available at this location.`);
      return;
    }

    try {
      setLoading(true);
      await api.post('/movements/issue', {
        itemId: selectedItemId,
        sourceLocationId: selectedLocationId,
        quantity: Number(quantity),
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record stock issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center space-x-2 text-rose-700 font-bold">
            <ArrowUpFromLine className="w-5 h-5 text-rose-600" />
            <span className="text-slate-900 font-semibold">Record Stock Issue</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Item <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-colors"
              required
            >
              <option value="">-- Choose item to issue --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Source Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-colors"
              required
            >
              <option value="">-- Choose source location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          {availableStock !== null && (
            <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
              availableStock > 0
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <span>Current Stock at selected location:</span>
              <span className="font-bold text-sm">{availableStock} units</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Quantity to Issue <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={availableStock !== null ? availableStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Sales Order / Work Order Reference
            </label>
            <input
              type="text"
              placeholder="e.g. SO-CP-4401"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Issue Notes
            </label>
            <textarea
              rows={2}
              placeholder="Customer name, department requisition, dispatch notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-colors"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (availableStock !== null && availableStock < 1)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Issuing...</span>
                </>
              ) : (
                <span>Confirm Issue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
