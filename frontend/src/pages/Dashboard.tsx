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
      <div className="h-96 flex items-center justify-center space-x-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="font-medium">Loading Real-time Inventory Analytics...</span>
      </div>
    );
  }

  const { summary, categoryDistribution, locationStockDistribution, weeklyTrends, recentMovements } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock Analytics Dashboard</h1>
          <p className="text-sm text-slate-500">
            Real-time multi-location metrics backed by append-only ledger summation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/inventory"
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <span>Explore Inventory</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Items</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{summary.activeItems}</div>
          <div className="mt-1 text-xs text-blue-600 font-semibold">Catalog items tracked</div>
        </div>

        <Link
          to="/alerts"
          className="bg-white border border-slate-200/90 hover:border-amber-300 rounded-xl p-5 relative overflow-hidden transition-all group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock Items</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-600">{summary.lowStock}</div>
          <div className="mt-1 text-xs text-slate-500 group-hover:text-amber-700 transition-colors flex items-center space-x-1 font-medium">
            <span>Requires replenishment</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Movements</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{summary.todayMovements}</div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold">Ledger entries today</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Moved This Week</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{summary.itemsMovedThisWeek}</div>
          <div className="mt-1 text-xs text-indigo-600 font-semibold">Distinct items active in 7d</div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8-Week Receipt vs Issue Volume Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">8-Week Movement Trends</h2>
              <p className="text-xs text-slate-500">Comparative weekly receipt volume vs issue volume</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrends}>
                <defs>
                  <linearGradient id="receiptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="issueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="weekLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="receipts"
                  name="Inbound Receipts"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#receiptGrad)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="issues"
                  name="Outbound Issues"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#issueGrad)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock by Category & Location Distributions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stock by Category</h2>
              <p className="text-xs text-slate-500">Total units calculated across all locations</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="stock" name="Total Units" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stock by Location Breakdown Cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Location Stock Distribution</h2>
          <p className="text-xs text-slate-500">Current on-hand inventory balances by warehouse / store facility</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {locationStockDistribution.map((loc) => (
            <div key={loc.locationId} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="text-xs font-mono font-bold text-blue-600 uppercase">{loc.code}</div>
              <div className="text-sm font-semibold text-slate-800 mt-1 truncate">{loc.name}</div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">{loc.stock}</span>
                <span className="text-xs text-slate-500 font-medium">units on-hand</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Stock Ledger Activity</h2>
            <p className="text-xs text-slate-500">Live append-only transaction audit stream</p>
          </div>
          <Link
            to="/movements"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Source / Destination</th>
                <th className="py-2.5 px-3">Logged By</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentMovements.map((m) => {
                let badgeClass = '';
                let typeIcon = null;

                if (m.type === 'RECEIPT') {
                  badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  typeIcon = <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />;
                } else if (m.type === 'ISSUE') {
                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  typeIcon = <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-600" />;
                } else if (m.type === 'TRANSFER') {
                  badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  typeIcon = <Repeat className="w-3.5 h-3.5 text-indigo-600" />;
                } else {
                  badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                  typeIcon = <PackageCheck className="w-3.5 h-3.5 text-amber-600" />;
                }

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-bold border ${badgeClass}`}>
                        {typeIcon}
                        <span>{m.type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{m.item?.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{m.item?.sku}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {m.type === 'ISSUE' ? `-${m.quantity}` : m.type === 'ADJUSTMENT' ? (m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`) : `+${m.quantity}`} {m.item?.unit}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">
                      {m.type === 'TRANSFER' ? (
                        <span className="font-semibold text-indigo-700">{m.sourceLocation?.code} → {m.destinationLocation?.code}</span>
                      ) : m.destinationLocation ? (
                        <span>To: {m.destinationLocation.name}</span>
                      ) : m.sourceLocation ? (
                        <span>From: {m.sourceLocation.name}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{m.user?.name}</span>
                      <span className="text-slate-400 ml-1">({m.user?.role})</span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 font-mono">
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

