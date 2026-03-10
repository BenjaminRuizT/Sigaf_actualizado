import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  History, RefreshCw, RotateCcw, Filter, Trash2, UserMinus, UserCog,
  UserPlus, DatabaseZap, FileX, Wrench, ChevronDown, ChevronUp, ShieldAlert
} from "lucide-react";

const ACTION_META = {
  DELETE_AUDIT:     { label: "Auditoría eliminada",    icon: FileX,       color: "text-red-600",    bg: "bg-red-500/10 border-red-500/30",       rollback: true },
  DELETE_USER:      { label: "Usuario eliminado",      icon: UserMinus,   color: "text-red-600",    bg: "bg-red-500/10 border-red-500/30",       rollback: true },
  UPDATE_USER:      { label: "Usuario actualizado",    icon: UserCog,     color: "text-amber-600",  bg: "bg-amber-500/10 border-amber-500/30",   rollback: true },
  CREATE_USER:      { label: "Usuario creado",         icon: UserPlus,    color: "text-blue-600",   bg: "bg-blue-500/10 border-blue-500/30",     rollback: false },
  UPDATE_EQUIPMENT: { label: "Equipo modificado",      icon: Wrench,      color: "text-amber-600",  bg: "bg-amber-500/10 border-amber-500/30",   rollback: true },
  DATA_RESET:       { label: "Reset de datos",         icon: DatabaseZap, color: "text-red-700",    bg: "bg-red-600/15 border-red-600/40",       rollback: false },
};

export default function AdminHistoryPage() {
  const { api } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [rollingBack, setRollingBack] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (actionFilter !== "all") params.action = actionFilter;
      const res = await api.get("/admin/history", { params });
      setItems(res.data || []);
    } catch { toast.error("Error al cargar historial"); }
    finally { setLoading(false); }
  }, [api, actionFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleRollback = async (snap) => {
    if (!window.confirm(`¿Revertir esta acción?\n\n"${ACTION_META[snap.action]?.label}" sobre "${snap.target_label}"\n\nEsta operación restaurará el estado anterior.`)) return;
    setRollingBack(snap.id);
    try {
      const res = await api.post(`/admin/history/${snap.id}/rollback`);
      toast.success(res.data.message);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al revertir la acción");
    } finally { setRollingBack(null); }
  };

  const canRollback = (snap) => snap.can_rollback && !snap.rolled_back;

  return (
    <div className="space-y-5" data-testid="admin-history-page">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight flex items-center gap-2">
            <History className="h-8 w-8 text-primary" /> Historial de Cambios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Registro de acciones críticas con opción de rollback</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono">{items.length}</p>
          <p className="text-xs text-muted-foreground">Total acciones</p>
        </CardContent></Card>
        <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-amber-600">{items.filter(i => i.can_rollback && !i.rolled_back).length}</p>
          <p className="text-xs text-muted-foreground">Reversibles</p>
        </CardContent></Card>
        <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-blue-600">{items.filter(i => i.rolled_back).length}</p>
          <p className="text-xs text-muted-foreground">Revertidas</p>
        </CardContent></Card>
        <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold font-mono text-red-600">{items.filter(i => ["DELETE_AUDIT","DELETE_USER","DATA_RESET"].includes(i.action)).length}</p>
          <p className="text-xs text-muted-foreground">Eliminaciones</p>
        </CardContent></Card>
      </div>

      {/* Filtro */}
      <Card><CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-56 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              {Object.entries(ACTION_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Lista */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading uppercase tracking-tight">
            Línea de tiempo ({items.length} acciones)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <History className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Sin acciones registradas</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map(snap => {
                const meta = ACTION_META[snap.action] || { label: snap.action, icon: ShieldAlert, color: "text-muted-foreground", bg: "" };
                const Icon = meta.icon;
                const isExpanded = expanded === snap.id;
                return (
                  <div key={snap.id} className={`px-4 py-3 ${snap.rolled_back ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${meta.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                          {snap.rolled_back && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-700 border-emerald-500/30 bg-emerald-500/10">
                              ↩ Revertida
                            </Badge>
                          )}
                          {snap.target_label && (
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[200px]" title={snap.target_label}>
                              {snap.target_label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-0.5">
                          <span>{new Date(snap.ts).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "medium" })}</span>
                          <span className="font-medium text-foreground">{snap.actor_email}</span>
                        </div>
                        {snap.rolled_back && snap.rolled_back_by && (
                          <p className="text-[11px] text-emerald-600 mt-0.5">
                            Revertida por {snap.rolled_back_by} · {new Date(snap.rolled_back_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {snap.before && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => setExpanded(isExpanded ? null : snap.id)}>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        {canRollback(snap) && (
                          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs"
                            onClick={() => handleRollback(snap)}
                            disabled={rollingBack === snap.id}>
                            {rollingBack === snap.id
                              ? <div className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
                              : <RotateCcw className="h-3 w-3" />}
                            Revertir
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Detalle expandido del snapshot */}
                    {isExpanded && snap.before && (
                      <div className="mt-3 ml-10 p-3 bg-muted/40 rounded-lg border text-xs font-mono space-y-1 max-h-48 overflow-auto">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Estado anterior (snapshot)</p>
                        {Object.entries(snap.before)
                          .filter(([k]) => !["password_hash", "_id"].includes(k))
                          .map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-muted-foreground w-32 shrink-0">{k}:</span>
                              <span className="text-foreground break-all">{v === null ? "null" : v === true ? "true" : v === false ? "false" : String(v).slice(0, 120)}</span>
                            </div>
                          ))}
                      </div>
                    )}
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
