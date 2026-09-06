import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Warehouse,
  History,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Sliders,
  Calendar,
  Loader2
} from 'lucide-react';
import api from '../api/client.js';
import { Item, StockMovement } from '../types/index.js';
import { ReceiptModal } from '../components/modals/ReceiptModal.js';
import { IssueModal } from '../components/modals/IssueModal.js';
import { TransferModal } from '../components/modals/TransferModal.js';
import { AdjustmentModal } from '../components/modals/AdjustmentModal.js';
import { useAuth } from '../context/AuthContext.js';

interface ItemDetailData extends Item {
  breakdown: {
    locationId: string;
    locationName: string;
    locationCode: string;
    locationType: string;
    stock: number;
  }[];
  totalStock: number;
}

export const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isManager } = useAuth();
  const [itemData, setItemData] = useState<ItemDetailData | null>(null);
  const [timeline, setTimeline] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [detailRes, timelineRes] = await Promise.all([
        api.get(`/items/${id}`),
        api.get(`/items/${id}/timeline`),
      ]);
      if (detailRes.data.success) setItemData(detailRes.data.data);
      if (timelineRes.data.success) setTimeline(timelineRes.data.data.timeline);
    } catch (err) {
      console.error('Failed to fetch item details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading || !itemData) {
    return (
      <div className="h-96 flex items-center justify-center space-x-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        <span>Loading Item & Immutable Audit Trail...</span>
      </div>
    );
  }

  const isLowStock = itemData.totalStock <= itemData.reorderLevel;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          to="/inventory"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inventory Matrix</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setReceiptOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Receive</span>
          </button>
          <button
            onClick={() => setIssueOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>Issue</span>
          </button>
          <button
            onClick={() => setTransferOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
          {isManager && (
            <button
              onClick={() => setAdjustOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjust</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-0.5 rounded font-mono text-sm font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {itemData.sku}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-300">
                {itemData.category?.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  itemData.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {itemData.status}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">{itemData.name}</h1>
            {itemData.description && (
              <p className="text-sm text-slate-300 max-w-2xl">{itemData.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-6 bg-slate-900/80 p-4 rounded-xl border border-slate-700/80">
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Stock On-Hand</div>
              <div className="flex items-center justify-end space-x-2 mt-1">
                {isLowStock && <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />}
                <span className={`text-3xl font-extrabold ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {itemData.totalStock}
                </span>
                <span className="text-sm text-slate-400 font-medium">{itemData.unit}</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-700"></div>
            <div className="text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reorder Threshold</div>
              <div className="text-2xl font-bold text-slate-200 mt-1">
                {itemData.reorderLevel} <span className="text-xs text-slate-400 font-normal">{itemData.unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5">
        <div className="flex items-center space-x-2 mb-4 text-slate-200 font-bold">
          <Warehouse className="w-5 h-5 text-sky-400" />
          <h2>Location Stock Breakdown</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {itemData.breakdown.map((loc) => {
            const percentage = itemData.totalStock > 0 ? (loc.stock / itemData.totalStock) * 100 : 0;
            return (
              <div key={loc.locationId} className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-400">{loc.locationCode}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {loc.locationType}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-200 truncate">{loc.locationName}</div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xl font-extrabold text-white">{loc.stock}</span>
                  <span className="text-xs text-slate-400">{itemData.unit} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-slate-200 font-bold">
            <History className="w-5 h-5 text-indigo-400" />
            <h2>Immutable Item Ledger Audit Trail</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {timeline.length} Recorded Ledger Transactions
          </span>
        </div>

        <div className="relative pl-6 border-l-2 border-slate-700 space-y-6">
          {timeline.map((m) => {
            let badgeColor = '';
            let icon = null;

            if (m.type === 'RECEIPT') {
              badgeColor = 'bg-emerald-500 text-white';
              icon = <ArrowDownToLine className="w-3.5 h-3.5" />;
            } else if (m.type === 'ISSUE') {
              badgeColor = 'bg-rose-500 text-white';
              icon = <ArrowUpFromLine className="w-3.5 h-3.5" />;
            } else if (m.type === 'TRANSFER') {
              badgeColor = 'bg-indigo-500 text-white';
              icon = <Repeat className="w-3.5 h-3.5" />;
            } else {
              badgeColor = 'bg-amber-500 text-white';
              icon = <Sliders className="w-3.5 h-3.5" />;
            }

            return (
              <div key={m.id} className="relative group">
                <div
                  className={`absolute -left-[31px] top-1.5 w-6 h-6 rounded-full ${badgeColor} flex items-center justify-center shadow-lg`}
                >
                  {icon}
                </div>

                <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 space-y-2 hover:border-slate-600 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        {m.type}
                      </span>
                      {m.reference && (
                        <span className="text-xs font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                          {m.reference}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div>
                      <span className="text-slate-400">Movement Details:</span>
                      <div className="font-semibold text-slate-200 mt-0.5">
                        {m.type === 'TRANSFER'
                          ? `${m.sourceLocation?.name} → ${m.destinationLocation?.name}`
                          : m.destinationLocation
                          ? `Into ${m.destinationLocation.name}`
                          : m.sourceLocation
                          ? `From ${m.sourceLocation.name}`
                          : 'Global Adjustment'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">Quantity Delta:</span>
                      <div className="font-mono font-bold text-sm text-slate-100 mt-0.5">
                        {m.type === 'ISSUE' ? `-${m.quantity}` : m.type === 'ADJUSTMENT' ? (m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`) : `+${m.quantity}`} {itemData.unit}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">Balance After Transaction:</span>
                      <div className="font-mono font-bold text-sm text-emerald-400 mt-0.5">
                        {m.balanceAfter ?? '—'} {itemData.unit}
                      </div>
                    </div>
                  </div>

                  {m.notes && (
                    <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 italic">
                      "{m.notes}"
                    </div>
                  )}

                  <div className="pt-1 text-[11px] text-slate-500">
                    Logged by <span className="text-slate-400 font-medium">{m.user?.name}</span> ({m.user?.role})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {receiptOpen && (
        <ReceiptModal
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          onSuccess={fetchDetails}
          defaultItemId={id}
        />
      )}
      {issueOpen && (
        <IssueModal
          isOpen={issueOpen}
          onClose={() => setIssueOpen(false)}
          onSuccess={fetchDetails}
          defaultItemId={id}
        />
      )}
      {transferOpen && (
        <TransferModal
          isOpen={transferOpen}
          onClose={() => setTransferOpen(false)}
          onSuccess={fetchDetails}
          defaultItemId={id}
        />
      )}
      {adjustOpen && (
        <AdjustmentModal
          isOpen={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          onSuccess={fetchDetails}
          defaultItemId={id}
        />
      )}
    </div>
  );
};
