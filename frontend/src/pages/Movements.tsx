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
        <h1 className="text-2xl font-bold text-white tracking-tight">Stock Movements Ledger</h1>
        <p className="text-sm text-slate-400">
          Complete immutable audit stream of all inventory receipts, issues, transfers, and adjustments
        </p>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Movement Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Movement Types</option>
              <option value="RECEIPT">RECEIPT (Inbound)</option>
              <option value="ISSUE">ISSUE (Outbound)</option>
              <option value="TRANSFER">TRANSFER (Inter-facility)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Audit Reconciliation)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Location Filter
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/80 bg-slate-900/50">
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
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />
                    <span>Querying ledger transactions...</span>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No ledger records match the selected filters.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  let badgeClass = '';
                  let icon = null;

                  if (m.type === 'RECEIPT') {
                    badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                    icon = <ArrowDownToLine className="w-3.5 h-3.5" />;
                  } else if (m.type === 'ISSUE') {
                    badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                    icon = <ArrowUpFromLine className="w-3.5 h-3.5" />;
                  } else if (m.type === 'TRANSFER') {
                    badgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                    icon = <Repeat className="w-3.5 h-3.5" />;
                  } else {
                    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                    icon = <Sliders className="w-3.5 h-3.5" />;
                  }

                  return (
                    <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-bold border ${badgeClass}`}>
                          {icon}
                          <span>{m.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{m.item?.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{m.item?.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={m.type === 'ISSUE' ? 'text-rose-400' : 'text-emerald-400'}>
                          {m.type === 'ISSUE' ? `-${m.quantity}` : m.type === 'ADJUSTMENT' ? (m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`) : `+${m.quantity}`}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">{m.item?.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        {m.type === 'TRANSFER' ? (
                          <span className="font-medium text-indigo-300">
                            {m.sourceLocation?.code} → {m.destinationLocation?.code}
                          </span>
                        ) : m.destinationLocation ? (
                          <span>Dest: {m.destinationLocation.name}</span>
                        ) : m.sourceLocation ? (
                          <span>Src: {m.sourceLocation.name}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {m.reference ? (
                          <span className="font-mono text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                            {m.reference}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        {m.notes && <div className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-xs">{m.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        <div className="font-medium">{m.user?.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{m.user?.role}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                        {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-700/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{movements.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{pagination.totalCount}</span> ledger movements
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>
              Page <span className="font-semibold text-slate-200">{pagination.currentPage}</span> of{' '}
              <span className="font-semibold text-slate-200">{pagination.totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
