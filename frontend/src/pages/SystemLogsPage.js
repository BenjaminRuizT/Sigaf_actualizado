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
  Activity, ShieldCheck, ShieldAlert, ShieldX, RefreshCw, Download, Trash2,
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

  // ── Render ───────────────────────────────────────────────────────────────
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
      </Tabs>
    </div>
  );
}
