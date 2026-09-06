import React, { useState, useEffect } from 'react';
import { X, Repeat, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { Item, Location } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultItemId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultItemId,
}) => {
  const { user, isManager } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [sourceLocations, setSourceLocations] = useState<Location[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>(defaultItemId || '');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedDestId, setSelectedDestId] = useState<string>('');
  const [sourceStock, setSourceStock] = useState<number | null>(null);
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
          const locs: Location[] = locsRes.data.data.filter((l: Location) => l.isActive);
          setAllLocations(locs);
          const allowedSource = isManager
            ? locs
            : locs.filter((l) => user?.assignedLocations?.some((al) => al.id === l.id));
          setSourceLocations(allowedSource);
          if (allowedSource.length > 0 && !selectedSourceId) {
            setSelectedSourceId(allowedSource[0].id);
          }
          if (locs.length > 1 && !selectedDestId) {
            const defaultDest = locs.find((l) => l.id !== allowedSource[0]?.id);
            if (defaultDest) setSelectedDestId(defaultDest.id);
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

  useEffect(() => {
    const checkStock = async () => {
      if (selectedItemId && selectedSourceId) {
        try {
          const res = await api.get(`/items/${selectedItemId}`);
          if (res.data.success) {
            const locBreakdown = res.data.data.breakdown.find(
              (b: any) => b.locationId === selectedSourceId
            );
            setSourceStock(locBreakdown ? locBreakdown.stock : 0);
          }
        } catch {
          setSourceStock(null);
        }
      } else {
        setSourceStock(null);
      }
    };
    checkStock();
  }, [selectedItemId, selectedSourceId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedItemId) {
      setError('Please select an item.');
      return;
    }
    if (!selectedSourceId || !selectedDestId) {
      setError('Please select both source and destination locations.');
      return;
    }
    if (selectedSourceId === selectedDestId) {
      setError('Source and destination locations cannot be identical.');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (sourceStock !== null && quantity > sourceStock) {
      setError(`Cannot transfer ${quantity} units. Only ${sourceStock} available at source location.`);
      return;
    }

    try {
      setLoading(true);
      await api.post('/movements/transfer', {
        itemId: selectedItemId,
        sourceLocationId: selectedSourceId,
        destinationLocationId: selectedDestId,
        quantity: Number(quantity),
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete stock transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold">
            <Repeat className="w-5 h-5" />
            <span>Atomic Stock Transfer</span>
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Select Item <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="">-- Choose item to transfer --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                From (Source) <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">-- Select Source --</option>
                {sourceLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code} ({loc.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                To (Destination) <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">-- Select Dest --</option>
                {allLocations
                  .filter((l) => l.id !== selectedSourceId)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} ({loc.name})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {sourceStock !== null && (
            <div className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-between ${
              sourceStock > 0
                ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}>
              <span>Available at Source:</span>
              <span className="font-bold text-sm">{sourceStock} units</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Quantity to Transfer <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={sourceStock !== null ? sourceStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Transfer Manifest / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. TR-2026-9102"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Transfer Notes
            </label>
            <textarea
              rows={2}
              placeholder="Courier tracking, transport truck ID, reason for replenishment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
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
              disabled={loading || (sourceStock !== null && sourceStock < 1)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <span>Execute Transfer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
