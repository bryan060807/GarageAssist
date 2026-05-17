import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './components/AuthProvider';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { Diagnostics } from './pages/Diagnostics';
import { Inspections } from './pages/Inspections';
import { Parts } from './pages/Parts';
import { HealthReports } from './pages/HealthReports';
import { Chat } from './pages/Chat';
import { AskAI } from './pages/AskAI';
import { Settings } from './pages/Settings';
import { useAppStore } from './store/useAppStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAppStore();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="diagnostics" element={<Diagnostics />} />
            <Route path="inspections" element={<Inspections />} />
            <Route path="parts" element={<Parts />} />
            <Route path="reports" element={<HealthReports />} />
            <Route path="chat" element={<Chat />} />
            <Route path="ask-ai" element={<AskAI />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
