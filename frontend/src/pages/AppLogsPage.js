import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, Download, Trash2, AlertTriangle, CheckCircle, Info, Search, X, Activity } from "lucide-react";

const METHOD_COLORS = {
  GET: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  POST: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  PUT: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  DELETE: "bg-red-500/15 text-red-700 border-red-500/30",
  PATCH: "bg-violet-500/15 text-violet-700 border-violet-500/30",
};

const STATUS_ICON = {
  ok: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
  warning: <Info className="h-3.5 w-3.5 text-amber-500" />,
  error: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
};

function getStatusCategory(status) {
  if (status >= 500) return "error";
  if (status >= 400) return "warning";
  return "ok";
}

export default function AppLogsPage() {
  const { api } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [limit, setLimit] = useState("200");
  const [clearing, setClearing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef(false);
  autoRefreshRef.current = autoRefresh;

  const fetchLogs = useCallback(async (params = {}) => {
    try {
      const q = { limit: params.limit ?? parseInt(limit), errors_only: params.errorsOnly ?? errorsOnly };
      if (params.search ?? debouncedSearch) q.path = params.search ?? debouncedSearch;
      if (debouncedEmail) q.user_email = debouncedEmail;
      const res = await api.get("/admin/app-logs", { params: q });
      setLogs(res.data || []);
    } catch (err) {
      toast.error("Error al cargar logs");
    } finally {
      setLoading(false);
    }
  }, [api, limit, errorsOnly, debouncedSearch, debouncedEmail]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmail(emailFilter), 400);
    return () => clearTimeout(t);
  }, [emailFilter]);

  useEffect(() => { setLoading(true); fetchLogs(); }, [fetchLogs]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { if (autoRefreshRef.current) fetchLogs(); }, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchLogs]);

  const handleClearLogs = async () => {
    if (!window.confirm("¿Eliminar todos los logs? Esta acción no se puede deshacer.")) return;
    setClearing(true);
    try {
      const res = await api.delete("/admin/app-logs");
      toast.success(`${res.data.deleted} logs eliminados`);
      setLogs([]);
    } catch { toast.error("Error al eliminar logs"); }
    finally { setClearing(false); }
  };

  const handleExport = () => {
    const rows = [
      ["Timestamp", "Método", "Ruta", "Status", "Duración (ms)", "Usuario", "IP", "Error"],
      ...logs.map(l => [l.ts, l.method, l.path, l.status, l.duration_ms, l.user_email || "", l.ip || "", l.error_detail || ""])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sigaf_logs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const errorCount = logs.filter(l => l.is_error).length;
  const okCount = logs.length - errorCount;

  return (
    <div className="space-y-4" data-testid="app-logs-page">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8" /> Logs de Aplicación
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitoreo de actividad y errores del sistema</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchLogs(); }} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"} size="sm"
            onClick={() => setAutoRefresh(p => !p)} className="gap-1.5"
          >
            <Activity className="h-3.5 w-3.5" /> {autoRefresh ? "Auto ON" : "Auto OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5" disabled={logs.length === 0}>
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearLogs} disabled={clearing || logs.length === 0}
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" /> Limpiar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold font-mono">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total registros</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold font-mono text-red-600">{errorCount}</p>
            <p className="text-xs text-muted-foreground">Errores (4xx/5xx)</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold font-mono text-emerald-600">{okCount}</p>
            <p className="text-xs text-muted-foreground">Exitosos (2xx/3xx)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold font-mono">
              {logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / logs.length) : 0}ms
            </p>
            <p className="text-xs text-muted-foreground">Duración promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar por ruta..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-[160px]">
              <Info className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Filtrar por usuario..." value={emailFilter}
                onChange={e => setEmailFilter(e.target.value)} className="pl-8 h-9 text-sm" />
              {emailFilter && (
                <button onClick={() => setEmailFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button size="sm" variant={errorsOnly ? "destructive" : "outline"}
              onClick={() => setErrorsOnly(p => !p)} className="gap-1.5 h-9">
              <AlertTriangle className="h-3.5 w-3.5" />
              {errorsOnly ? "Solo errores ✓" : "Solo errores"}
            </Button>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-28 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 logs</SelectItem>
                <SelectItem value="200">200 logs</SelectItem>
                <SelectItem value="500">500 logs</SelectItem>
                <SelectItem value="1000">1000 logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading uppercase tracking-tight">
            {errorsOnly ? "Registros de errores" : "Todos los registros"} ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No hay registros</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-5">&nbsp;</th>
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
                  {logs.map((log, i) => {
                    const cat = getStatusCategory(log.status);
                    const isErr = cat === "error";
                    const isWarn = cat === "warning";
                    return (
                      <tr key={i}
                        className={`border-b transition-colors ${isErr ? "bg-red-500/8 hover:bg-red-500/12" : isWarn ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-muted/40"}`}
                      >
                        <td className="px-3 py-1.5">{STATUS_ICON[cat]}</td>
                        <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(log.ts).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "medium" })}
                        </td>
                        <td className="px-3 py-1.5">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${METHOD_COLORS[log.method] || ""}`}>
                            {log.method}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5 font-mono max-w-[200px] truncate" title={log.path}>{log.path}</td>
                        <td className="px-3 py-1.5">
                          <span className={`font-mono font-bold ${isErr ? "text-red-600" : isWarn ? "text-amber-600" : "text-emerald-600"}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                          <span className={log.duration_ms > 1000 ? "text-amber-600 font-semibold" : ""}>
                            {log.duration_ms}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground max-w-[140px] truncate" title={log.user_email || ""}>
                          {log.user_email || <span className="opacity-40">—</span>}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">{log.ip || "—"}</td>
                        <td className="px-3 py-1.5 max-w-[200px] truncate text-red-600" title={log.error_detail || ""}>
                          {log.error_detail || <span className="opacity-40">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
