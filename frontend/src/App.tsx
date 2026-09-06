import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Inventory } from './pages/Inventory.js';
import { ItemDetail } from './pages/ItemDetail.js';
import { Movements } from './pages/Movements.js';
import { Locations } from './pages/Locations.js';
import { Categories } from './pages/Categories.js';
import { Alerts } from './pages/Alerts.js';
import { CsvCenter } from './pages/CsvCenter.js';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="items/:id" element={<ItemDetail />} />
            <Route path="movements" element={<Movements />} />
            <Route path="locations" element={<Locations />} />
            <Route path="categories" element={<Categories />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="csv" element={<CsvCenter />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
