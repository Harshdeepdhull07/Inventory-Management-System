import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/client.js';
import { Location, User } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { LocationModal } from '../components/modals/LocationModal.js';
import { StaffAssignModal } from '../components/modals/StaffAssignModal.js';

export const Locations: React.FC = () => {
  const { refreshKey, triggerGlobalRefresh } = useOutletContext<{
    refreshKey: number;
    triggerGlobalRefresh: () => void;
  }>();
  const { isManager } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [locModalOpen, setLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState<User | null>(null);

  const fetchLocationsData = async () => {
    try {
      const [locRes, usersRes] = await Promise.all([
        api.get('/locations'),
        isManager ? api.get('/auth/users') : Promise.resolve({ data: { success: false } }),
      ]);
      if (locRes.data.success) setLocations(locRes.data.data);
      if (usersRes.data?.success) setUsers(usersRes.data.data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  useEffect(() => {
    fetchLocationsData();
  }, [refreshKey]);

  const handleToggleActive = async (id: string) => {
    if (!confirm('Are you sure you want to change this location status?')) return;
    try {
      await api.patch(`/locations/${id}/toggle`);
      triggerGlobalRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle location');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Warehouses & Locations</h1>
          <p className="text-sm text-slate-500">
            Multi-facility management with granular staff access control
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => {
              setEditingLoc(null);
              setLocModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Facility</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className={`bg-white border rounded-xl p-5 space-y-4 shadow-xs transition-colors ${
              loc.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-rose-200 opacity-80 bg-rose-50/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {loc.code}
                  </span>
                  <span className="text-xs uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {loc.type}
                  </span>
                  {loc.isActive ? (
                    <span className="flex items-center space-x-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Inactive</span>
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{loc.name}</h3>
                {loc.address && <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>}
              </div>

              {isManager && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingLoc(loc);
                      setLocModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(loc.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                      loc.isActive
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    {loc.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Authorized Warehouse Staff ({loc.assignedUsers?.length || 0}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {loc.assignedUsers && loc.assignedUsers.length > 0 ? (
                  loc.assignedUsers.map((au) => (
                    <span
                      key={au.user.id}
                      className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium"
                    >
                      {au.user.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No specific staff assigned (Managers only)</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isManager && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mt-8 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold">
            <UserCheck className="w-5 h-5" />
            <h2>Staff-Location Permission Matrix</h2>
          </div>
          <p className="text-xs text-slate-500">
            Enforce granular location boundaries. Staff can strictly receipt, issue, and transfer at assigned facilities only.
          </p>

          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{u.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                        u.role === 'MANAGER'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {u.role === 'MANAGER' ? (
                      <span className="text-amber-700 font-medium">Global Access (All Facilities)</span>
                    ) : u.assignedLocations && u.assignedLocations.length > 0 ? (
                      <span>
                        Assigned to:{' '}
                        <span className="text-blue-700 font-semibold">
                          {u.assignedLocations.map((l) => l.name).join(', ')}
                        </span>
                      </span>
                    ) : (
                      <span className="text-rose-600 font-medium">No facilities assigned</span>
                    )}
                  </div>
                </div>

                {u.role === 'STAFF' && (
                  <button
                    onClick={() => {
                      setUserToAssign(u);
                      setAssignModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto shadow-2xs"
                  >
                    Manage Assigned Locations
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {locModalOpen && (
        <LocationModal
          isOpen={locModalOpen}
          onClose={() => setLocModalOpen(false)}
          onSuccess={triggerGlobalRefresh}
          locationToEdit={editingLoc}
        />
      )}
      {assignModalOpen && (
        <StaffAssignModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={triggerGlobalRefresh}
          userToAssign={userToAssign}
        />
      )}
    </div>
  );
};

