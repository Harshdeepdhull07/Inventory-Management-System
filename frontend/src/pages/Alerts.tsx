import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  BellOff,
  ArrowDownToLine,
  Loader2
} from 'lucide-react';
import api from '../api/client.js';
import { LowStockAlert } from '../types/index.js';
import { ReceiptModal } from '../components/modals/ReceiptModal.js';

export const Alerts: React.FC = () => {
  const { refreshKey, triggerGlobalRefresh } = useOutletContext<{
    refreshKey: number;
    triggerGlobalRefresh: () => void;
  }>();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [includeDismissed, setIncludeDismissed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Action Modal
  const [receiptOpen, setReceiptOpen] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/alerts?includeDismissed=${includeDismissed}`);
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [includeDismissed, refreshKey]);

  const handleDismiss = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}/dismiss`);
      triggerGlobalRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dismiss alert');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Low-Stock Alert Center</h1>
          <p className="text-sm text-slate-400">
            Intelligent inventory threshold alerts with dismissal & reactive reinstatement
          </p>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-300">
          <input
            type="checkbox"
            checked={includeDismissed}
            onChange={(e) => setIncludeDismissed(e.target.checked)}
            className="rounded border-slate-700 text-sky-500 focus:ring-sky-400 w-4 h-4"
          />
          <span>Include Dismissed Alerts</span>
        </label>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />
            <span>Evaluating stock thresholds...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">All Stock Levels Healthy</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No items currently meet or breach low-stock replenishment reorder thresholds.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isDismissed = alert.status === 'DISMISSED';

            return (
              <div
                key={alert.id}
                className={`bg-slate-800/80 border rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDismissed
                    ? 'border-slate-700/50 opacity-60 bg-slate-900/40'
                    : 'border-amber-500/40 bg-amber-950/10'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-sky-400">
                        {alert.item?.sku}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        • {alert.item?.category?.name}
                      </span>
                      {isDismissed && (
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                          Dismissed by {alert.dismissedBy}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/items/${alert.item?.id}`}
                      className="text-base font-bold text-slate-100 hover:text-sky-300 transition-colors"
                    >
                      {alert.item?.name}
                    </Link>
                    <div className="text-xs text-slate-300 mt-1 flex items-center space-x-4">
                      <span>
                        Current Stock: <strong className="text-amber-400">{alert.currentStock} {alert.item?.unit}</strong>
                      </span>
                      <span>
                        Reorder Level: <strong className="text-slate-200">{alert.reorderLevel} {alert.item?.unit}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end md:self-auto">
                  {!isDismissed && (
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                      title="Acknowledge and dismiss alert"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedItemId(alert.itemId);
                      setReceiptOpen(true);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Receive Stock</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {receiptOpen && (
        <ReceiptModal
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          onSuccess={triggerGlobalRefresh}
          defaultItemId={selectedItemId}
        />
      )}
    </div>
  );
};
