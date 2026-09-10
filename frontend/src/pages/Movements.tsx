import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Sliders,
  Loader2
} from 'lucide-react';
import api from '../api/client.js';
import { StockMovement, Location, PaginationMeta } from '../types/index.js';

export const Movements: React.FC = () => {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15,
  });

  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get('/locations');
        if (res.data.success) setLocations(res.data.data);
      } catch (err) {
        console.error('Failed to load locations:', err);
      }
    };
    fetchLocations();
  }, []);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: selectedType,
        locationId: selectedLocation,
        startDate,
        endDate,
        page: page.toString(),
        limit: '15',
      });

      const res = await api.get(`/movements?${params.toString()}`);
      if (res.data.success) {
        setMovements(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load movements:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedLocation, startDate, endDate, page, refreshKey]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock Movements Ledger</h1>
        <p className="text-sm text-slate-500">
          Complete immutable audit stream of all inventory receipts, issues, transfers, and adjustments
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Movement Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Movement Types</option>
              <option value="RECEIPT">RECEIPT (Inbound)</option>
              <option value="ISSUE">ISSUE (Outbound)</option>
              <option value="TRANSFER">TRANSFER (Inter-facility)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Audit Reconciliation)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Location Filter
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Item (SKU)</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Facility / Route</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Logged By</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Querying ledger transactions...</span>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No ledger records match the selected filters.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  let badgeClass = '';
                  let icon = null;

                  if (m.type === 'RECEIPT') {
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    icon = <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />;
                  } else if (m.type === 'ISSUE') {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    icon = <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-600" />;
                  } else if (m.type === 'TRANSFER') {
                    badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    icon = <Repeat className="w-3.5 h-3.5 text-indigo-600" />;
                  } else {
                    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                    icon = <Sliders className="w-3.5 h-3.5 text-amber-600" />;
                  }

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-bold border ${badgeClass}`}>
                          {icon}
                          <span>{m.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.item?.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{m.item?.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={m.type === 'ISSUE' ? 'text-rose-600' : 'text-emerald-600'}>
                          {m.type === 'ISSUE' ? `-${m.quantity}` : m.type === 'ADJUSTMENT' ? (m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`) : `+${m.quantity}`}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">{m.item?.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {m.type === 'TRANSFER' ? (
                          <span className="font-semibold text-indigo-700">
                            {m.sourceLocation?.code} → {m.destinationLocation?.code}
                          </span>
                        ) : m.destinationLocation ? (
                          <span>Dest: <strong className="text-slate-800">{m.destinationLocation.name}</strong></span>
                        ) : m.sourceLocation ? (
                          <span>Src: <strong className="text-slate-800">{m.sourceLocation.name}</strong></span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {m.reference ? (
                          <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {m.reference}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {m.notes && <div className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-xs">{m.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        <div className="font-semibold text-slate-800">{m.user?.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{m.user?.role}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{movements.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.totalCount}</span> ledger movements
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Previous
            </button>
            <span>
              Page <span className="font-semibold text-slate-800">{pagination.currentPage}</span> of{' '}
              <span className="font-semibold text-slate-800">{pagination.totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

