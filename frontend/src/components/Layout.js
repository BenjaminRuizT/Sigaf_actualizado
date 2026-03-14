import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, ClipboardList, Shield, Settings, LogOut, Menu, Sun, Moon, Globe, Rocket, PieChart, Activity, Package } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Layout({ children }) {
  const { user, logout, closeOtherSessions, api } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pendingUnlocks, setPendingUnlocks] = useState(0);
  const [otherSessions, setOtherSessions] = useState(0);
  const [closingOthers, setClosingOthers] = useState(false);

  const isAdmin = ["Administrador", "Super Administrador"].includes(user?.perfil);
  const isSuperAdmin = user?.perfil === "Super Administrador";

  const apiRef = useRef(api);
  const isSuperAdminRef = useRef(isSuperAdmin);
  apiRef.current = api;
  isSuperAdminRef.current = isSuperAdmin;

  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!isSuperAdminRef.current) return;
      try {
        const res = await apiRef.current.get("/admin/unlock-requests");
        if (active) setPendingUnlocks((res.data || []).filter(u => u.unlock_requested).length);
      } catch { /* never crash the layout on poll failure */ }
    };
    poll();
    const id = setInterval(poll, 60000);
    return () => { active = false; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for other active sessions (every 2 minutes)
  useEffect(() => {
    let active = true;
    const checkSessions = async () => {
      try {
        const res = await apiRef.current.get("/auth/sessions");
        if (active) {
          const others = (res.data || []).filter(s => !s.is_current).length;
          setOtherSessions(others);
        }
      } catch { /* silencioso */ }
    };
    checkSessions();
    const id = setInterval(checkSessions, 120000);
    return () => { active = false; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseOtherSessions = async () => {
    setClosingOthers(true);
    try {
      await closeOtherSessions();
      setOtherSessions(0);
      const { toast } = await import("sonner");
      toast.success("Otras sesiones cerradas. Solo queda la sesión actual activa.");
    } catch {
      const { toast } = await import("sonner");
      toast.error("No se pudo cerrar las otras sesiones");
    } finally { setClosingOthers(false); }
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: t("nav.dashboard"), show: true },
    { path: "/reports", icon: PieChart, label: "Reportes", show: isAdmin },
    { path: "/logs", icon: ClipboardList, label: t("nav.logs"), show: isAdmin },
    { path: "/admin", icon: Shield, label: t("nav.admin"), show: isSuperAdmin, badge: pendingUnlocks > 0 ? pendingUnlocks : null },
    { path: "/settings", icon: Settings, label: t("nav.settings"), show: true },
    { path: "/deploy", icon: Rocket, label: "Despliegue", show: isSuperAdmin },
    { path: "/system-logs", icon: Activity, label: "Logs del Sistema", show: isSuperAdmin },
    { path: "/equipment-search", icon: Package, label: "Consultar Equipo", show: true },
  ];

  const handleNav = (path) => { navigate(path); setOpen(false); };
  const handleLogout = async () => { await logout(); navigate("/login"); };
  const isActive = (path) => location.pathname === path;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight" data-testid="sidebar-title">SIGAF</h1>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{t("app.fullName")}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
        {navItems.filter(i => i.show).map(item => (
          <button key={item.path} onClick={() => handleNav(item.path)} data-testid={`sidebar-nav-${item.path.replace("/","") || "dashboard"}`}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive(item.path) ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}>
            <item.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-2">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{user?.nombre}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
            user?.perfil === "Super Administrador" ? "bg-violet-500/15 text-violet-600" :
            user?.perfil === "Administrador" ? "bg-blue-500/15 text-blue-600" :
            "bg-amber-500/15 text-amber-600"
          }`}>{user?.perfil}</span>
        </div>
        {otherSessions > 0 && (
          <div className="mx-3 mb-1 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-700 font-medium leading-tight">
              ⚠ {otherSessions === 1 ? "1 sesión activa" : `${otherSessions} sesiones activas`} en otro{otherSessions > 1 ? "s" : ""} dispositivo{otherSessions > 1 ? "s" : ""}
            </p>
            <button
              onClick={handleCloseOtherSessions}
              disabled={closingOthers}
              className="mt-1.5 text-[11px] text-amber-700 underline underline-offset-2 hover:text-amber-900 transition disabled:opacity-50">
              {closingOthers ? "Cerrando..." : "Cerrar otras sesiones"}
            </button>
          </div>
        )}
        <button onClick={handleLogout} data-testid="nav-logout"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-4 w-4" /> {t("nav.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-col border-r border-border bg-card fixed top-0 left-0 h-screen z-40">
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-60 lg:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 h-14 flex items-center justify-between">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <NavContent />
            </SheetContent>
          </Sheet>
          <h1 className="font-heading text-lg font-bold uppercase tracking-tight">SIGAF</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-mobile">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 px-2 font-medium text-xs"
              onClick={() => changeLanguage(language === "es" ? "en" : language === "en" ? "pt" : "es")}
              data-testid="lang-toggle-mobile">
              <Globe className="h-4 w-4" />
              {language === "es" ? "ES" : language === "en" ? "EN" : "PT"}
            </Button>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-6 h-14 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("auth.welcome")}, <span className="font-semibold text-foreground">{user?.nombre}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-desktop">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 px-2 font-medium text-xs"
              onClick={() => changeLanguage(language === "es" ? "en" : language === "en" ? "pt" : "es")}
              data-testid="lang-toggle-desktop">
              <Globe className="h-4 w-4" />
              {language === "es" ? "ES" : language === "en" ? "EN" : "PT"}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 flex justify-around items-center px-2">
        {navItems.filter(i => i.show).map(item => (
          <button key={item.path} onClick={() => handleNav(item.path)} data-testid={`bottom-nav-${item.path.replace("/","") || "dashboard"}`}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] relative ${isActive(item.path) ? "text-primary" : "text-muted-foreground"}`}>
            <item.icon className="h-5 w-5" />
            {item.badge && (
              <span className="absolute top-0.5 right-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                {item.badge}
              </span>
            )}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
