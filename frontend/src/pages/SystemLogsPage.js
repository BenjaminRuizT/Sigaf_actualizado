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
                <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">34 actualizaciones</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix53" ? null : "fix53")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix53</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white ml-1">Actual</span>
                      <span className="text-xs text-muted-foreground">2026-04-09 — Fix raíz de inconsistencias: transferencia no actualizaba auditoría origen</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Al escanear un equipo No Localizado en otra tienda, el sistema ahora a...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix53" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix53" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Al escanear un equipo No Localizado en otra tienda, el sistema ahora actualiza correctamente la auditoría origen. Nuevo panel de reconciliación retroactiva en Configuración.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• BUG RAÍZ: _cancel_pending_baja cancelaba el movimiento de baja pero NO actualizaba el scan no_localizado ni los contadores de la auditoría origen</li>
                    <li className="text-sm text-foreground/80">• Fix: al cancelar una baja, se marca el scan como no_localizado_resuelto y se recalculan not_found_count y not_found_value en la auditoría origen</li>
                    <li className="text-sm text-foreground/80">• Nuevo endpoint GET /admin/audit-inconsistencies: detecta todos los equipos con esta inconsistencia histórica</li>
                    <li className="text-sm text-foreground/80">• Nuevo endpoint POST /admin/fix-all-audit-inconsistencies: corrección masiva retroactiva</li>
                    <li className="text-sm text-foreground/80">• Nuevo endpoint POST /admin/fix-audit-inconsistency: corrección individual por equipo</li>
                    <li className="text-sm text-foreground/80">• Panel en Configuración (solo Super Admin): muestra lista de equipos inconsistentes con opción de corregir uno a uno o todos a la vez</li>
                    <li className="text-sm text-foreground/80">• El panel muestra: código de barras, descripción, tienda origen del No Localizado y tienda donde fue encontrado (transferencia)</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix52" ? null : "fix52")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix52</span>
                      
                      <span className="text-xs text-muted-foreground">2026-03-19 — Historial de fixes completo y reordenado</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Todos los fixes desde fix6 hasta fix52 documentados en orden cronológi...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix52" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix52" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Todos los fixes desde fix6 hasta fix52 documentados en orden cronológico inverso.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• 33 fixes documentados desde fix6 hasta fix52</li>
                    <li className="text-sm text-foreground/80">• Orden cronológico inverso: el fix más reciente aparece primero</li>
                    <li className="text-sm text-foreground/80">• Descripción detallada con cambios específicos en cada fix</li>
                    <li className="text-sm text-foreground/80">• Badge 'Actual' en fix52 (el más reciente)</li>
                    <li className="text-sm text-foreground/80">• Contador: 34 actualizaciones totales</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix51" ? null : "fix51")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix51</span>
                      <span className="text-xs text-muted-foreground">2026-03-19 — Análisis cruzado por valor, combobox sobrante, reapertura</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Filtro por valor en análisis cruzado. Combobox filtrable. Reapertura c...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix51" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix51" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Filtro por valor en análisis cruzado. Combobox filtrable. Reapertura con countdown 15 min.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Análisis cruzado: selector 'Ordenar por valor' (Mayor/Menor primero)</li>
                    <li className="text-sm text-foreground/80">• Sobrante desconocido: Descripción y Marca con combobox de búsqueda filtrable</li>
                    <li className="text-sm text-foreground/80">• Todos los campos de sobrante desconocido en MAYÚSCULAS automáticas</li>
                    <li className="text-sm text-foreground/80">• POST /audits/{id}/reopen: ventana de 15 min para reabrir y seguir escaneando</li>
                    <li className="text-sm text-foreground/80">• Dashboard: badge countdown en tarjetas de tiendas recientemente auditadas</li>
                    <li className="text-sm text-foreground/80">• Dashboard: botón 'Reabrir (MM:SS)' con tiempo restante en modal</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix50" ? null : "fix50")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix50</span>
                      <span className="text-xs text-muted-foreground">2026-03-14 — Inactividad resistente a tab oculto (wall-clock)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Enfoque wall-clock con Date.now(). Inmune al throttling del browser.</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix50" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix50" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Enfoque wall-clock con Date.now(). Inmune al throttling del browser.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Ticker único calcula elapsed = Date.now() - lastActivityRef.current</li>
                    <li className="text-sm text-foreground/80">• Inmune a throttling del browser cuando el tab está oculto</li>
                    <li className="text-sm text-foreground/80">• visibilitychange: logout inmediato al regresar si el tiempo ya venció</li>
                    <li className="text-sm text-foreground/80">• Logout garantizado aunque el usuario nunca vea la pantalla de aviso</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix49" ? null : "fix49")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix49</span>
                      <span className="text-xs text-muted-foreground">2026-03-14 — Fix raíz inactividad: stale closures</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">showWarningRef reemplaza showWarning en closures. Timer en 2 fases.</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix49" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix49" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">showWarningRef reemplaza showWarning en closures. Timer en 2 fases.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• BUG: showWarning en closure siempre false → timer se reiniciaba con cualquier movimiento</li>
                    <li className="text-sm text-foreground/80">• Solución: showWarningRef (useRef) sincronizado con estado real</li>
                    <li className="text-sm text-foreground/80">• isLoggedInRef evita timers fantasma post-logout</li>
                    <li className="text-sm text-foreground/80">• Timer en 2 fases: setTimeout(warningDelay) → setInterval(countdown)</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix48" ? null : "fix48")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix48</span>
                      <span className="text-xs text-muted-foreground">2026-03-14 — Sesiones fantasma, notificaciones push, locale dinámico</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Sesiones de usuarios eliminados corregidas. Notificaciones push. Local...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix48" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix48" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Sesiones de usuarios eliminados corregidas. Notificaciones push. Locale dinámico.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• delete_user cierra sesiones del usuario eliminado inmediatamente</li>
                    <li className="text-sm text-foreground/80">• get_current_user rechaza tokens de usuarios eliminados (HTTP 401)</li>
                    <li className="text-sm text-foreground/80">• POST /auth/heartbeat: actualiza last_seen cada 2 minutos</li>
                    <li className="text-sm text-foreground/80">• GET /notifications: alertas de fotos pendientes y auditorías completadas</li>
                    <li className="text-sm text-foreground/80">• Campana de notificaciones con badge numérico en header</li>
                    <li className="text-sm text-foreground/80">• Countdown de inactividad visible en sidebar</li>
                    <li className="text-sm text-foreground/80">• fmtDate, fmtMoney con locale dinámico: es-MX / en-US / pt-BR</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix47" ? null : "fix47")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix47</span>
                      <span className="text-xs text-muted-foreground">2026-03-14 — Paquete SIGAF_fix47_COMPLETE (17 archivos)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Paquete completo con todos los fixes fix40-fix46. Fix del .map() roto ...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix47" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix47" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Paquete completo con todos los fixes fix40-fix46. Fix del .map() roto en LogsPage.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• 17 archivos verificados con cero imports no usados</li>
                    <li className="text-sm text-foreground/80">• Fix: comentario inline rompía el .map() en LogsPage línea 697</li>
                    <li className="text-sm text-foreground/80">• Fix: package.json sin eslintConfig conflictiva</li>
                    <li className="text-sm text-foreground/80">• AdminPage definitivamente con CardHeader y CardTitle</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix46" ? null : "fix46")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix46</span>
                      <span className="text-xs text-muted-foreground">2026-03-14 — Endpoint /download/tech-docs</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Nuevo endpoint para documentación técnica PDF. Botón 'Documentación' e...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix46" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix46" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Nuevo endpoint para documentación técnica PDF. Botón 'Documentación' en DeployPage.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Endpoint GET /download/tech-docs para todos los perfiles</li>
                    <li className="text-sm text-foreground/80">• generate_tech_documentation() con stats actuales del sistema</li>
                    <li className="text-sm text-foreground/80">• Botón 'Documentación' en DeployPage genera y descarga el PDF</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix45" ? null : "fix45")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix45</span>
                      <span className="text-xs text-muted-foreground">2026-03-14 — Limpieza global — cero imports no usados</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Scan exhaustivo de todos los archivos. Cero unused imports en toda la ...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix45" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix45" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Scan exhaustivo de todos los archivos. Cero unused imports en toda la base de código.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Scan automático de pages/ y components/ completo</li>
                    <li className="text-sm text-foreground/80">• Layout.js: ShieldAlert, ShieldCheck, History eliminados</li>
                    <li className="text-sm text-foreground/80">• DashboardPage.js: CardHeader, CardTitle sin usar eliminados</li>
                    <li className="text-sm text-foreground/80">• ReportsPage.js: PieChart, Pie de recharts eliminados</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix44" ? null : "fix44")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix44</span>
                      <span className="text-xs text-muted-foreground">2026-03-14 — Fix definitivo AdminPage pantalla en blanco</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">CardHeader/CardTitle eliminados por error causaban crash silencioso en...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix44" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix44" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">CardHeader/CardTitle eliminados por error causaban crash silencioso en runtime.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• CAUSA RAÍZ: componentes JSX sin importar = crash silencioso en render</li>
                    <li className="text-sm text-foreground/80">• Restauración de CardHeader y CardTitle en AdminPage</li>
                    <li className="text-sm text-foreground/80">• Limpieza en Layout.js, DashboardPage.js, ReportsPage.js</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix43" ? null : "fix43")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix43</span>
                      <span className="text-xs text-muted-foreground">2026-03-13 — Sort bitácoras + CSV import + dedup análisis cruzado</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Ordenamiento real en bitácoras. Importación CSV. Dedup en exportacione...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix43" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix43" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Ordenamiento real en bitácoras. Importación CSV. Dedup en exportaciones.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Sort server-side en Bitácoras con whitelist de campos</li>
                    <li className="text-sm text-foreground/80">• CSV import con detección automática y normalización</li>
                    <li className="text-sm text-foreground/80">• Dedup en exportaciones de movimientos</li>
                    <li className="text-sm text-foreground/80">• Análisis cruzado: dedup con prioridad al mejor score de coincidencia</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix42" ? null : "fix42")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix42</span>
                      <span className="text-xs text-muted-foreground">2026-03-13 — Paquete SIGAF_FINAL — limpieza de código</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Paquete completo de 17 archivos. Limpieza exhaustiva de imports y códi...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix42" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix42" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Paquete completo de 17 archivos. Limpieza exhaustiva de imports y código muerto.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Análisis automatizado de imports en todos los archivos .js</li>
                    <li className="text-sm text-foreground/80">• Eliminación de ArrowUpDown, ShieldAlert, AlertTriangle, Activity, Database, Rocket</li>
                    <li className="text-sm text-foreground/80">• Paquete SIGAF_FINAL con los 17 archivos verificados y cero imports no usados</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix41" ? null : "fix41")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix41</span>
                      <span className="text-xs text-muted-foreground">2026-03-13 — Prebuild stamp-sw.js y guards de auditoría</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Prebuild automático en cada build. Guard !audit. Fix de TabsContent.</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix41" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix41" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Prebuild automático en cada build. Guard !audit. Fix de TabsContent.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Prebuild: node scripts/stamp-sw.js en cada yarn build automáticamente</li>
                    <li className="text-sm text-foreground/80">• Guard !audit en AuditPage evita crashes al inicializar</li>
                    <li className="text-sm text-foreground/80">• Timestamp único garantiza detección de nuevo SW en cada deploy</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix40" ? null : "fix40")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix40</span>
                      <span className="text-xs text-muted-foreground">2026-03-13 — Sesiones activas, auditorías vencidas y multisesión</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Panel de sesiones activas con cierre forzoso. Auditorías vencidas. Mul...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix40" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix40" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Panel de sesiones activas con cierre forzoso. Auditorías vencidas. Multisesión configurable.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Sesiones activas: ver y cerrar forzosamente desde AdminPage</li>
                    <li className="text-sm text-foreground/80">• Auditorías vencidas (pending_photos): restaurar +24h o eliminar</li>
                    <li className="text-sm text-foreground/80">• Restricción: solo el auditor dueño puede continuar su auditoría</li>
                    <li className="text-sm text-foreground/80">• Multisesión configurable por Super Admin (allow_multi_session)</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix39" ? null : "fix39")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix39</span>
                      <span className="text-xs text-muted-foreground">2026-03-13 — Timeout de inactividad configurable</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Cierre de sesión por inactividad. Timer 5-480 min. Banner de aviso 5 m...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix39" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix39" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Cierre de sesión por inactividad. Timer 5-480 min. Banner de aviso 5 min antes.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Timeout configurable: 5-480 minutos desde AdminPage</li>
                    <li className="text-sm text-foreground/80">• Banner de aviso con cuenta regresiva 5 min antes del cierre</li>
                    <li className="text-sm text-foreground/80">• Botón 'Seguir trabajando' para extender la sesión</li>
                    <li className="text-sm text-foreground/80">• Parámetro session_timeout_minutes en system_settings</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix38" ? null : "fix38")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix38</span>
                      <span className="text-xs text-muted-foreground">2026-03-12 — Documentación técnica PDF completa (10 secciones)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">generate_tech_documentation() con 10 secciones y 40+ páginas profesion...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix38" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix38" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">generate_tech_documentation() con 10 secciones y 40+ páginas profesionales.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• 10 secciones: Requisitos, Casos de Uso, Arquitectura, BD, API, Wireframes, Pruebas, Deploy, Manual, Changelog</li>
                    <li className="text-sm text-foreground/80">• 15 RF y 7 RNF en tablas con ID</li>
                    <li className="text-sm text-foreground/80">• 42 endpoints documentados con método HTTP codificado por color</li>
                    <li className="text-sm text-foreground/80">• Esquema de 12 colecciones MongoDB con todos sus campos</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix37" ? null : "fix37")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix37</span>
                      <span className="text-xs text-muted-foreground">2026-03-12 — DeployPage con seguridad y botón documentación</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Sección de seguridad en DeployPage. Botón de documentación técnica PDF...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix37" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix37" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Sección de seguridad en DeployPage. Botón de documentación técnica PDF.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Sección 'Características de seguridad implementadas' con 9 mecanismos</li>
                    <li className="text-sm text-foreground/80">• Actualización de instrucciones de deploy con stamp-sw.js</li>
                    <li className="text-sm text-foreground/80">• Botón 'Documentación' que genera PDF técnico completo</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix36" ? null : "fix36")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix36</span>
                      <span className="text-xs text-muted-foreground">2026-03-12 — CSV import y deduplicación en exportaciones</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Importación CSV con normalización. Dedup en exportaciones y análisis c...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix36" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix36" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Importación CSV con normalización. Dedup en exportaciones y análisis cruzado.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Importación masiva acepta .xlsx y .csv con detección automática</li>
                    <li className="text-sm text-foreground/80">• Normalización de headers: Contraseña→password, Correo→email</li>
                    <li className="text-sm text-foreground/80">• Deduplicación en exportaciones por (equipment_id, type, audit_id)</li>
                    <li className="text-sm text-foreground/80">• Deduplicación en análisis cruzado: prioridad al mejor score</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix35" ? null : "fix35")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix35</span>
                      <span className="text-xs text-muted-foreground">2026-03-12 — LogsPage sort server-side</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Ordenamiento en servidor con sort_by + sort_dir. Considera todos los r...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix35" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix35" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Ordenamiento en servidor con sort_by + sort_dir. Considera todos los registros.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Endpoint /logs/audits acepta sort_by y sort_dir con whitelist</li>
                    <li className="text-sm text-foreground/80">• Ordenamiento en MongoDB antes de paginación: considera TODOS los registros</li>
                    <li className="text-sm text-foreground/80">• Frontend resetea a página 1 al cambiar orden</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix34" ? null : "fix34")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix34</span>
                      <span className="text-xs text-muted-foreground">2026-03-12 — CardHeader/CardTitle restaurados en AdminPage</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fix raíz de la pantalla en blanco del módulo de Administración.</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix34" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix34" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fix raíz de la pantalla en blanco del módulo de Administración.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• CAUSA RAÍZ: CardHeader y CardTitle eliminados por error</li>
                    <li className="text-sm text-foreground/80">• Componentes JSX sin importar = crash silencioso en runtime</li>
                    <li className="text-sm text-foreground/80">• El build pasaba pero React no podía renderizar los componentes</li>
                    <li className="text-sm text-foreground/80">• Fix definitivo de la pantalla en blanco en Administración</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix33" ? null : "fix33")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix33</span>
                      <span className="text-xs text-muted-foreground">2026-03-12 — Limpieza exhaustiva de imports no usados</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Eliminación de todos los imports no usados. Causa raíz de build fails ...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix33" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix33" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Eliminación de todos los imports no usados. Causa raíz de build fails con CI=true.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Eliminación de imports no usados en todos los archivos .js</li>
                    <li className="text-sm text-foreground/80">• CI=true convierte no-unused-vars en error fatal que aborta yarn build</li>
                    <li className="text-sm text-foreground/80">• Scripts de análisis automático de imports</li>
                    <li className="text-sm text-foreground/80">• Railway servía bundle viejo cuando el build fallaba silenciosamente</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix32" ? null : "fix32")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix32</span>
                      <span className="text-xs text-muted-foreground">2026-03-11 — Guard !audit en AuditPage</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Guard de seguridad en AuditPage para evitar errores con audit null.</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix32" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix32" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Guard de seguridad en AuditPage para evitar errores con audit null.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Guard if (!audit) return null en AuditPage</li>
                    <li className="text-sm text-foreground/80">• Fix de TabsContent en componentes de auditoría</li>
                    <li className="text-sm text-foreground/80">• Correcciones de errores de renderizado</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix31" ? null : "fix31")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix31</span>
                      <span className="text-xs text-muted-foreground">2026-03-11 — stamp-sw.js prebuild</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Script stamp-sw.js inyecta timestamp único en cada build.</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix31" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix31" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Script stamp-sw.js inyecta timestamp único en cada build.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Script scripts/stamp-sw.js ejecutado como prebuild</li>
                    <li className="text-sm text-foreground/80">• sw.template.js como plantilla base del Service Worker</li>
                    <li className="text-sm text-foreground/80">• CACHE_NAME con timestamp único por build</li>
                    <li className="text-sm text-foreground/80">• Garantía de banner de actualización en cada nuevo deploy</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix30" ? null : "fix30")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix30</span>
                      <span className="text-xs text-muted-foreground">2026-03-11 — Service Worker con waiting state correcto</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">SW sin skipWaiting en install. Banner de actualización controlado por ...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix30" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix30" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">SW sin skipWaiting en install. Banner de actualización controlado por el usuario.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• SW v5: install sin skipWaiting (permite estado waiting)</li>
                    <li className="text-sm text-foreground/80">• SKIP_WAITING activa la actualización solo al confirmar</li>
                    <li className="text-sm text-foreground/80">• Banner de actualización disponible en la UI</li>
                    <li className="text-sm text-foreground/80">• controllerchange recarga automáticamente tras activar nuevo SW</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix29" ? null : "fix29")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix29</span>
                      <span className="text-xs text-muted-foreground">2026-03-11 — Búsqueda limit=0 y validación de contraseña</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Búsqueda de equipos con limit=0. Validación de contraseña actual antes...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix29" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix29" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Búsqueda de equipos con limit=0. Validación de contraseña actual antes de cambiarla.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Búsqueda de equipos: limit=0 devuelve todos los registros</li>
                    <li className="text-sm text-foreground/80">• Validación de contraseña actual requerida antes de cambiar</li>
                    <li className="text-sm text-foreground/80">• Fix de paginación en búsqueda</li>
                    <li className="text-sm text-foreground/80">• Correcciones en exportación de movimientos</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix20" ? null : "fix20")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix20</span>
                      <span className="text-xs text-muted-foreground">2026-03-10 — Análisis cruzado global y exportaciones mejoradas</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Endpoint global entre todas las auditorías. Importación masiva de usua...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix20" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix20" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Endpoint global entre todas las auditorías. Importación masiva de usuarios.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Endpoint GET /cross-analysis/global para Super Administrador</li>
                    <li className="text-sm text-foreground/80">• Exportación AB y Transferencias con formato corporativo AF</li>
                    <li className="text-sm text-foreground/80">• Importación masiva de usuarios desde Excel (.xlsx)</li>
                    <li className="text-sm text-foreground/80">• Fix de lógica de fotos (auto_generated=True para bajas de sistema)</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix17" ? null : "fix17")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix17</span>
                      <span className="text-xs text-muted-foreground">2026-03-10 — Análisis cruzado y pending_photos TTL</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Análisis cruzado No Localizado vs Sobrante. pending_photos con TTL con...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix17" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix17" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Análisis cruzado No Localizado vs Sobrante. pending_photos con TTL configurable.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Análisis cruzado: detectar equipos desplazados entre tiendas</li>
                    <li className="text-sm text-foreground/80">• Estado pending_photos con TTL configurable 1-168 horas</li>
                    <li className="text-sm text-foreground/80">• Background task cada hora que limpia auditorías vencidas</li>
                    <li className="text-sm text-foreground/80">• Campos needs_photo_ab y needs_photo_transf en auditorías</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix16" ? null : "fix16")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix16</span>
                      <span className="text-xs text-muted-foreground">2026-03-10 — SystemLogsPage unificada</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Panel de logs unificado con 4 tabs: App, Seguridad, Historial Admin, F...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix16" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix16" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Panel de logs unificado con 4 tabs: App, Seguridad, Historial Admin, Fixes.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• SystemLogsPage unificada con 4 tabs</li>
                    <li className="text-sm text-foreground/80">• Eliminación de AppLogsPage.js y SecurityLogsPage.js obsoletos</li>
                    <li className="text-sm text-foreground/80">• Paginación y búsqueda en todas las secciones de logs</li>
                    <li className="text-sm text-foreground/80">• Tab de Fixes con acordeón expandible</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix15" ? null : "fix15")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix15</span>
                      <span className="text-xs text-muted-foreground">2026-03-09 — Multi-idioma ES/EN/PT</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Soporte completo para 3 idiomas. Paleta OXXO. Persistencia de preferen...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix15" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix15" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Soporte completo para 3 idiomas. Paleta OXXO. Persistencia de preferencias.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Sistema de internacionalización con 3 idiomas: ES/EN/PT</li>
                    <li className="text-sm text-foreground/80">• Paleta de colores OXXO (rojo/amarillo) además de Profesional (azul marino)</li>
                    <li className="text-sm text-foreground/80">• Selector de idioma y tema en sidebar</li>
                    <li className="text-sm text-foreground/80">• Persistencia de preferencias en localStorage</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix14" ? null : "fix14")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix14</span>
                      <span className="text-xs text-muted-foreground">2026-03-09 — Fotos condicionales y lightbox</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Fotos AF configurables por tipo. Lightbox. Historial admin con rollbac...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix14" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix14" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Fotos AF configurables por tipo. Lightbox. Historial admin con rollback.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Fotos condicionales: toggle separado para ALTAS, BAJAS y TRANSFERENCIAS</li>
                    <li className="text-sm text-foreground/80">• Lightbox para visualizar fotos en historial de auditorías</li>
                    <li className="text-sm text-foreground/80">• Historial de acciones de administrador con rollback</li>
                    <li className="text-sm text-foreground/80">• Búsqueda avanzada de equipos por serie, descripción, marca</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix13" ? null : "fix13")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix13</span>
                      <span className="text-xs text-muted-foreground">2026-03-09 — Firmas digitales y cifrado</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Firmas HMAC-SHA256 por auditoría. Cifrado Fernet para campos sensibles...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix13" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix13" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Firmas HMAC-SHA256 por auditoría. Cifrado Fernet para campos sensibles.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Firma digital HMAC-SHA256 al completar cada auditoría</li>
                    <li className="text-sm text-foreground/80">• Cifrado Fernet para campos serie y factura en MongoDB</li>
                    <li className="text-sm text-foreground/80">• Endpoint GET /audits/{id}/verify-signature</li>
                    <li className="text-sm text-foreground/80">• PDF del manual de usuario dinámico por perfil</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix10" ? null : "fix10")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix10</span>
                      <span className="text-xs text-muted-foreground">2026-03-08 — Sesión única y conflicto por IP/UA</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Sistema de sesión única por usuario. Detección de conflicto con IP/UA....</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix10" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix10" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Sistema de sesión única por usuario. Detección de conflicto con IP/UA. Logs de seguridad.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Sesión única por usuario (una sesión activa a la vez)</li>
                    <li className="text-sm text-foreground/80">• Detección de conflicto de sesión con IP y User-Agent</li>
                    <li className="text-sm text-foreground/80">• Logs de seguridad con niveles INFO/WARNING/CRITICAL</li>
                    <li className="text-sm text-foreground/80">• Flujo de desbloqueo de cuenta</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix7" ? null : "fix7")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix7</span>
                      <span className="text-xs text-muted-foreground">2026-03-07 — UX y Badge En Progreso</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Mejoras UX, badge 'En Progreso', pdf_generator.py, columnas Serie y De...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix7" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix7" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Mejoras UX, badge 'En Progreso', pdf_generator.py, columnas Serie y Depreciado.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Badge visual 'En Progreso' en tarjetas de tienda</li>
                    <li className="text-sm text-foreground/80">• Creación de pdf_generator.py (base para manuales y reportes)</li>
                    <li className="text-sm text-foreground/80">• Columnas Serie y Depreciado en tablas de equipos</li>
                    <li className="text-sm text-foreground/80">• Mejoras generales de UX en el Dashboard</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-b last:border-0">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition text-left"
                  onClick={() => setExpandedFix(expandedFix === "fix6" ? null : "fix6")}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-sm text-primary">fix6</span>
                      <span className="text-xs text-muted-foreground">2026-03-06 — Release inicial</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Deploy inicial en Railway. Cámara de escaneo, sobrante desconocido bás...</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFix === "fix6" ? "rotate-180" : ""}`} />
                </button>
                {expandedFix === "fix6" && (
                  <div className="px-4 pb-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Deploy inicial en Railway. Cámara de escaneo, sobrante desconocido básico, tablas móviles, exportación Excel.</p>
                    <ul className="space-y-1">
                    <li className="text-sm text-foreground/80">• Deploy inicial en Railway (Frontend React + Backend FastAPI + MongoDB Atlas)</li>
                    <li className="text-sm text-foreground/80">• Módulo de cámara para escaneo de equipos</li>
                    <li className="text-sm text-foreground/80">• Registro básico de sobrante desconocido</li>
                    <li className="text-sm text-foreground/80">• Tablas responsivas para móvil</li>
                    <li className="text-sm text-foreground/80">• Exportación a Excel con fotos embebidas</li>
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