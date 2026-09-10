import React, { useState, useEffect } from 'react';
import { X, ArrowDownToLine, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { Item, Location } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultItemId?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
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
          // If staff, filter to allowed locations
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedItemId) {
      setError('Please select an item.');
      return;
    }
    if (!selectedLocationId) {
      setError('Please select a destination location.');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/movements/receipt', {
        itemId: selectedItemId,
        destinationLocationId: selectedLocationId,
        quantity: Number(quantity),
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record stock receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold">
            <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
            <span className="text-slate-900 font-semibold">Record Stock Receipt</span>
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
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              required
            >
              <option value="">-- Choose item to receive --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name} ({item.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Destination Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              required
            >
              <option value="">-- Choose destination location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Quantity Received <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Reference / PO Number
            </label>
            <input
              type="text"
              placeholder="e.g. PO-2026-9912"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Vendor notes, invoice details, batch number..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
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
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Confirm Receipt</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
