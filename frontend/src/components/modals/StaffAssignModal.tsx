import React, { useState, useEffect } from 'react';
import { X, UserCheck, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { User, Location } from '../../types/index.js';

interface StaffAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToAssign: User | null;
}

export const StaffAssignModal: React.FC<StaffAssignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userToAssign,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get('/locations');
        if (res.data.success) {
          setLocations(res.data.data.filter((l: Location) => l.isActive));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load locations');
      }
    };
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (userToAssign?.assignedLocations) {
      setSelectedLocationIds(userToAssign.assignedLocations.map((l) => l.id));
    } else {
      setSelectedLocationIds([]);
    }
  }, [userToAssign]);

  if (!isOpen || !userToAssign) return null;

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId) ? prev.filter((id) => id !== locationId) : [...prev, locationId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await api.post('/auth/assign-locations', {
        userId: userToAssign.id,
        locationIds: selectedLocationIds,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign locations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold">
            <UserCheck className="w-5 h-5" />
            <span>Assign Locations to Staff</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="text-sm font-semibold text-slate-200">{userToAssign.name}</div>
            <div className="text-xs text-slate-400">{userToAssign.email}</div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Permitted Locations:
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {locations.map((loc) => {
                const isSelected = selectedLocationIds.includes(loc.id);
                return (
                  <label
                    key={loc.id}
                    onClick={() => toggleLocation(loc.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 text-indigo-200'
                        : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-700/40'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{loc.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{loc.code} • {loc.type}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Permissions</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
