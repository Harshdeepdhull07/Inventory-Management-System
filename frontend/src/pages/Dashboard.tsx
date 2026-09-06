import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  PackageCheck,
  ChevronRight,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../api/client.js';
import { DashboardData } from '../types/index.js';

export const Dashboard: React.FC = () => {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [refreshKey]);

  if (loading || !data) {
    return (
      <div className="h-96 flex items-center justify-center space-x-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        <span>Loading Real-time Inventory Analytics...</span>
      </div>
    );
  }

  const { summary, categoryDistribution, locationStockDistribution, weeklyTrends, recentMovements } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Stock Analytics Dashboard</h1>
          <p className="text-sm text-slate-400">
            Real-time multi-location metrics backed by append-only ledger summation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/inventory"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-colors flex items-center space-x-1.5"
          >
            <span>Explore Inventory</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Items</span>
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{summary.activeItems}</div>
          <div className="mt-1 text-xs text-sky-400 font-medium">Catalog items tracked</div>
        </div>

        <Link
          to="/alerts"
          className="bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/40 rounded-xl p-5 relative overflow-hidden transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Items</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-400">{summary.lowStock}</div>
          <div className="mt-1 text-xs text-slate-400 group-hover:text-amber-300 transition-colors flex items-center space-x-1">
            <span>Requires replenishment</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Movements</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{summary.todayMovements}</div>
          <div className="mt-1 text-xs text-emerald-400 font-medium">Ledger entries today</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Moved This Week</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{summary.itemsMovedThisWeek}</div>
          <div className="mt-1 text-xs text-indigo-400 font-medium">Distinct items active in 7d</div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8-Week Receipt vs Issue Volume Chart */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">8-Week Movement Trends</h2>
              <p className="text-xs text-slate-400">Comparative weekly receipt volume vs issue volume</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrends}>
                <defs>
                  <linearGradient id="receiptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="issueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="weekLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="receipts"
                  name="Inbound Receipts"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#receiptGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="issues"
                  name="Outbound Issues"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#issueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock by Category & Location Distributions */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">Stock by Category</h2>
              <p className="text-xs text-slate-400">Total units calculated across all locations</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#cbd5e1"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="stock" name="Total Units" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock by Location Breakdown Cards */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-100">Location Stock Distribution</h2>
          <p className="text-xs text-slate-400">Current on-hand inventory balances by warehouse / store facility</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {locationStockDistribution.map((loc) => (
            <div key={loc.locationId} className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/70">
              <div className="text-xs font-mono font-bold text-sky-400 uppercase">{loc.code}</div>
              <div className="text-sm font-semibold text-slate-200 mt-1 truncate">{loc.name}</div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white">{loc.stock}</span>
                <span className="text-xs text-slate-400 font-medium">units on-hand</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Recent Stock Ledger Activity</h2>
            <p className="text-xs text-slate-400">Live append-only transaction audit stream</p>
          </div>
          <Link
            to="/movements"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center space-x-1"
          >
            <span>View Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/80 bg-slate-900/40">
              <tr>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Source / Destination</th>
                <th className="py-2.5 px-3">Logged By</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentMovements.map((m) => {
                let badgeClass = '';
                let typeIcon = null;

                if (m.type === 'RECEIPT') {
                  badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  typeIcon = <ArrowDownToLine className="w-3.5 h-3.5" />;
                } else if (m.type === 'ISSUE') {
                  badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                  typeIcon = <ArrowUpFromLine className="w-3.5 h-3.5" />;
                } else if (m.type === 'TRANSFER') {
                  badgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                  typeIcon = <Repeat className="w-3.5 h-3.5" />;
                } else {
                  badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  typeIcon = <PackageCheck className="w-3.5 h-3.5" />;
                }

                return (
                  <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-bold border ${badgeClass}`}>
                        {typeIcon}
                        <span>{m.type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{m.item?.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{m.item?.sku}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-100">
                      {m.type === 'ISSUE' ? `-${m.quantity}` : m.type === 'ADJUSTMENT' ? (m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`) : `+${m.quantity}`} {m.item?.unit}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-300">
                      {m.type === 'TRANSFER' ? (
                        <span>{m.sourceLocation?.code} → {m.destinationLocation?.code}</span>
                      ) : m.destinationLocation ? (
                        <span>To: {m.destinationLocation.name}</span>
                      ) : m.sourceLocation ? (
                        <span>From: {m.sourceLocation.name}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-300">
                      <span className="font-medium">{m.user?.name}</span>
                      <span className="text-slate-500 ml-1">({m.user?.role})</span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400 font-mono">
                      {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
