import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  RefreshCw,
  Download,
  Trash2,
  Search,
  X,
  Info,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  UserCog,
  KeyRound,
  DatabaseZap,
  FileCheck,
  FileX,
  LogIn,
  LogOut,
  Filter
} from "lucide-react";

const EVENT_META = {
  LOGIN_SUCCESS:    { label: "Login exitoso",            icon: LogIn,       color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" },
  LOGIN_FAILED:     { label: "Login fallido",            icon: LogOut,      color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  ACCOUNT_LOCKED:   { label: "Cuenta bloqueada",         icon: Lock,        color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  ACCOUNT_UNLOCKED: { label: "Cuenta desbloqueada",      icon: Unlock,      color: "text-blue-600",    bg: "bg-blue-500/10 border-blue-500/30" },
  UNLOCK_REQUESTED: { label: "Solicitud desbloqueo",     icon: KeyRound,    color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  PASSWORD_CHANGED: { label: "Contraseña modificada",    icon: KeyRound,    color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  USER_CREATED:     { label: "Usuario creado",           icon: UserPlus,    color: "text-blue-600",    bg: "bg-blue-500/10 border-blue-500/30" },
  USER_UPDATED:     { label: "Usuario actualizado",      icon: UserCog,     color: "text-blue-600",    bg: "bg-blue-500/10 border-blue-500/30" },
  USER_DELETED:     { label: "Usuario eliminado",        icon: UserMinus,   color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  ROLE_CHANGED:     { label: "Rol modificado",           icon: ShieldAlert, color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  AUDIT_FINALIZED:  { label: "Auditoría finalizada",     icon: FileCheck,   color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" },
  AUDIT_DELETED:    { label: "Auditoría eliminada",      icon: FileX,       color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  AUDIT_CANCELLED:  { label: "Auditoría cancelada",      icon: FileX,       color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  EQUIPMENT_EDITED: { label: "Equipo modificado",        icon: DatabaseZap, color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  DATA_RESET:       { label: "Datos reiniciados",        icon: DatabaseZap, color: "text-red-600",     bg: "bg-red-500/12 border-red-500/30" },
  SIGNATURE_VALID:  { label: "Firma verificada ✓",       icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" },
  SIGNATURE_INVALID:{ label: "Firma inválida — tampering", icon: ShieldX,   color: "text-red-700",     bg: "bg-red-600/15 border-red-600/40" },
};

const LEVEL_BADGE = {
  INFO:     <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-700 border-blue-500/30">INFO</Badge>,
  WARNING:  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 border-amber-500/30">ALERTA</Badge>,
  CRITICAL: <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/12 text-red-700 border-red-500/40">CRÍTICO</Badge>,
};

const ALL_EVENTS = Object.keys(EVENT_META);

export default function SecurityLogsPage() {
  const { api } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [actorSearch, setActorSearch] = useState("");
  const [debouncedActor, setDebouncedActor] = useState("");
  const [limit, setLimit] = useState("200");
  const [clearing, setClearing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRef = useRef(false);
  autoRef.current = autoRefresh;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedActor(actorSearch), 400);
    return () => clearTimeout(t);
  }, [actorSearch]);

  const fetchLogs = useCallback(async () => {
    try {
      const params = { limit: parseInt(limit) };
      if (levelFilter !== "all") params.level = levelFilter;
      if (eventFilter !== "all") params.event = eventFilter;
      if (debouncedActor) params.actor_email = debouncedActor;
      const res = await api.get("/admin/security-logs", { params });
      setLogs(res.data || []);
    } catch { toast.error("Error al cargar logs de seguridad"); }
    finally { setLoading(false); }
  }, [api, limit, levelFilter, eventFilter, debouncedActor]);

  useEffect(() => { setLoading(true); fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { if (autoRef.current) fetchLogs(); }, 15000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchLogs]);

  const handleClear = async () => {
    if (!window.confirm("¿Purgar logs con más de 90 días de antigüedad?")) return;
    setClearing(true);
    try {
      const res = await api.delete("/admin/security-logs");
      toast.success(`${res.data.deleted} registros eliminados`);
      fetchLogs();
    } catch { toast.error("Error al purgar logs"); }
    finally { setClearing(false); }
  };

  const handleExport = () => {
    const rows = [
      ["Timestamp", "Nivel", "Evento", "Actor", "Actor ID", "Objetivo", "IP", "Detalle"],
      ...logs.map(l => [
        l.ts, l.level, l.event,
        l.actor_email || "", l.actor_id || "", l.target || "", l.ip || "",
        l.detail ? JSON.stringify(l.detail) : ""
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv, { type: "text/csv;charset=utf-8" }]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sigaf_security_logs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const criticalCount = logs.filter(l => l.level === "CRITICAL").length;
  const warningCount = logs.filter(l => l.level === "WARNING").length;
  const infoCount = logs.filter(l => l.level === "INFO").length;
  const uniqueActors = new Set(logs.map(l => l.actor_email).filter(Boolean)).size;

  return (
    <div className="space-y-4" data-testid="security-logs-page">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" /> Logs de Seguridad
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auditoría de acciones críticas — acceso a cuentas, cambios de datos y firmas digitales
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchLogs(); }} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </Button>
          <Button variant={autoRefresh ? "default" : "outline"} size="sm"
            onClick={() => setAutoRefresh(p => !p)} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> {autoRefresh ? "Auto ON" : "Auto OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={logs.length === 0} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear} disabled={clearing}
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" /> Purgar &gt;90 días
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono">{logs.length}</p>
          <p className="text-xs text-muted-foreground">Total eventos</p>
        </CardContent></Card>
        <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-red-600">{criticalCount}</p>
          <p className="text-xs text-muted-foreground">Críticos</p>
        </CardContent></Card>
        <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-amber-600">{warningCount}</p>
          <p className="text-xs text-muted-foreground">Alertas</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono">{uniqueActors}</p>
          <p className="text-xs text-muted-foreground">Actores únicos</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Nivel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="CRITICAL">Crítico</SelectItem>
                <SelectItem value="WARNING">Alerta</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-52 h-9 text-sm"><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                {ALL_EVENTS.map(e => (
                  <SelectItem key={e} value={e}>{EVENT_META[e]?.label || e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar por usuario..." value={actorSearch}
                onChange={e => setActorSearch(e.target.value)} className="pl-8 h-9 text-sm" />
              {actorSearch && (
                <button onClick={() => setActorSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 registros</SelectItem>
                <SelectItem value="200">200 registros</SelectItem>
                <SelectItem value="500">500 registros</SelectItem>
                <SelectItem value="2000">2000 registros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading uppercase tracking-tight">
            Línea de tiempo ({logs.length} eventos)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No hay eventos de seguridad registrados</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log, i) => {
                const meta = EVENT_META[log.event] || { label: log.event, icon: Info, color: "text-muted-foreground", bg: "" };
                const Icon = meta.icon;
                const isCritical = log.level === "CRITICAL";
                return (
                  <div key={i} className={`flex gap-3 px-4 py-3 items-start transition-colors hover:bg-muted/30 ${isCritical ? "bg-red-500/5" : ""}`}>
                    <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${meta.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                        {LEVEL_BADGE[log.level]}
                        {log.target && (
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[160px]" title={log.target}>
                            {log.target}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        <span>{new Date(log.ts).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "medium" })}</span>
                        {log.actor_email && <span className="font-medium text-foreground">{log.actor_email}</span>}
                        {log.ip && <span className="font-mono">{log.ip}</span>}
                      </div>
                      {log.detail && Object.keys(log.detail).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(log.detail).slice(0, 4).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-muted rounded px-1.5 py-0.5 font-mono text-muted-foreground">
                              {k}: <span className="text-foreground">{String(v).slice(0, 40)}</span>
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
    </div>
  );
}
