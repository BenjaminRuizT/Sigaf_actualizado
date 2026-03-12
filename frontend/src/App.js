import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AuditPage from "@/pages/AuditPage";
import LogsPage from "@/pages/LogsPage";
import AdminPage from "@/pages/AdminPage";
import SystemLogsPage from "@/pages/SystemLogsPage";
import EquipmentSearchPage from "@/pages/EquipmentSearchPage";
import SettingsPage from "@/pages/SettingsPage";
import DeployPage from "@/pages/DeployPage";
import ReportsPage from "@/pages/ReportsPage";
import { useState, useEffect } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";
import "@/App.css";

// ── Update banner — shown when a new Service Worker has been activated ──────
function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show banner whenever a new SW version is detected (waiting or already activated)
    const handler = () => setShow(true);
    window.addEventListener('sw-update-available', handler);

    // Also: check if the page was already loaded with a new SW by comparing versions
    // If SW_ACTIVATED fires after load, it means the user's current session is stale
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  if (!show) return null;

  const handleUpdate = () => {
    window.location.reload();
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl shadow-2xl px-4 py-3 border border-primary/20">
        <Sparkles className="h-5 w-5 shrink-0 text-yellow-300" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Actualización disponible</p>
          <p className="text-xs opacity-80 mt-0.5 leading-tight">Hay una nueva versión de SIGAF. Recarga para ver las mejoras.</p>
        </div>
        <button
          onClick={handleUpdate}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Recargar
        </button>
        <button onClick={() => setShow(false)} className="opacity-60 hover:opacity-100 transition shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requiredProfile }) {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!token) return <Navigate to="/login" replace />;
  if (requiredProfile && user?.perfil !== requiredProfile) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (!["Administrador", "Super Administrador"].includes(user?.perfil)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/audit/:auditId" element={<ProtectedRoute><Layout><AuditPage /></Layout></ProtectedRoute>} />
      <Route path="/logs" element={<AdminRoute><Layout><LogsPage /></Layout></AdminRoute>} />
      <Route path="/reports" element={<AdminRoute><Layout><ReportsPage /></Layout></AdminRoute>} />
      <Route path="/admin" element={<ProtectedRoute requiredProfile="Super Administrador"><Layout><AdminPage /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      <Route path="/deploy" element={<ProtectedRoute requiredProfile="Super Administrador"><Layout><DeployPage /></Layout></ProtectedRoute>} />
      <Route path="/app-logs" element={<ProtectedRoute requiredProfile="Super Administrador"><Layout><SystemLogsPage /></Layout></ProtectedRoute>} />
      <Route path="/security-logs" element={<ProtectedRoute requiredProfile="Super Administrador"><Layout><SystemLogsPage defaultTab="security" /></Layout></ProtectedRoute>} />
      <Route path="/system-logs" element={<ProtectedRoute requiredProfile="Super Administrador"><Layout><SystemLogsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin-history" element={<ProtectedRoute requiredProfile="Super Administrador"><Layout><AdminPage defaultTab="history" /></Layout></ProtectedRoute>} />
      <Route path="/equipment-search" element={<ProtectedRoute><Layout><EquipmentSearchPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster richColors position="top-right" />
            <UpdateBanner />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
