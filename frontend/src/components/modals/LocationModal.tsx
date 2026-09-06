import React, { useState, useEffect } from 'react';
import { X, Warehouse, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { Location } from '../../types/index.js';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locationToEdit?: Location | null;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  locationToEdit,
}) => {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [type, setType] = useState<string>('WAREHOUSE');
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (locationToEdit) {
      setName(locationToEdit.name);
      setCode(locationToEdit.code);
      setType(locationToEdit.type || 'WAREHOUSE');
      setAddress(locationToEdit.address || '');
    } else {
      setName('');
      setCode('');
      setType('WAREHOUSE');
      setAddress('');
    }
  }, [locationToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Location name is required.');
      return;
    }
    if (!code.trim()) {
      setError('Location code is required.');
      return;
    }

    try {
      setLoading(true);
      if (locationToEdit) {
        await api.put(`/locations/${locationToEdit.id}`, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type,
          address: address.trim() || undefined,
        });
      } else {
        await api.post('/locations', {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type,
          address: address.trim() || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center space-x-2 text-sky-400 font-bold">
            <Warehouse className="w-5 h-5" />
            <span>{locationToEdit ? 'Edit Location' : 'Register New Location'}</span>
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
              Location Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Central Warehouse, Store 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. WH-MAIN"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Facility Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="WAREHOUSE">Warehouse</option>
                <option value="STORE">Retail Store</option>
                <option value="DISTRIBUTION_HUB">Distribution Hub</option>
                <option value="FACTORY">Factory</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Address / Logistics Details
            </label>
            <textarea
              rows={3}
              placeholder="Physical street address, sector, city..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
                <span>{locationToEdit ? 'Save Changes' : 'Create Location'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
