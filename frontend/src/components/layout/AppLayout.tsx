import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Sidebar } from './Sidebar.js';
import { ReceiptModal } from '../modals/ReceiptModal.js';
import { IssueModal } from '../modals/IssueModal.js';
import { TransferModal } from '../modals/TransferModal.js';

export const AppLayout: React.FC = () => {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerGlobalRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar
          onOpenReceiptModal={() => setReceiptOpen(true)}
          onOpenIssueModal={() => setIssueOpen(true)}
          onOpenTransferModal={() => setTransferOpen(true)}
        />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet context={{ refreshKey, triggerGlobalRefresh }} />
        </main>
      </div>

      {/* Global Stock Movement Modals */}
      {receiptOpen && (
        <ReceiptModal
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          onSuccess={triggerGlobalRefresh}
        />
      )}
      {issueOpen && (
        <IssueModal
          isOpen={issueOpen}
          onClose={() => setIssueOpen(false)}
          onSuccess={triggerGlobalRefresh}
        />
      )}
      {transferOpen && (
        <TransferModal
          isOpen={transferOpen}
          onClose={() => setTransferOpen(false)}
          onSuccess={triggerGlobalRefresh}
        />
      )}
    </div>
  );
};
