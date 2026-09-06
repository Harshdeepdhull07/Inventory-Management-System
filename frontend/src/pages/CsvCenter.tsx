import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Loader2
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

interface ImportSummary {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  results: {
    rowNumber: number;
    identifier: string;
    status: 'SUCCESS' | 'FAILED';
    message: string;
  }[];
}

export const CsvCenter: React.FC = () => {
  const { triggerGlobalRefresh } = useOutletContext<{ triggerGlobalRefresh: () => void }>();
  const { isManager } = useAuth();

  const [itemsFile, setItemsFile] = useState<File | null>(null);
  const [receiptsFile, setReceiptsFile] = useState<File | null>(null);
  const [itemsSummary, setItemsSummary] = useState<ImportSummary | null>(null);
  const [receiptsSummary, setReceiptsSummary] = useState<ImportSummary | null>(null);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [loadingReceipts, setLoadingReceipts] = useState<boolean>(false);
  const [downloadingExport, setDownloadingExport] = useState<boolean>(false);

  const downloadSampleItemsCsv = () => {
    const csvContent =
      'SKU,Name,Description,Unit,ReorderLevel,Category\n' +
      'ELEC-HEAD-501,Wireless Noise Cancelling Headphones,Bluetooth 5.3 ANC,pcs,15,Electronics\n' +
      'OFF-NOTE-502,Hardcover Ruled Notebook A5,160 pages 100gsm,pcs,30,Office Supplies\n' +
      'PACK-STR-503,Industrial Stretch Wrap Film,500mm x 300m,roll,20,Packaging\n' +
      'ELEC-HEAD-501,Duplicate SKU Sample,This will fail,pcs,10,Electronics\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-items-import.csv';
    a.click();
  };

  const downloadSampleReceiptsCsv = () => {
    const csvContent =
      'SKU,Location,Quantity,Reference,Notes\n' +
      'ELEC-KB-001,WH-MAIN,50,PO-2026-IMP01,Sample batch receipt\n' +
      'ELEC-MS-002,DC-NORTH,30,PO-2026-IMP02,Inbound shipment\n' +
      'NON-EXIST-999,WH-MAIN,10,PO-FAIL,This row will fail invalid SKU\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-stock-receipts.csv';
    a.click();
  };

  const handleImportItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemsFile) return;

    try {
      setLoadingItems(true);
      setItemsSummary(null);
      const formData = new FormData();
      formData.append('file', itemsFile);

      const res = await api.post('/csv/import-items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setItemsSummary(res.data.data);
        triggerGlobalRefresh();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process Items CSV');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleImportReceipts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptsFile) return;

    try {
      setLoadingReceipts(true);
      setReceiptsSummary(null);
      const formData = new FormData();
      formData.append('file', receiptsFile);

      const res = await api.post('/csv/import-receipts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setReceiptsSummary(res.data.data);
        triggerGlobalRefresh();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process Receipts CSV');
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleExportInventory = async () => {
    try {
      setDownloadingExport(true);
      const res = await api.get('/csv/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err: any) {
      alert('Failed to export inventory CSV');
    } finally {
      setDownloadingExport(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CSV Data Hub</h1>
          <p className="text-sm text-slate-400">
            Bulk catalog imports, stock receipts, and live inventory CSV export with partial success handling
          </p>
        </div>

        <button
          onClick={handleExportInventory}
          disabled={downloadingExport}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {downloadingExport ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Export Live Inventory Snapshot</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
              <h2>Catalog Items CSV Import</h2>
            </div>
            <button
              onClick={downloadSampleItemsCsv}
              className="text-xs text-sky-400 hover:underline flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample Template</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Import new catalog items with auto-category creation and duplicate SKU validation. Supports partial success.
          </p>

          {isManager ? (
            <form onSubmit={handleImportItems} className="space-y-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setItemsFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!itemsFile || loadingItems}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-40"
              >
                {loadingItems ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing CSV Rows...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Process & Import Items</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-400">
              Only Managers have permission to import new catalog items.
            </div>
          )}

          {itemsSummary && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Total Rows: {itemsSummary.totalRows}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400">✓ {itemsSummary.importedCount} Imported</span>
                  <span className="text-rose-400">✗ {itemsSummary.failedCount} Failed</span>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono pr-1">
                {itemsSummary.results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded flex items-center justify-between ${
                      r.status === 'SUCCESS'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                    }`}
                  >
                    <span>Row {r.rowNumber} [{r.identifier}]</span>
                    <span className="text-[11px] truncate max-w-[200px]">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
              <h2>Bulk Stock Receipts CSV Import</h2>
            </div>
            <button
              onClick={downloadSampleReceiptsCsv}
              className="text-xs text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample Template</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Batch record inbound inventory directly into the append-only ledger per warehouse/store location.
          </p>

          <form onSubmit={handleImportReceipts} className="space-y-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setReceiptsFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 cursor-pointer"
            />
            <button
              type="submit"
              disabled={!receiptsFile || loadingReceipts}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-40"
            >
              {loadingReceipts ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Ledger Receipts...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Process Stock Receipts</span>
                </>
              )}
            </button>
          </form>

          {receiptsSummary && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Total Rows: {receiptsSummary.totalRows}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400">✓ {receiptsSummary.importedCount} Imported</span>
                  <span className="text-rose-400">✗ {receiptsSummary.failedCount} Failed</span>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono pr-1">
                {receiptsSummary.results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded flex items-center justify-between ${
                      r.status === 'SUCCESS'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                    }`}
                  >
                    <span>Row {r.rowNumber} [{r.identifier}]</span>
                    <span className="text-[11px] truncate max-w-[200px]">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
