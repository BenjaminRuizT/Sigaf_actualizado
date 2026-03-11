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
import "@/App.css";

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
      <Route path="/admin-history" element={<ProtectedRoute requiredProfile="Super Administrador"><Layout><SystemLogsPage defaultTab="history" /></Layout></ProtectedRoute>} />
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
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
