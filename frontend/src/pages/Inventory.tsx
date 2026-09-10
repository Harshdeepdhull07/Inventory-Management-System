import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Search,
  Plus,
  ArrowUpDown,
  History,
  Archive,
  RotateCcw,
  Edit,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Sliders,
  Loader2,
  PackageX
} from 'lucide-react';
import api from '../api/client.js';
import { Item, Category, Location, PaginationMeta } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { ItemModal } from '../components/modals/ItemModal.js';
import { ReceiptModal } from '../components/modals/ReceiptModal.js';
import { IssueModal } from '../components/modals/IssueModal.js';
import { TransferModal } from '../components/modals/TransferModal.js';
import { AdjustmentModal } from '../components/modals/AdjustmentModal.js';

export const Inventory: React.FC = () => {
  const { refreshKey, triggerGlobalRefresh } = useOutletContext<{
    refreshKey: number;
    triggerGlobalRefresh: () => void;
  }>();
  const { isManager } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const [itemModalOpen, setItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [issueModalOpen, setIssueModalOpen] = useState<boolean>(false);
  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState<boolean>(false);
  const [targetItemId, setTargetItemId] = useState<string>('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          api.get('/categories'),
          api.get('/locations'),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (locRes.data.success) setLocations(locRes.data.data);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        categoryId: selectedCategory,
        locationId: selectedLocation,
        status,
        lowStockOnly: lowStockOnly ? 'true' : 'false',
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: '10',
      });

      const res = await api.get(`/items?${params.toString()}`);
      if (res.data.success) {
        setItems(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load inventory items:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedLocation, status, lowStockOnly, sortBy, sortOrder, page, refreshKey]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleArchive = async (itemId: string) => {
    if (!confirm('Are you sure you want to archive this item? It will be hidden from daily operations.')) return;
    try {
      await api.patch(`/items/${itemId}/archive`);
      triggerGlobalRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive item');
    }
  };

  const handleRestore = async (itemId: string) => {
    try {
      await api.patch(`/items/${itemId}/restore`);
      triggerGlobalRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to restore item');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory Matrix</h1>
          <p className="text-sm text-slate-500">
            Catalog view with real-time append-only stock calculations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isManager && (
            <button
              onClick={() => {
                setEditingItem(null);
                setItemModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, item name, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Locations Combined</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status:</span>
            {['ACTIVE', 'ARCHIVED', 'ALL'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                  status === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
            />
            <span className="text-amber-700 flex items-center space-x-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Show Low Stock Only</span>
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th
                  onClick={() => handleSort('sku')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Item Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('currentStock')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Current Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('reorderLevel')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Reorder Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Calculating ledger balances...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <PackageX className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <span>No inventory items found matching your filters.</span>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow = item.isLowStock;
                  const isArchived = item.status === 'ARCHIVED';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isArchived ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-xs font-bold text-blue-600">
                        <Link to={`/items/${item.id}`} className="hover:underline">
                          {item.sku}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/items/${item.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                          {item.name}
                        </Link>
                        {item.description && (
                          <div className="text-xs text-slate-500 truncate max-w-xs">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          {item.category?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isLow && (
                            <span title="Stock at or below reorder level">
                              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                            </span>
                          )}
                          <span
                            className={`font-mono text-base font-extrabold ${
                              isLow ? 'text-amber-600' : 'text-slate-900'
                            }`}
                          >
                            {item.currentStock ?? 0}
                          </span>
                          <span className="text-xs text-slate-500">{item.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-600">
                        {item.reorderLevel} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link
                            to={`/items/${item.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View Immutable Audit Timeline"
                          >
                            <History className="w-4 h-4" />
                          </Link>

                          {!isArchived && (
                            <>
                              <button
                                onClick={() => {
                                  setTargetItemId(item.id);
                                  setReceiptModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Receive Stock"
                              >
                                <ArrowDownToLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setTargetItemId(item.id);
                                  setIssueModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Issue Stock"
                              >
                                <ArrowUpFromLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setTargetItemId(item.id);
                                  setTransferModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Transfer Stock"
                              >
                                <Repeat className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isManager && (
                            <>
                              {!isArchived && (
                                <button
                                  onClick={() => {
                                    setTargetItemId(item.id);
                                    setAdjustmentModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                  title="Stock Adjustment (Manager)"
                                >
                                  <Sliders className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setItemModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="Edit Item Details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {item.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleArchive(item.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                  title="Archive Item (Soft-delete)"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRestore(item.id)}
                                  className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  title="Restore Item"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
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
            Showing <span className="font-semibold text-slate-800">{items.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.totalCount}</span> items
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

      {itemModalOpen && (
        <ItemModal
          isOpen={itemModalOpen}
          onClose={() => setItemModalOpen(false)}
          onSuccess={triggerGlobalRefresh}
          itemToEdit={editingItem}
        />
      )}
      {receiptModalOpen && (
        <ReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          onSuccess={triggerGlobalRefresh}
          defaultItemId={targetItemId}
        />
      )}
      {issueModalOpen && (
        <IssueModal
          isOpen={issueModalOpen}
          onClose={() => setIssueModalOpen(false)}
          onSuccess={triggerGlobalRefresh}
          defaultItemId={targetItemId}
        />
      )}
      {transferModalOpen && (
        <TransferModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          onSuccess={triggerGlobalRefresh}
          defaultItemId={targetItemId}
        />
      )}
      {adjustmentModalOpen && (
        <AdjustmentModal
          isOpen={adjustmentModalOpen}
          onClose={() => setAdjustmentModalOpen(false)}
          onSuccess={triggerGlobalRefresh}
          defaultItemId={targetItemId}
        />
      )}
    </div>
  );
};

