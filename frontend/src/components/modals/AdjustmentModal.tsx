import React, { useState, useEffect } from 'react';
import { X, Sliders, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/client.js';
import { Item, Location } from '../../types/index.js';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultItemId?: string;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultItemId,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>(defaultItemId || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [deltaQuantity, setDeltaQuantity] = useState<number>(0);
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
          const locs: Location[] = locsRes.data.data.filter((l: Location) => l.isActive);
          setLocations(locs);
          if (locs.length > 0 && !selectedLocationId) {
            setSelectedLocationId(locs[0].id);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load options');
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (defaultItemId) {
      setSelectedItemId(defaultItemId);
    }
  }, [defaultItemId]);

  useEffect(() => {
    const checkStock = async () => {
      if (selectedItemId && selectedLocationId) {
        try {
          const res = await api.get(`/items/${selectedItemId}`);
          if (res.data.success) {
            const locBreakdown = res.data.data.breakdown.find(
              (b: any) => b.locationId === selectedLocationId
            );
            setCurrentStock(locBreakdown ? locBreakdown.stock : 0);
          }
        } catch {
          setCurrentStock(null);
        }
      } else {
        setCurrentStock(null);
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
      setError('Please select a location.');
      return;
    }
    if (deltaQuantity === 0) {
      setError('Delta quantity cannot be 0.');
      return;
    }
    if (!notes || notes.trim().length < 3) {
      setError('A valid audit reason is strictly mandatory for stock adjustments.');
      return;
    }

    const projected = (currentStock || 0) + deltaQuantity;
    if (projected < 0) {
      setError(`Adjustment of ${deltaQuantity} results in negative stock (${projected}).`);
      return;
    }

    try {
      setLoading(true);
      await api.post('/movements/adjustment', {
        itemId: selectedItemId,
        locationId: selectedLocationId,
        deltaQuantity: Number(deltaQuantity),
        reference: reference.trim() || undefined,
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record adjustment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-amber-600/50 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-amber-950/20">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <Sliders className="w-5 h-5" />
            <span>Stock Adjustment (Manager Only)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-300/90 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              Adjustments append directly to the immutable stock ledger with a permanent audit record and reason.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Select Item <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">-- Choose item to adjust --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Location <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">-- Choose location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          {currentStock !== null && (
            <div className="p-2 bg-slate-900/60 rounded-lg text-xs font-medium border border-slate-700 flex items-center justify-between text-slate-300">
              <span>Current Stock at Location:</span>
              <span className="font-bold text-sm text-slate-100">{currentStock} units</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Adjustment Delta (+ or -) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. +5 or -2"
              value={deltaQuantity}
              onChange={(e) => setDeltaQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              required
            />
            {currentStock !== null && deltaQuantity !== 0 && (
              <p className="text-[11px] text-slate-400 mt-1">
                Projected New Balance:{' '}
                <span className={`font-bold ${currentStock + deltaQuantity < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {currentStock + deltaQuantity} units
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Audit Reference / Ticket ID
            </label>
            <input
              type="text"
              placeholder="e.g. AUDIT-2026-Q3-01"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Mandatory Reason / Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Physical count discrepancy, damaged write-off, unrecorded return..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              required
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
              disabled={loading || deltaQuantity === 0}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adjusting...</span>
                </>
              ) : (
                <span>Commit Adjustment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
