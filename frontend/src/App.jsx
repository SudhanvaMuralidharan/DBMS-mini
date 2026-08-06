import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QueryPage from './pages/QueryPage';
import AuditPage from './pages/AuditPage';
import BlockchainPage from './pages/BlockchainPage';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Authenticating...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/query"      element={<QueryPage />} />
          <Route path="/audit"      element={<AuditPage />} />
          <Route path="/blockchain" element={<BlockchainPage />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}