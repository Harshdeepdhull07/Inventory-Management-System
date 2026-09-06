import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Warehouse,
  Tags,
  AlertTriangle,
  FileSpreadsheet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat
} from 'lucide-react';

interface SidebarProps {
  onOpenReceiptModal: () => void;
  onOpenIssueModal: () => void;
  onOpenTransferModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenReceiptModal,
  onOpenIssueModal,
  onOpenTransferModal,
}) => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Inventory Matrix', path: '/inventory', icon: Boxes },
    { label: 'Stock Movements', path: '/movements', icon: ArrowLeftRight },
    { label: 'Locations', path: '/locations', icon: Warehouse },
    { label: 'Categories', path: '/categories', icon: Tags },
    { label: 'Low-Stock Alerts', path: '/alerts', icon: AlertTriangle },
    { label: 'CSV Data Hub', path: '/csv', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-3 mb-2">
            Quick Actions
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={onOpenReceiptModal}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-200 transition-all text-xs font-medium group"
              title="Stock Receipt (Inbound)"
            >
              <ArrowDownToLine className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
              Receipt
            </button>
            <button
              onClick={onOpenIssueModal}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 transition-all text-xs font-medium group"
              title="Stock Issue (Outbound)"
            >
              <ArrowUpFromLine className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
              Issue
            </button>
            <button
              onClick={onOpenTransferModal}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-indigo-400 hover:bg-indigo-900/60 hover:text-indigo-200 transition-all text-xs font-medium group"
              title="Stock Transfer (Inter-Location)"
            >
              <Repeat className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
              Transfer
            </button>
          </div>
        </div>

        <nav className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-3 mb-2">
            System Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-medium text-slate-300">Append-Only Ledger Active</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-tight">
          Immutable transactions • Real-time summation
        </p>
      </div>
    </aside>
  );
};
