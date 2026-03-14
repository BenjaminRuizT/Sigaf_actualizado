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
import { RefreshCw, Sparkles, X, AlertTriangle, Clock } from "lucide-react";
import "@/App.css";

// ── Update banner — shown when a new Service Worker has been activated ──────
function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  if (!show) return null;

  const handleUpdate = () => {
    // Send SKIP_WAITING to the waiting SW — the page will reload via
    // the controllerchange listener in index.js.
    if (navigator.serviceWorker?.controller) {
      // Find the waiting SW via getRegistration
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          // Fallback: no waiting SW found, just reload
          window.location.reload();
        }
      }).catch(() => window.location.reload());
    } else {
      window.location.reload();
    }
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

// ── Inactivity warning banner ────────────────────────────────────────────────
function InactivityBanner() {
  const { showWarning, secondsLeft, continueSession } = useAuth();

  if (!showWarning || secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = mins > 0
    ? `${mins}:${String(secs).padStart(2, "0")} min`
    : `${secs} seg`;
  const isUrgent = secondsLeft <= 60;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`mx-4 w-full max-w-sm rounded-2xl shadow-2xl border-2 p-6 space-y-4
        ${isUrgent
          ? "bg-red-50 border-red-400 dark:bg-red-950 dark:border-red-500"
          : "bg-amber-50 border-amber-400 dark:bg-amber-950 dark:border-amber-500"}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-6 w-6 shrink-0 mt-0.5 ${isUrgent ? "text-red-500" : "text-amber-500"}`} />
          <div className="flex-1">
            <p className={`font-bold text-base ${isUrgent ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
              Sesión por cerrar
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tu sesión se cerrará automáticamente por inactividad. ¿Sigues trabajando?
            </p>
          </div>
        </div>
        {/* Countdown */}
        <div className={`flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-3xl font-bold
          ${isUrgent
            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
            : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300"}`}>
          <Clock className="h-6 w-6" />
          {timeStr}
        </div>
        <button
          onClick={continueSession}
          className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition active:scale-95
            ${isUrgent
              ? "bg-red-500 hover:bg-red-600"
              : "bg-amber-500 hover:bg-amber-600"}`}
        >
          ✓ Seguir trabajando
        </button>
      </div>
    </div>
  );
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
            <InactivityBanner />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
