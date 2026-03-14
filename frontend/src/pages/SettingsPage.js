import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sun,
  Moon,
  Globe,
  Palette,
  User,
  Eye,
  EyeOff,
  Save,
  Info,
  Camera,
  QrCode,
  Download,
  BarChart3,
  Shield,
  CloudOff,
  BookOpen,
  Server,
  Lock,
  RefreshCw,
  Wrench
} from "lucide-react";

const APP_VERSION = "3.0.0";
const APP_BUILD_DATE = "Marzo 2026";

const FEATURES = [
  { icon: QrCode, label: "Escaneo de código de barras con cámara", desc: "Escaneo en tiempo real con detección automática, soporte Zebra TC52/DataWedge" },
  { icon: CloudOff, label: "Modo Offline", desc: "Escaneos guardados localmente y sincronizados automáticamente al reconectarse" },
  { icon: Camera, label: "Captura fotográfica de movimientos", desc: "Registro fotográfico de formatos ALTA/BAJA y Transferencias" },
  { icon: BarChart3, label: "Reportes y exportación Excel / PDF", desc: "SIGAF_AB, SIGAF_TRANSFERENCIAS, Manual de Usuario y Presentación Ejecutiva" },
  { icon: Shield, label: "Roles de acceso y bloqueo de sesión", desc: "Super Administrador, Administrador, Socio Tecnológico — bloqueo por intentos fallidos con flujo de desbloqueo" },
  { icon: BookOpen, label: "Bitácoras completas", desc: "Historial de clasificaciones, movimientos, auditorías y logs de sistema" },
  { icon: RefreshCw, label: "Reversión automática de BAJA", desc: "Si un equipo con BAJA pendiente se vuelve a localizar, la baja se cancela automáticamente con trazabilidad" },
  { icon: Wrench, label: "Logs de sistema", desc: "Registro de actividad por usuario, errores y eventos críticos — solo Super Administrador" },
];

const DEPLOY_INFO = [
  { label: "Frontend", value: "insightful-caring-production-2702.up.railway.app", type: "url" },
  { label: "Backend API", value: "sigafactualizado-production.up.railway.app/api", type: "url" },
  { label: "Base de datos", value: "MongoDB Atlas — cluster0.sn33tur.mongodb.net/sigaf", type: "info" },
  { label: "Plataforma", value: "Railway (Frontend + Backend)", type: "info" },
  { label: "Stack", value: "FastAPI + React 19 + MongoDB", type: "info" },
  { label: "Scanner soportado", value: "Zebra TC52 (TC520K) — Android 11 — DataWedge keystroke", type: "info" },
];

export default function SettingsPage() {
  const { theme, palette, toggleTheme, setPalette } = useTheme();
  const { t, language, changeLanguage } = useLanguage();
  const { user, api } = useAuth();

  const [nombre, setNombre] = useState(user?.nombre || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);

  const handleSaveProfile = async () => {
    if (!nombre.trim() && !password.trim()) return;
    // Require current password if changing password
    if (password.trim() && !currentPassword.trim()) {
      toast.error("Debes ingresar tu contraseña actual para cambiarla");
      return;
    }
    setSaving(true);
    try {
      // Validate current password first if changing password
      if (password.trim()) {
        try {
          await api.post("/auth/validate-password", { password: currentPassword.trim() });
        } catch {
          toast.error("Contraseña actual incorrecta");
          setSaving(false);
          return;
        }
      }
      const body = {};
      if (nombre.trim() && nombre.trim() !== user?.nombre) body.nombre = nombre.trim();
      if (password.trim()) body.password = password.trim();
      if (Object.keys(body).length === 0) { toast.info("Sin cambios"); setSaving(false); return; }
      const res = await api.put("/auth/profile", body);
      localStorage.setItem("sigaf_token", res.data.token);
      toast.success("Perfil actualizado. Recargando...");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="settings-page">
      <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight">{t("settings.title")}</h1>

      {/* Profile */}
      <Card data-testid="profile-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Perfil de Usuario</CardTitle>
              <CardDescription className="text-sm">Edite su nombre y contraseña de acceso</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} data-testid="profile-name-input" />
          </div>
          <div className="space-y-2">
            <Label>Nueva Contraseña</Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Dejar vacío para no cambiar" className="pr-10" data-testid="profile-password-input" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="toggle-profile-pw">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {/* Current password — required when changing password */}
          {password.trim() && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                Contraseña Actual <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual para confirmar"
                  className="pr-10 border-amber-500/50 focus:border-amber-500"
                  data-testid="current-password-input"
                />
                <button type="button" onClick={() => setShowCurrentPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-amber-700">Se requiere tu contraseña actual para confirmar el cambio.</p>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span>Correo: <strong>{user?.email}</strong></span>
            <span>Perfil: <strong>{user?.perfil}</strong></span>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} data-testid="save-profile-btn" className="gap-2">
            <Save className="h-4 w-4" /> Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card data-testid="theme-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <div>
              <CardTitle className="text-base">{t("settings.theme")}</CardTitle>
              <CardDescription className="text-sm">{t("settings.themeDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label className="text-sm">{theme === "dark" ? t("settings.dark") : t("settings.light")}</Label>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} data-testid="theme-switch" />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card data-testid="language-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">{t("settings.language")}</CardTitle>
              <CardDescription className="text-sm">{t("settings.languageDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={changeLanguage}>
            <SelectTrigger className="w-full" data-testid="language-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="es">{t("settings.spanish")}</SelectItem>
              <SelectItem value="en">{t("settings.english")}</SelectItem>
              <SelectItem value="pt">{t("settings.portuguese")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Palette */}
      <Card data-testid="palette-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">{t("settings.palette")}</CardTitle>
              <CardDescription className="text-sm">{t("settings.paletteDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant={palette === "professional" ? "default" : "outline"} onClick={() => setPalette("professional")} className="h-auto py-4 flex flex-col items-center gap-2" data-testid="palette-professional">
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 border border-border" />
                <div className="w-5 h-5 rounded-full bg-blue-500 border border-border" />
                <div className="w-5 h-5 rounded-full bg-slate-200 border border-border" />
              </div>
              <span className="text-xs font-medium">{t("settings.professional")}</span>
            </Button>
            <Button variant={palette === "oxxo" ? "default" : "outline"} onClick={() => setPalette("oxxo")} className="h-auto py-4 flex flex-col items-center gap-2" data-testid="palette-oxxo">
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full bg-red-600 border border-border" />
                <div className="w-5 h-5 rounded-full bg-yellow-400 border border-border" />
                <div className="w-5 h-5 rounded-full bg-white border border-border" />
              </div>
              <span className="text-xs font-medium">{t("settings.oxxo")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card data-testid="app-info-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Información de la Aplicación</CardTitle>
              <CardDescription className="text-sm">SIGAF — Sistema Integral de Gestión de Activo Fijo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold">SIGAF</p>
              <p className="text-xs text-muted-foreground">Sistema Integral de Gestión de Activo Fijo</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">v{APP_VERSION}</Badge>
              <Badge variant="outline" className="text-xs">{APP_BUILD_DATE}</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-xs">Producción</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Funcionalidades principales</p>
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50">
                <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tipos de Movimientos</p>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-xs">ALTA</Badge>
              <Badge className="bg-red-500/15 text-red-700 border-red-500/30 text-xs">BAJA</Badge>
              <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-xs">TRANSFERENCIA</Badge>
              <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-xs">SOBRANTE</Badge>
              <Badge className="bg-orange-500/15 text-orange-700 border-orange-500/30 text-xs">SOBRANTE DESCONOCIDO</Badge>
            </div>
          </div>

          <div className="border-t pt-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Perfiles de usuario</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p><strong className="text-foreground">Super Administrador:</strong> Acceso total — importar datos, administrar usuarios, logs de sistema, desbloqueo de cuentas, eliminar auditorías</p>
              <p><strong className="text-foreground">Administrador:</strong> Gestión de auditorías, visualización de reportes y bitácoras, exportación de datos</p>
              <p><strong className="text-foreground">Socio Tecnológico:</strong> Realizar auditorías, escanear equipos, registrar movimientos</p>
            </div>
          </div>

          <div className="border-t pt-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Exportación de documentos</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-primary" />
                <span><strong className="text-foreground">SIGAF_AB_[PLAZA]_[FECHA].xlsx</strong> — Movimientos de ALTAS y BAJAS</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-primary" />
                <span><strong className="text-foreground">SIGAF_TRANSFERENCIAS_[PLAZA]_[FECHA].xlsx</strong> — Movimientos de Transferencias</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-primary" />
                <span><strong className="text-foreground">Manual_Usuario_SIGAF.pdf</strong> — Manual según perfil (ST/Admin/SuperAdmin)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Info — Super Admin only */}
      {user?.perfil === "Super Administrador" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Configuración y Despliegue</CardTitle>
                  <CardDescription className="text-sm">Información técnica del entorno de producción</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDeploy(!showDeploy)} className="text-xs">
                {showDeploy ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </CardHeader>
          {showDeploy && (
            <CardContent className="space-y-3">
              {DEPLOY_INFO.map(({ label, value, type }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className={`text-sm font-mono break-all ${type === "url" ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}>{value}</p>
                </div>
              ))}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Orden de despliegue</p>
                <div className="space-y-1 text-xs text-muted-foreground font-mono">
                  <p className="flex gap-2"><span className="text-primary font-bold">1.</span> backend/server.py → Railway backend</p>
                  <p className="flex gap-2"><span className="text-primary font-bold">2.</span> frontend/src/pages/*.js → Railway frontend (build)</p>
                  <p className="flex gap-2"><span className="text-primary font-bold">3.</span> frontend/src/components/Layout.js → incluir en build</p>
                  <p className="flex gap-2"><span className="text-primary font-bold">4.</span> frontend/src/lib/translations.js → incluir en build</p>
                  <p className="flex gap-2"><span className="text-primary font-bold">5.</span> frontend/src/hooks/useSortable.js → nuevo archivo (fix10+)</p>
                </div>
              </div>
              <div className="border-t pt-3 space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Variables de entorno requeridas</p>
                <div className="space-y-1 text-xs font-mono text-muted-foreground bg-muted/50 rounded p-2">
                  <p>REACT_APP_BACKEND_URL=https://sigafactualizado-production.up.railway.app</p>
                  <p>MONGODB_URL=mongodb+srv://sigaf_user:Diciembre*2025@cluster0...</p>
                  <p>SECRET_KEY=[jwt-secret]</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
