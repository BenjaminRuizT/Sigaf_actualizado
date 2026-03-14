import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Activity, ShieldCheck, Wrench, ChevronDown, ShieldAlert, ShieldX, RefreshCw, Download, Trash2,
  AlertTriangle, CheckCircle, Info, Search, X, Lock, Unlock,
  UserPlus, UserMinus, UserCog, KeyRound, DatabaseZap, FileCheck,
  FileX, LogIn, LogOut, Filter
} from "lucide-react";

// ──────────────────────────── App Logs helpers ──────────────────────────────
const METHOD_COLORS = {
  GET:    "bg-blue-500/15 text-blue-700 border-blue-500/30",
  POST:   "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  PUT:    "bg-amber-500/15 text-amber-700 border-amber-500/30",
  DELETE: "bg-red-500/15 text-red-700 border-red-500/30",
  PATCH:  "bg-violet-500/15 text-violet-700 border-violet-500/30",
};
const STATUS_ICON = {
  ok:      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
  warning: <Info className="h-3.5 w-3.5 text-amber-500" />,
  error:   <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
};
function statusCat(s) { return s >= 500 ? "error" : s >= 400 ? "warning" : "ok"; }

// ──────────────────────────── Security Logs helpers ─────────────────────────
const EVENT_META = {
  LOGIN_SUCCESS:    { label: "Login exitoso",               icon: LogIn,       color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" },
  LOGIN_FAILED:     { label: "Login fallido",               icon: LogOut,      color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  ACCOUNT_LOCKED:   { label: "Cuenta bloqueada",            icon: Lock,        color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  ACCOUNT_UNLOCKED: { label: "Cuenta desbloqueada",         icon: Unlock,      color: "text-blue-600",    bg: "bg-blue-500/10 border-blue-500/30" },
  UNLOCK_REQUESTED: { label: "Solicitud desbloqueo",        icon: KeyRound,    color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  PASSWORD_CHANGED: { label: "Contraseña modificada",       icon: KeyRound,    color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  USER_CREATED:     { label: "Usuario creado",              icon: UserPlus,    color: "text-blue-600",    bg: "bg-blue-500/10 border-blue-500/30" },
  USER_UPDATED:     { label: "Usuario actualizado",         icon: UserCog,     color: "text-blue-600",    bg: "bg-blue-500/10 border-blue-500/30" },
  USER_DELETED:     { label: "Usuario eliminado",           icon: UserMinus,   color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  ROLE_CHANGED:     { label: "Rol modificado",              icon: ShieldAlert, color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  AUDIT_FINALIZED:  { label: "Auditoría finalizada",        icon: FileCheck,   color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" },
  AUDIT_DELETED:    { label: "Auditoría eliminada",         icon: FileX,       color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  AUDIT_CANCELLED:  { label: "Auditoría cancelada",         icon: FileX,       color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  EQUIPMENT_EDITED: { label: "Equipo modificado",           icon: DatabaseZap, color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  DATA_RESET:       { label: "Datos reiniciados",           icon: DatabaseZap, color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  SIGNATURE_VALID:  { label: "Firma verificada ✓",          icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" },
  SIGNATURE_INVALID:{ label: "Firma inválida — tampering",  icon: ShieldX,     color: "text-red-700",     bg: "bg-red-600/15 border-red-600/40" },
};
const LEVEL_BADGE = {
  INFO:     <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-700 border-blue-500/30">INFO</Badge>,
  WARNING:  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 border-amber-500/30">ALERTA</Badge>,
  CRITICAL: <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/12 text-red-700 border-red-500/40">CRÍTICO</Badge>,
};
const ALL_EVENTS = Object.keys(EVENT_META);

// ════════════════════════════ COMPONENT ════════════════════════════════════
export default function SystemLogsPage({ defaultTab = "app" }) {
  const [expandedFix, setExpandedFix] = useState(null);
  const { api } = useAuth();
  const [tab, setTab] = useState(defaultTab);

  // ── App Logs state ──────────────────────────────────────────────────────
  const [appLogs, setAppLogs] = useState([]);
  const [appLoading, setAppLoading] = useState(true);
  const [appErrOnly, setAppErrOnly] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [appSearchD, setAppSearchD] = useState("");
  const [appEmail, setAppEmail] = useState("");
  const [appEmailD, setAppEmailD] = useState("");
  const [appLimit, setAppLimit] = useState("200");
  const [appClearing, setAppClearing] = useState(false);
  const [appAuto, setAppAuto] = useState(false);
  const appAutoRef = useRef(false);
  appAutoRef.current = appAuto;

  useEffect(() => { const t = setTimeout(() => setAppSearchD(appSearch), 400); return () => clearTimeout(t); }, [appSearch]);
  useEffect(() => { const t = setTimeout(() => setAppEmailD(appEmail), 400); return () => clearTimeout(t); }, [appEmail]);

  const fetchApp = useCallback(async () => {
    try {
      const q = { limit: parseInt(appLimit), errors_only: appErrOnly };
      if (appSearchD) q.path = appSearchD;
      if (appEmailD) q.user_email = appEmailD;
      const res = await api.get("/admin/app-logs", { params: q });
      setAppLogs(res.data || []);
    } catch { toast.error("Error al cargar logs"); }
    finally { setAppLoading(false); }
  }, [api, appLimit, appErrOnly, appSearchD, appEmailD]);

  useEffect(() => { setAppLoading(true); fetchApp(); }, [fetchApp]);
  useEffect(() => {
    if (!appAuto) return;
    const id = setInterval(() => { if (appAutoRef.current) fetchApp(); }, 10000);
    return () => clearInterval(id);
  }, [appAuto, fetchApp]);

  const handleAppClear = async () => {
    if (!window.confirm("¿Eliminar todos los logs? Esta acción no se puede deshacer.")) return;
    setAppClearing(true);
    try { const r = await api.delete("/admin/app-logs"); toast.success(`${r.data.deleted} logs eliminados`); setAppLogs([]); }
    catch { toast.error("Error al eliminar logs"); }
    finally { setAppClearing(false); }
  };

  const handleAppExport = () => {
    const rows = [
      ["Timestamp","Método","Ruta","Status","Duración (ms)","Usuario","IP","Error"],
      ...appLogs.map(l => [l.ts,l.method,l.path,l.status,l.duration_ms,l.user_email||"",l.ip||"",l.error_detail||""])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download: `sigaf_applogs_${new Date().toISOString().slice(0,10)}.csv` });
    a.click();
  };

  const appErrCount = appLogs.filter(l => l.is_error).length;

  // ── Security Logs state ─────────────────────────────────────────────────
  const [secLogs, setSecLogs] = useState([]);
  const [secLoading, setSecLoading] = useState(true);
  const [secLevel, setSecLevel] = useState("all");
  const [secEvent, setSecEvent] = useState("all");
  const [secActor, setSecActor] = useState("");
  const [secActorD, setSecActorD] = useState("");
  const [secLimit, setSecLimit] = useState("200");
  const [secClearing, setSecClearing] = useState(false);
  const [secAuto, setSecAuto] = useState(false);
  const secAutoRef = useRef(false);
  secAutoRef.current = secAuto;

  useEffect(() => { const t = setTimeout(() => setSecActorD(secActor), 400); return () => clearTimeout(t); }, [secActor]);

  const fetchSec = useCallback(async () => {
    try {
      const params = { limit: parseInt(secLimit) };
      if (secLevel !== "all") params.level = secLevel;
      if (secEvent !== "all") params.event = secEvent;
      if (secActorD) params.actor_email = secActorD;
      const res = await api.get("/admin/security-logs", { params });
      setSecLogs(res.data || []);
    } catch { toast.error("Error al cargar logs de seguridad"); }
    finally { setSecLoading(false); }
  }, [api, secLimit, secLevel, secEvent, secActorD]);

  useEffect(() => { setSecLoading(true); fetchSec(); }, [fetchSec]);
  useEffect(() => {
    if (!secAuto) return;
    const id = setInterval(() => { if (secAutoRef.current) fetchSec(); }, 15000);
    return () => clearInterval(id);
  }, [secAuto, fetchSec]);

  const handleSecClear = async () => {
    if (!window.confirm("¿Purgar logs con más de 90 días de antigüedad?")) return;
    setSecClearing(true);
    try { const r = await api.delete("/admin/security-logs"); toast.success(`${r.data.deleted} registros eliminados`); fetchSec(); }
    catch { toast.error("Error al purgar logs"); }
    finally { setSecClearing(false); }
  };

  const handleSecExport = () => {
    const rows = [
      ["Timestamp","Nivel","Evento","Actor","Actor ID","Objetivo","IP","Detalle"],
      ...secLogs.map(l => [l.ts,l.level,l.event,l.actor_email||"",l.actor_id||"",l.target||"",l.ip||"",l.detail?JSON.stringify(l.detail):""])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob(["\uFEFF"+csv,{type:"text/csv;charset=utf-8"}])), download: `sigaf_seclogs_${new Date().toISOString().slice(0,10)}.csv` });
    a.click();
  };

  const secCritical = secLogs.filter(l => l.level === "CRITICAL").length;
  const secWarning  = secLogs.filter(l => l.level === "WARNING").length;
  const secActors   = new Set(secLogs.map(l => l.actor_email).filter(Boolean)).size;


  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight flex items-center gap-3">
          <Activity className="h-8 w-8" /> Logs del Sistema
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoreo de actividad HTTP, errores y auditoría de seguridad
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="app" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Aplicación
            {appErrCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">{appErrCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Seguridad
            {secCritical > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">{secCritical}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fixes" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Fixes
          </TabsTrigger>
        </TabsList>

        {/* ══════════ APP LOGS TAB ══════════ */}
        <TabsContent value="app" className="space-y-4 mt-4">
          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setAppLoading(true); fetchApp(); }} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${appLoading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
            <Button variant={appAuto ? "default" : "outline"} size="sm"
              onClick={() => setAppAuto(p => !p)} className="gap-1.5">
              <Activity className="h-3.5 w-3.5" /> {appAuto ? "Auto ON" : "Auto OFF"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAppExport} disabled={appLogs.length === 0} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleAppClear} disabled={appClearing || appLogs.length === 0}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" /> Limpiar
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono">{appLogs.length}</p>
              <p className="text-xs text-muted-foreground">Total registros</p>
            </CardContent></Card>
            <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-red-600">{appErrCount}</p>
              <p className="text-xs text-muted-foreground">Errores (4xx/5xx)</p>
            </CardContent></Card>
            <Card className="border-emerald-500/30 bg-emerald-500/5"><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-emerald-600">{appLogs.length - appErrCount}</p>
              <p className="text-xs text-muted-foreground">Exitosos (2xx/3xx)</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono">
                {appLogs.length > 0 ? Math.round(appLogs.reduce((a,l) => a+(l.duration_ms||0),0)/appLogs.length) : 0}ms
              </p>
              <p className="text-xs text-muted-foreground">Duración promedio</p>
            </CardContent></Card>
          </div>

          {/* Filters */}
          <Card><CardContent className="p-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar por ruta..." value={appSearch} onChange={e => setAppSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                {appSearch && <button onClick={() => setAppSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
              </div>
              <div className="relative flex-1 min-w-[160px]">
                <Info className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Filtrar por usuario..." value={appEmail} onChange={e => setAppEmail(e.target.value)} className="pl-8 h-9 text-sm" />
                {appEmail && <button onClick={() => setAppEmail("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
              </div>
              <Button size="sm" variant={appErrOnly ? "destructive" : "outline"} onClick={() => setAppErrOnly(p => !p)} className="gap-1.5 h-9">
                <AlertTriangle className="h-3.5 w-3.5" /> {appErrOnly ? "Solo errores ✓" : "Solo errores"}
              </Button>
              <Select value={appLimit} onValueChange={setAppLimit}>
                <SelectTrigger className="w-28 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["50","200","500","1000"].map(v => <SelectItem key={v} value={v}>{v} logs</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent></Card>

          {/* Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading uppercase tracking-tight">
                {appErrOnly ? "Registros de errores" : "Todos los registros"} ({appLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {appLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : appLogs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">No hay registros</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-3 py-2 text-left w-5">&nbsp;</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Timestamp</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Método</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Ruta</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">ms</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Usuario</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">IP</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appLogs.map((log, i) => {
                        const cat = statusCat(log.status);
                        const isErr = cat === "error", isWarn = cat === "warning";
                        return (
                          <tr key={i} className={`border-b transition-colors ${isErr ? "bg-red-500/8 hover:bg-red-500/12" : isWarn ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-muted/40"}`}>
                            <td className="px-3 py-1.5">{STATUS_ICON[cat]}</td>
                            <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">{new Date(log.ts).toLocaleString("es-MX",{dateStyle:"short",timeStyle:"medium"})}</td>
                            <td className="px-3 py-1.5"><Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${METHOD_COLORS[log.method]||""}`}>{log.method}</Badge></td>
                            <td className="px-3 py-1.5 font-mono max-w-[200px] truncate" title={log.path}>{log.path}</td>
                            <td className="px-3 py-1.5"><span className={`font-mono font-bold ${isErr?"text-red-600":isWarn?"text-amber-600":"text-emerald-600"}`}>{log.status}</span></td>
                            <td className="px-3 py-1.5 text-right font-mono text-muted-foreground"><span className={log.duration_ms>1000?"text-amber-600 font-semibold":""}>{log.duration_ms}</span></td>
                            <td className="px-3 py-1.5 text-muted-foreground max-w-[140px] truncate" title={log.user_email||""}>{log.user_email||<span className="opacity-40">—</span>}</td>
                            <td className="px-3 py-1.5 font-mono text-muted-foreground">{log.ip||"—"}</td>
                            <td className="px-3 py-1.5 max-w-[200px] truncate text-red-600" title={log.error_detail||""}>{log.error_detail||<span className="opacity-40">—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ SECURITY LOGS TAB ══════════ */}
        <TabsContent value="security" className="space-y-4 mt-4">
          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setSecLoading(true); fetchSec(); }} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${secLoading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
            <Button variant={secAuto ? "default" : "outline"} size="sm"
              onClick={() => setSecAuto(p => !p)} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> {secAuto ? "Auto ON" : "Auto OFF"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSecExport} disabled={secLogs.length === 0} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleSecClear} disabled={secClearing}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" /> Purgar &gt;90 días
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono">{secLogs.length}</p>
              <p className="text-xs text-muted-foreground">Total eventos</p>
            </CardContent></Card>
            <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-red-600">{secCritical}</p>
              <p className="text-xs text-muted-foreground">Críticos</p>
            </CardContent></Card>
            <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-amber-600">{secWarning}</p>
              <p className="text-xs text-muted-foreground">Alertas</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono">{secActors}</p>
              <p className="text-xs text-muted-foreground">Actores únicos</p>
            </CardContent></Card>
          </div>

          {/* Filters */}
          <Card><CardContent className="p-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={secLevel} onValueChange={setSecLevel}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Nivel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="CRITICAL">Crítico</SelectItem>
                  <SelectItem value="WARNING">Alerta</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={secEvent} onValueChange={setSecEvent}>
                <SelectTrigger className="w-52 h-9 text-sm"><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  {ALL_EVENTS.map(e => <SelectItem key={e} value={e}>{EVENT_META[e]?.label||e}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar por usuario..." value={secActor} onChange={e => setSecActor(e.target.value)} className="pl-8 h-9 text-sm" />
                {secActor && <button onClick={() => setSecActor("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
              </div>
              <Select value={secLimit} onValueChange={setSecLimit}>
                <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["100","200","500","2000"].map(v => <SelectItem key={v} value={v}>{v} registros</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent></Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading uppercase tracking-tight">
                Línea de tiempo ({secLogs.length} eventos)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {secLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : secLogs.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">No hay eventos de seguridad registrados</p>
                </div>
              ) : (
                <div className="divide-y">
                  {secLogs.map((log, i) => {
                    const meta = EVENT_META[log.event] || { label: log.event, icon: Info, color: "text-muted-foreground", bg: "" };
                    const Icon = meta.icon;
                    return (
                      <div key={i} className={`flex gap-3 px-4 py-3 items-start hover:bg-muted/30 transition-colors ${log.level==="CRITICAL"?"bg-red-500/5":""}`}>
                        <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${meta.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                            {LEVEL_BADGE[log.level]}
                            {log.target && (
                              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[160px]" title={log.target}>{log.target}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                            <span>{new Date(log.ts).toLocaleString("es-MX",{dateStyle:"short",timeStyle:"medium"})}</span>
                            {log.actor_email && <span className="font-medium text-foreground">{log.actor_email}</span>}
                            {log.ip && <span className="font-mono">{log.ip}</span>}
                          </div>
                          {log.detail && Object.keys(log.detail).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(log.detail).slice(0,4).map(([k,v]) => (
                                <span key={k} className="text-[10px] bg-muted rounded px-1.5 py-0.5 font-mono text-muted-foreground">
                                  {k}: <span className="text-foreground">{String(v).slice(0,40)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>
        <TabsContent value="fixes" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Historial de Fixes — SIGAF v1.0</CardTitle>
                <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">32 actualizaciones</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix43" ? null : "fix43")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix43</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white ml-1">Actual</span>
                      <span className="text-xs text-muted-foreground">2026-03-14</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Ordenamiento server-side en historial de auditorías, imports de AdminPage limpia...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix43" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix43" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Ordenamiento server-side en historial de auditorías, imports de AdminPage limpiados para evitar build fail, tab Fixes con detalles expandibles por fix, DeployPage y PDFs actualizados.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Ordenamiento server-side en historial de auditorías</li>
                    <li className="text-sm text-foreground/80">• Backend acepta sort_by y sort_dir en /logs/audits</li>
                    <li className="text-sm text-foreground/80">• Reset de página al cambiar ordenamiento</li>
                    <li className="text-sm text-foreground/80">• Imports no usados eliminados en AdminPage</li>
                    <li className="text-sm text-foreground/80">• Tab Fixes con acordeón de detalles expandibles</li>
                    <li className="text-sm text-foreground/80">• DeployPage y PDFs actualizados con features actuales</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix42" ? null : "fix42")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix42</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-14</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fix de imports no usados en AdminPage (ChevronLeft, ChevronRight, ArrowUpDown) q...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix42" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix42" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fix de imports no usados en AdminPage (ChevronLeft, ChevronRight, ArrowUpDown) que causaban build fail, mafFileValid visible en UI del badge del archivo MAF.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Imports no usados eliminados (build fail resuelto)</li>
                    <li className="text-sm text-foreground/80">• mafFileValid usado en render del badge MAF</li>
                    <li className="text-sm text-foreground/80">• expiredDialog eliminado (no-unused-vars resuelto)</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix41" ? null : "fix41")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix41</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-14</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">SW con prebuild script que estampa timestamp único en cada deploy, guard en Audi...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix41" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix41" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">SW con prebuild script que estampa timestamp único en cada deploy, guard en AuditPage para audit=null, cierre correcto de TabsContent en Fixes, auto-carga del tab Historial.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Prebuild script stamp-sw.js: timestamp único por deploy</li>
                    <li className="text-sm text-foreground/80">• sw.template.js como fuente de verdad del SW</li>
                    <li className="text-sm text-foreground/80">• Guard !audit en AuditPage (evita pantalla en blanco)</li>
                    <li className="text-sm text-foreground/80">• Cierre correcto de TabsContent en Logs del Sistema</li>
                    <li className="text-sm text-foreground/80">• Auto-carga de sesiones y auditorías al abrir Historial</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix40" ? null : "fix40")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix40</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-13</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Auditorías vencidas con vista y restauración, restricción de acceso a auditoría ...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix40" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix40" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Auditorías vencidas con vista y restauración, restricción de acceso a auditoría en progreso por otro usuario, sesiones activas con cierre forzoso, multisesión configurable, tab Fixes en Logs del Sistema.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Vista de auditorías vencidas con botón Restaurar (+24h)</li>
                    <li className="text-sm text-foreground/80">• Restricción: solo el auditor dueño puede entrar a su auditoría</li>
                    <li className="text-sm text-foreground/80">• Sesiones activas con cierre forzoso en AdminPage-Historial</li>
                    <li className="text-sm text-foreground/80">• Multisesión configurable: permitir múltiples sesiones por usuario</li>
                    <li className="text-sm text-foreground/80">• Tab 'Fixes' en Logs del Sistema con historial completo</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix39" ? null : "fix39")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix39</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-13</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Sistema completo de inactividad: timeout configurable (5-480 min), banner con co...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix39" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix39" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Sistema completo de inactividad: timeout configurable (5-480 min), banner con countdown 5 minutos antes, botón 'Seguir trabajando', propagación en tiempo real a sesiones activas.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Timeout de inactividad configurable en AdminPage</li>
                    <li className="text-sm text-foreground/80">• Banner modal con countdown en tiempo real</li>
                    <li className="text-sm text-foreground/80">• Botón 'Seguir trabajando' reinicia el timer</li>
                    <li className="text-sm text-foreground/80">• Propagación en tiempo real via polling cada 60s</li>
                    <li className="text-sm text-foreground/80">• Rango: 5 a 480 minutos</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix38" ? null : "fix38")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix38</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-13</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">SW definitivo con waiting state correcto, envío de SKIP_WAITING explícito desde ...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix38" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix38" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">SW definitivo con waiting state correcto, envío de SKIP_WAITING explícito desde App.js al hacer clic en 'Recargar', fix de modelo duplicado en historial de escaneos.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• SW con waiting state correcto (sin skipWaiting automático)</li>
                    <li className="text-sm text-foreground/80">• App.js envía SKIP_WAITING al SW en waiting</li>
                    <li className="text-sm text-foreground/80">• Modelo no duplicado en historial de escaneos</li>
                    <li className="text-sm text-foreground/80">• Recarga automática vía controllerchange</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix37" ? null : "fix37")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix37</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-13</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Estadísticas de auditorías filtradas por plaza en tiempo real: total_audits, sto...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix37" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix37" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Estadísticas de auditorías filtradas por plaza en tiempo real: total_audits, stores_audited y porcentaje de cobertura se actualizan al filtrar.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Stats filtradas por plaza: auditorías realizadas</li>
                    <li className="text-sm text-foreground/80">• Stats filtradas por plaza: tiendas auditadas</li>
                    <li className="text-sm text-foreground/80">• Stats filtradas por plaza: % cobertura</li>
                    <li className="text-sm text-foreground/80">• Backend acepta parámetro plaza en /audits/stats/summary</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix36" ? null : "fix36")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix36</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-13</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Recálculo de horas con TTL actual del sistema, fix del filtro de plaza (objetos→...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix36" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix36" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Recálculo de horas con TTL actual del sistema, fix del filtro de plaza (objetos→strings), SW v6 sin skipWaiting en install, detección de updates via waiting state.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Horas recalculadas con TTL configurado actualmente</li>
                    <li className="text-sm text-foreground/80">• Filtro plaza: extrae strings de objetos /stores/plazas</li>
                    <li className="text-sm text-foreground/80">• SW v6: sin skipWaiting en install</li>
                    <li className="text-sm text-foreground/80">• Detección updates via reg.waiting</li>
                    <li className="text-sm text-foreground/80">• Separador bullet entre modelo y serie</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix35" ? null : "fix35")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix35</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-13</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Horas restantes recalculadas desde photos_deadline, layout móvil de Consultar Eq...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix35" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix35" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Horas restantes recalculadas desde photos_deadline, layout móvil de Consultar Equipo corregido, filtro por plaza en historial de auditorías, modelo y serie en historial de escaneos.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Horas restantes calculadas desde photos_deadline real</li>
                    <li className="text-sm text-foreground/80">• Layout móvil: input full-width, controles en fila separada</li>
                    <li className="text-sm text-foreground/80">• Filtro por plaza en historial de auditorías (LogsPage)</li>
                    <li className="text-sm text-foreground/80">• Modelo y serie visibles en historial de escaneos</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix34" ? null : "fix34")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix34</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-13</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Auto-cancelar auditoría sin escaneos, lógica de movimientos más robusta, endpoin...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix34" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix34" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Auto-cancelar auditoría sin escaneos, lógica de movimientos más robusta, endpoint fix-pending-photos para completar auditorías que ya no requieren foto.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Auto-cancelación al finalizar sin escaneos</li>
                    <li className="text-sm text-foreground/80">• Lógica: ALTA siempre manual, BAJA filtra canceladas</li>
                    <li className="text-sm text-foreground/80">• Endpoint POST /admin/fix-pending-photos</li>
                    <li className="text-sm text-foreground/80">• Botón 'Corregir ahora' en AdminPage</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix33" ? null : "fix33")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix33</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-13</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Banner de actualización SW, búsqueda de equipo carga todos los registros (limit=...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix33" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix33" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Banner de actualización SW, búsqueda de equipo carga todos los registros (limit=0 al backend), contraseña actual requerida para cambiar contraseña, validación de estructura de archivos Excel antes de importar.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Banner actualización SW funcional</li>
                    <li className="text-sm text-foreground/80">• Búsqueda equipo: limit=0 carga todos al backend</li>
                    <li className="text-sm text-foreground/80">• Contraseña actual requerida al cambiar contraseña</li>
                    <li className="text-sm text-foreground/80">• Validación de estructura Excel antes de importar</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix32" ? null : "fix32")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix32</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-12</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fix raíz de lógica de fotos: filtrar movimientos auto_generated correctamente, c...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix32" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix32" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fix raíz de lógica de fotos: filtrar movimientos auto_generated correctamente, campos photo_required_alta y photo_required_baja separados, TTL guardado como entero (no booleano).</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Movimientos auto_generated excluidos del cálculo de fotos</li>
                    <li className="text-sm text-foreground/80">• Campos photo_required_alta y _baja independientes</li>
                    <li className="text-sm text-foreground/80">• TTL guardado como int (corrige bug de bool→1)</li>
                    <li className="text-sm text-foreground/80">• Validación robusta de tipos en system-settings</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix31" ? null : "fix31")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix31</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-12</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fix del estado en modal de tienda para mostrar pending_photos correctamente, pag...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix31" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix31" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fix del estado en modal de tienda para mostrar pending_photos correctamente, paginación de búsqueda de equipos con opciones 10/25/50/100/Todos, eliminación del tab Equipos de AdminPage.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Modal de tienda muestra estado pending_photos correctamente</li>
                    <li className="text-sm text-foreground/80">• Paginación de búsqueda: 10/25/50/100/Todos por página</li>
                    <li className="text-sm text-foreground/80">• Tab Equipos eliminado de AdminPage</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix30" ? null : "fix30")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix30</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-12</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">8 correcciones: doble X en diálogo foto, display de horas TTL en config, fotos s...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix30" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix30" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">8 correcciones: doble X en diálogo foto, display de horas TTL en config, fotos solo en movimientos manuales, banner de actualización SW, confirmación de contraseña para reset, importación masiva de usuarios por Excel, estadísticas de auditorías en bitácoras.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Doble X en diálogo de foto eliminado</li>
                    <li className="text-sm text-foreground/80">• Display de horas TTL corregido en configuración</li>
                    <li className="text-sm text-foreground/80">• Fotos solo en movimientos manuales (no auto-generados)</li>
                    <li className="text-sm text-foreground/80">• Banner de actualización SW implementado</li>
                    <li className="text-sm text-foreground/80">• Contraseña requerida para reiniciar datos</li>
                    <li className="text-sm text-foreground/80">• Importación masiva de usuarios desde Excel/CSV</li>
                    <li className="text-sm text-foreground/80">• Tarjetas de estadísticas en bitácoras</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix29" ? null : "fix29")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix29</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-12</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Endpoint global GET /cross-analysis/global que compara no-localizados vs sobrant...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix29" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix29" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Endpoint global GET /cross-analysis/global que compara no-localizados vs sobrantes de TODAS las auditorías. Rediseño de UI con filtros por plaza y nivel de confianza.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Endpoint global /cross-analysis/global</li>
                    <li className="text-sm text-foreground/80">• Compara todas las auditorías simultáneamente</li>
                    <li className="text-sm text-foreground/80">• Filtros por plaza y nivel de confianza (Alta/Media/Baja)</li>
                    <li className="text-sm text-foreground/80">• Badge 'Tiendas distintas' cuando equipos son de otra tienda</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix27-fix28" ? null : "fix27-fix28")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix27-fix28</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-12</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Tab AdminHistory en AdminPage, estado pending_photos con TTL y auto-limpieza, ba...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix27-fix28" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix27-fix28" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Tab AdminHistory en AdminPage, estado pending_photos con TTL y auto-limpieza, banner de bloqueo con countdown, toggles ALTAS/BAJAS separados, serie obligatoria en sobrante, catálogo dinámico desde MAF, análisis cruzado no-localizado vs sobrante, marca/modelo en búsqueda.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Tab AdminHistory en AdminPage</li>
                    <li className="text-sm text-foreground/80">• Estado pending_photos con TTL configurable</li>
                    <li className="text-sm text-foreground/80">• Auto-limpieza de auditorías vencidas</li>
                    <li className="text-sm text-foreground/80">• Banner de bloqueo con countdown en auditoría</li>
                    <li className="text-sm text-foreground/80">• Toggles separados para foto ALTAS y BAJAS</li>
                    <li className="text-sm text-foreground/80">• Serie obligatoria en sobrante desconocido</li>
                    <li className="text-sm text-foreground/80">• Catálogo dinámico cargado desde el MAF</li>
                    <li className="text-sm text-foreground/80">• Análisis cruzado: no-localizado vs sobrante</li>
                    <li className="text-sm text-foreground/80">• Marca y modelo en resultados de búsqueda</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix25-fix26" ? null : "fix25-fix26")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix25-fix26</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-12</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fix de botones en lightbox, UI mejorada de conflicto de sesión con IP/device/UA ...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix25-fix26" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix25-fix26" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fix de botones en lightbox, UI mejorada de conflicto de sesión con IP/device/UA completos, catálogo de sobrante desconocido con marcas filtradas + opción OTRO, control de límite en búsqueda de equipos.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Botones del lightbox corregidos</li>
                    <li className="text-sm text-foreground/80">• Conflicto de sesión muestra IP, dispositivo y navegador</li>
                    <li className="text-sm text-foreground/80">• Catálogo de marcas filtrado por tipo de equipo</li>
                    <li className="text-sm text-foreground/80">• Opción OTRO con campo manual para marcas</li>
                    <li className="text-sm text-foreground/80">• Control de límite de resultados en búsqueda</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix23-fix24" ? null : "fix23-fix24")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix23-fix24</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-12</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">SystemLogsPage unificada (app + seguridad), fix de apiRef en AuthContext, mejora...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix23-fix24" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix23-fix24" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">SystemLogsPage unificada (app + seguridad), fix de apiRef en AuthContext, mejoras de performance en LogsPage con proyecciones MongoDB y fetches paralelos.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• SystemLogsPage unificada con tabs</li>
                    <li className="text-sm text-foreground/80">• Fix de apiRef en AuthContext (race condition)</li>
                    <li className="text-sm text-foreground/80">• Proyecciones MongoDB para reducir datos transferidos</li>
                    <li className="text-sm text-foreground/80">• Fetches paralelos con asyncio.gather</li>
                    <li className="text-sm text-foreground/80">• Nuevos índices MongoDB para consultas frecuentes</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix21-fix22" ? null : "fix21-fix22")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix21-fix22</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-11 – 2026-03-12</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Sesión única forzada con UI de conflicto mejorada, ciclo de 3 idiomas ES→EN→PT c...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix21-fix22" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix21-fix22" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Sesión única forzada con UI de conflicto mejorada, ciclo de 3 idiomas ES→EN→PT con botón en header, corrección de pantalla en blanco en AdminPage.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Sesión única forzada al iniciar sesión</li>
                    <li className="text-sm text-foreground/80">• UI de conflicto con detalles del dispositivo activo</li>
                    <li className="text-sm text-foreground/80">• Ciclo de idiomas ES→EN→PT en un botón</li>
                    <li className="text-sm text-foreground/80">• Fix pantalla en blanco AdminPage</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix20" ? null : "fix20")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix20</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-11</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fix de lightbox con Radix Dialog, toggles de configuración de fotos en admin, so...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix20" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix20" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fix de lightbox con Radix Dialog, toggles de configuración de fotos en admin, soporte de idioma Portugués (tercer idioma).</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Lightbox compatible con Radix Dialog</li>
                    <li className="text-sm text-foreground/80">• Toggles de configuración de fotos en AdminPage</li>
                    <li className="text-sm text-foreground/80">• Soporte de idioma Portugués (ES→EN→PT)</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix18-fix19" ? null : "fix18-fix19")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix18-fix19</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-11</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fix de lightbox usando createPortal para resolver problemas de z-index, scroll e...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix18-fix19" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix18-fix19" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fix de lightbox usando createPortal para resolver problemas de z-index, scroll en sidebar, enfoque automático en historial de búsqueda.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Lightbox con createPortal (z-index corregido)</li>
                    <li className="text-sm text-foreground/80">• Scroll en sidebar de navegación</li>
                    <li className="text-sm text-foreground/80">• Enfoque automático en búsqueda de equipos</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix17" ? null : "fix17")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix17</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-11</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fotos condicionales configurables por tipo de movimiento, verificación automátic...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix17" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix17" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fotos condicionales configurables por tipo de movimiento, verificación automática de firma al completar auditoría, lightbox de fotos, historial de cambios admin con rollback, búsqueda avanzada de equipos con filtros.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Fotos condicionales por tipo (altas/bajas/transferencias)</li>
                    <li className="text-sm text-foreground/80">• Verificación automática de firma digital al completar</li>
                    <li className="text-sm text-foreground/80">• Lightbox de fotos con zoom</li>
                    <li className="text-sm text-foreground/80">• Historial de cambios admin con rollback</li>
                    <li className="text-sm text-foreground/80">• Búsqueda avanzada con marca, modelo, serie, tienda</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix16" ? null : "fix16")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix16</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-10</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Corrección de truncado de código de barras en escaneo, correcciones visuales men...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix16" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix16" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Corrección de truncado de código de barras en escaneo, correcciones visuales menores en la interfaz.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Truncado de código de barras corregido en Zebra TC52</li>
                    <li className="text-sm text-foreground/80">• Caracteres especiales Unicode eliminados del barcode</li>
                    <li className="text-sm text-foreground/80">• Correcciones visuales menores</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix15" ? null : "fix15")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix15</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-10</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">El flujo de desbloqueo de cuenta regresa al login tras solicitarlo, con notifica...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix15" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix15" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">El flujo de desbloqueo de cuenta regresa al login tras solicitarlo, con notificaciones al administrador.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Flujo de desbloqueo regresa al login automáticamente</li>
                    <li className="text-sm text-foreground/80">• Notificación al administrador al solicitar desbloqueo</li>
                    <li className="text-sm text-foreground/80">• UI mejorada del proceso de desbloqueo</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix14" ? null : "fix14")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix14</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-10</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Reporte PDF completo de auditoría con firma digital verificable, tabla de equipo...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix14" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix14" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Reporte PDF completo de auditoría con firma digital verificable, tabla de equipos no localizados y sobrantes, y resumen de movimientos.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• PDF completo con todos los datos de la auditoría</li>
                    <li className="text-sm text-foreground/80">• Firma digital incluida y verificable</li>
                    <li className="text-sm text-foreground/80">• Tabla de equipos no localizados con valores</li>
                    <li className="text-sm text-foreground/80">• Resumen de movimientos (altas, bajas, transferencias)</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix13" ? null : "fix13")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix13</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-10</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Logs de auditoría de seguridad, firmas digitales HMAC-SHA256 por auditoría, cifr...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix13" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix13" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Logs de auditoría de seguridad, firmas digitales HMAC-SHA256 por auditoría, cifrado de campos sensibles (serie y factura) con Fernet.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Logs de seguridad con niveles INFO/WARNING/CRITICAL</li>
                    <li className="text-sm text-foreground/80">• Firmas digitales HMAC-SHA256 por auditoría</li>
                    <li className="text-sm text-foreground/80">• Cifrado de campos sensibles con Fernet (serie, factura)</li>
                    <li className="text-sm text-foreground/80">• Verificación automática de integridad</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix11-fix12" ? null : "fix11-fix12")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix11-fix12</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-09 – 2026-03-10</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Implementación de sesión única por usuario con detección de conflicto mostrando ...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix11-fix12" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix11-fix12" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Implementación de sesión única por usuario con detección de conflicto mostrando IP, dispositivo y user-agent. Cierre forzoso de otras sesiones activas.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Sesión única por usuario enforced</li>
                    <li className="text-sm text-foreground/80">• Diálogo de conflicto de sesión con IP y dispositivo</li>
                    <li className="text-sm text-foreground/80">• Cierre forzoso de sesiones activas</li>
                    <li className="text-sm text-foreground/80">• Registro de eventos de sesión en logs de seguridad</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix10" ? null : "fix10")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix10</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-09</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Mejoras de UX: rendimiento general, filtros avanzados optimizados y correcciones...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix10" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix10" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Mejoras de UX: rendimiento general, filtros avanzados optimizados y correcciones de interfaz.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Rendimiento de carga mejorado</li>
                    <li className="text-sm text-foreground/80">• Filtros avanzados optimizados</li>
                    <li className="text-sm text-foreground/80">• Correcciones de interfaz de usuario</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix8-fix9" ? null : "fix8-fix9")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix8-fix9</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-09</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Columnas Serie y Depreciado en bitácoras, resize del diálogo de auditoría, PDF e...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix8-fix9" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix8-fix9" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Columnas Serie y Depreciado en bitácoras, resize del diálogo de auditoría, PDF específico por perfil de usuario, corrección de prioridad del badge En Progreso.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Columnas Serie y Depreciado en bitácoras</li>
                    <li className="text-sm text-foreground/80">• Resize del diálogo de auditoría</li>
                    <li className="text-sm text-foreground/80">• PDF diferente según perfil (Admin/Socio/SuperAdmin)</li>
                    <li className="text-sm text-foreground/80">• Prioridad de badge En Progreso sobre Auditada</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix7" ? null : "fix7")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix7</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-09</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fix badge 'En Progreso' en dashboard, corrección de estados de auditoría en back...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix7" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix7" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fix badge 'En Progreso' en dashboard, corrección de estados de auditoría en backend, reescritura completa de pdf_generator.py con Manual de Usuario y Presentación ejecutiva.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Badge 'En Progreso' en dashboard corregido</li>
                    <li className="text-sm text-foreground/80">• Estados de auditoría actualizados en backend</li>
                    <li className="text-sm text-foreground/80">• pdf_generator.py reescrito completamente</li>
                    <li className="text-sm text-foreground/80">• Manual de Usuario con diseño profesional</li>
                    <li className="text-sm text-foreground/80">• Presentación ejecutiva para stakeholders</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix6" ? null : "fix6")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix6</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-09</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Mejoras en tabla de equipos móvil, campo serie para sobrante, overlay de finaliz...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix6" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix6" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Mejoras en tabla de equipos móvil, campo serie para sobrante, overlay de finalización, fotos en resumen de auditoría, filtros por tipo y exportación Excel con fotos.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Tabla de equipos móvil optimizada</li>
                    <li className="text-sm text-foreground/80">• Campo serie obligatorio para sobrante desconocido</li>
                    <li className="text-sm text-foreground/80">• Overlay de carga al finalizar auditoría</li>
                    <li className="text-sm text-foreground/80">• Fotos de formatos en resumen de auditoría</li>
                    <li className="text-sm text-foreground/80">• Exportación Excel del historial con fotos</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="border-b last:border-0">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix1-fix5" ? null : "fix1-fix5")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix1-fix5</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-06 – 2026-03-07</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Deploy inicial en Railway, implementación de cámara de escaneo, registro de sobr...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix1-fix5" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix1-fix5" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Deploy inicial en Railway, implementación de cámara de escaneo, registro de sobrante desconocido, tablas móvil responsivas, exportación Excel con imágenes incrustadas, filtros de movimientos.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Deploy inicial FastAPI + React en Railway</li>
                    <li className="text-sm text-foreground/80">• Cámara de escaneo de códigos de barras</li>
                    <li className="text-sm text-foreground/80">• Registro de sobrante desconocido con campos personalizados</li>
                    <li className="text-sm text-foreground/80">• Tablas móvil con scroll horizontal</li>
                    <li className="text-sm text-foreground/80">• Exportación Excel con imágenes incrustadas</li>
                    <li className="text-sm text-foreground/80">• Filtros de movimientos (transferencias, bajas, altas)</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
                </TabsContent>
      </Tabs>
    </div>
  );
}