import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Bell, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

export const Navbar: React.FC = () => {
  const { user, logout, isManager } = useAuth();
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await api.get('/alerts');
        if (res.data.success) {
          setActiveAlertsCount(res.data.data.length);
        }
      } catch {
        // silent fallback
      }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-800/80 backdrop-blur border-b border-slate-700/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <span className="text-xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          BUSY
        </span>
        <span className="text-xs tracking-wider uppercase font-semibold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded border border-slate-600">
          Stock Control Engine
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Low Stock Alerts Notification Bell */}
        <Link
          to="/alerts"
          className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Low Stock Alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg animate-pulse">
              {activeAlertsCount}
            </span>
          )}
        </Link>

        {/* User Role Badge & Info */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sky-400 border border-slate-600">
              {isManager ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-slate-200">{user?.name}</div>
              <div className="text-xs flex items-center space-x-1">
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isManager
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user?.role}
                </span>
                {user?.assignedLocations && user.assignedLocations.length > 0 && (
                  <span className="text-slate-400 text-[11px] truncate max-w-[120px]" title={user.assignedLocations.map(l => l.name).join(', ')}>
                    • {user.assignedLocations.length} loc(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
