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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none shadow-xs">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-3 mb-2">
            Quick Actions
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={onOpenReceiptModal}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100/90 transition-all text-xs font-semibold group shadow-2xs"
              title="Stock Receipt (Inbound)"
            >
              <ArrowDownToLine className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-emerald-600" />
              Receipt
            </button>
            <button
              onClick={onOpenIssueModal}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100/90 transition-all text-xs font-semibold group shadow-2xs"
              title="Stock Issue (Outbound)"
            >
              <ArrowUpFromLine className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-rose-600" />
              Issue
            </button>
            <button
              onClick={onOpenTransferModal}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100/90 transition-all text-xs font-semibold group shadow-2xs"
              title="Stock Transfer (Inter-Location)"
            >
              <Repeat className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-indigo-600" />
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
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
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

      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-semibold text-slate-700">Append-Only Ledger Active</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-tight">
          Immutable transactions • Real-time summation
        </p>
      </div>
    </aside>
  );
};
