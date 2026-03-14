import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSortable } from "@/hooks/useSortable";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Store,
  Monitor,
  CheckCircle,
  Search,
  Play,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  DollarSign,
  BarChart3,
  FileText
} from "lucide-react";
import { PlazaBarChart, DepreciationPieChart, AuditStatusChart } from "@/components/DashboardCharts";


export default function DashboardPage() {
  const { api, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [plazas, setPlazas] = useState([]);
  const [selectedPlaza, setSelectedPlaza] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStore, setSelectedStore] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState("info");
  const [storeEquipment, setStoreEquipment] = useState([]);
  const [eqLoading, setEqLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const eqSort = useSortable("descripcion");

  const fetchStats = useCallback(async () => {
    try {
      const params = {};
      if (selectedPlaza !== "all") params.plaza = selectedPlaza;
      const res = await api.get("/dashboard/stats", { params });
      setStats(res.data);
    } catch { toast.error(t("common.error")); }
  }, [api, t, selectedPlaza]);

  const fetchPlazas = useCallback(async () => {
    try { const res = await api.get("/stores/plazas"); setPlazas(res.data); } catch {}
  }, [api]);

  const fetchStores = useCallback(async () => {
    try {
      const params = { page, limit: 30 };
      if (selectedPlaza !== "all") params.plaza = selectedPlaza;
      if (search) params.search = search;
      const res = await api.get("/stores", { params });
      setStores(res.data.stores);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch {}
  }, [api, page, selectedPlaza, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPlazas(); }, [fetchPlazas]);
  useEffect(() => { fetchStores(); }, [fetchStores]);
  useEffect(() => { setPage(1); }, [selectedPlaza, search]);

  const fetchStoreEquipment = async (cr_tienda) => {
    setEqLoading(true);
    try {
      const res = await api.get(`/stores/${cr_tienda}/equipment`, { params: { limit: 500 } });
      setStoreEquipment(res.data.equipment);
    } catch {} finally { setEqLoading(false); }
  };

  const handleStartAudit = async () => {
    if (!selectedStore) return;
    setAuditLoading(true);
    try {
      const res = await api.post("/audits", { cr_tienda: selectedStore.cr_tienda });
      setDialogOpen(false);
      navigate(`/audit/${res.data.id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403 && detail?.code === "AUDIT_IN_PROGRESS") {
        toast.error(
          `Auditoría en progreso por ${detail.auditor_name}. Solo ese auditor puede continuar.`,
          { duration: 7000 }
        );
      } else {
        toast.error(typeof detail === "string" ? detail : t("common.error"));
      }
    }
    finally { setAuditLoading(false); }
  };

  const openStore = (store) => {
    setSelectedStore(store);
    setDialogTab("info");
    setStoreEquipment([]);
    setDialogOpen(true);
  };

  const handleViewEquipment = () => {
    setDialogTab("equipment");
    if (selectedStore && storeEquipment.length === 0) fetchStoreEquipment(selectedStore.cr_tienda);
  };

  const fmt = (n) => new Intl.NumberFormat("es-MX").format(n || 0);
  const fmtMoneyShort = (n) => {
    if (!n) return "$0";
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };
  const fmtMoney = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

  const kpis = stats ? [
    { label: t("dashboard.totalStores"), value: fmt(stats.total_stores), icon: Store, color: "text-blue-500" },
    { label: t("dashboard.auditedStores"), value: fmt(stats.audited_stores), icon: CheckCircle, color: "text-emerald-500" },
    { label: t("dashboard.totalEquipment"), value: fmt(stats.total_equipment), icon: Monitor, color: "text-violet-500" },
    { label: t("dashboard.deprecatedEquipment"), value: fmt(stats.deprecated_equipment), icon: TrendingDown, color: "text-amber-500" },
    { label: t("dashboard.totalRealValue"), value: fmtMoneyShort(stats.total_real_value), icon: DollarSign, color: "text-emerald-500" },
    { label: t("dashboard.completedAudits"), value: fmt(stats.completed_audits), icon: BarChart3, color: "text-blue-500" },
  ] : [];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight" data-testid="dashboard-welcome">
          {t("dashboard.welcome")}, {user?.nombre?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t("app.fullName")}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {kpis.map((kpi, i) => (
            <Card key={i} className="kpi-card" data-testid={`kpi-card-${i}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium leading-tight">{kpi.label}</p>
                    <p className="font-mono text-lg md:text-xl font-bold tracking-tight truncate">{kpi.value}</p>
                  </div>
                  <kpi.icon className={`h-4 w-4 ${kpi.color} opacity-60 shrink-0 mt-0.5`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stats?.equipment_by_plaza && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlazaBarChart data={stats.equipment_by_plaza} />
          <DepreciationPieChart active={stats.total_equipment - stats.deprecated_equipment} deprecated={stats.deprecated_equipment} />
          <AuditStatusChart completed={stats.audited_stores} inProgress={stats.active_audits} unaudited={stats.unaudited_stores} />
        </div>
      )}

      {/* PDF Downloads */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={async () => {
          try {
            const res = await api.get("/download/manual", { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a"); a.href = url; a.download = "SIGAF_Manual_de_Usuario.pdf";
            document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
            toast.success("Manual descargado");
          } catch { toast.error(t("common.error")); }
        }} data-testid="download-manual-btn" className="gap-2">
          <FileText className="h-4 w-4" /> Manual de Usuario (PDF)
        </Button>
        {user?.perfil === "Super Administrador" && (
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              const res = await api.get("/download/presentation", { responseType: "blob" });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const a = document.createElement("a"); a.href = url; a.download = "SIGAF_Presentacion.pdf";
              document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
              toast.success("Presentación descargada");
            } catch { toast.error(t("common.error")); }
          }} data-testid="download-presentation-btn" className="gap-2">
            <FileText className="h-4 w-4" /> Presentación (PDF)
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedPlaza} onValueChange={setSelectedPlaza}>
          <SelectTrigger className="w-full sm:w-52" data-testid="plaza-filter-trigger"><SelectValue placeholder={t("dashboard.filterByPlaza")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dashboard.allPlazas")}</SelectItem>
            {plazas.map(p => (<SelectItem key={p.cr_plaza} value={p.plaza}>{p.plaza} ({p.store_count})</SelectItem>))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("dashboard.searchStore")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-9" data-testid="store-search-input" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Limpiar búsqueda">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold uppercase tracking-tight">
          {t("dashboard.storesOverview")} <span className="text-muted-foreground font-mono text-base">({fmt(total)})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stores.map(store => (
          <Card key={store.cr_tienda} className="cursor-pointer hover:border-primary/40 transition-colors group"
            onClick={() => openStore(store)} data-testid={`store-card-${store.cr_tienda}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{store.tienda}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">CR: {store.cr_tienda} &middot; {store.plaza}</p>
                </div>
                <Badge variant="outline"
                  className={`shrink-0 text-[10px] ${
                    store.audit_status === "in_progress"
                      ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
                      : store.audit_status === "pending_photos"
                        ? "bg-amber-500/15 text-amber-700 border-amber-500/40"
                        : store.audited
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                          : ""
                  }`}>
                  {store.audit_status === "in_progress"
                    ? "En Progreso"
                    : store.audit_status === "pending_photos"
                      ? "⏳ Pend. Fotos"
                      : store.audited
                        ? t("dashboard.audited")
                        : t("dashboard.notAudited")}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Monitor className="h-3.5 w-3.5" /><span className="font-mono">{store.total_equipment}</span><span>{t("dashboard.equipmentCount")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>{t("common.noResults")}</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="prev-page-btn"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground font-mono">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="next-page-btn"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      {/* Store Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col" data-testid="store-detail-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase tracking-tight">{selectedStore?.tienda}</DialogTitle>
          </DialogHeader>
          <Tabs value={dialogTab} onValueChange={setDialogTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" data-testid="store-tab-info">{t("dashboard.storeDetails")}</TabsTrigger>
              <TabsTrigger value="equipment" onClick={handleViewEquipment} data-testid="store-tab-equipment">{t("audit.equipment")}</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4">
              {selectedStore && (
                <div className="space-y-2">
                  {[
                    [t("common.cr"), selectedStore.cr_tienda],
                    [t("common.plaza"), selectedStore.plaza],
                    [t("audit.equipment"), selectedStore.total_equipment],
                    [t("audit.status"), null],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      {val !== null ? <span className="font-mono font-medium">{val}</span> : (
                        <Badge variant="outline" className={
                          selectedStore.audit_status === "pending_photos"
                            ? "bg-amber-500/15 text-amber-700 border-amber-500/40"
                            : selectedStore.audit_status === "in_progress"
                              ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
                              : selectedStore.audited
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                : ""
                        }>
                          {selectedStore.audit_status === "pending_photos"
                            ? "⏳ Pendiente Fotos"
                            : selectedStore.audit_status === "in_progress"
                              ? "En Progreso"
                              : selectedStore.audited
                                ? t("dashboard.audited")
                                : t("dashboard.notAudited")}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="equipment" className="flex-1 overflow-hidden">
              {eqLoading ? (
                <div className="flex items-center justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <ScrollArea className="h-[320px]">
                    <Table style={{ minWidth: 680 }}>
                      <TableHeader><TableRow>
                        <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="codigo_barras">{t("audit.barcode")}</eqSort.SortHeader></TableHead>
                        <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="descripcion">{t("audit.description")}</eqSort.SortHeader></TableHead>
                        <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="marca">{t("audit.brand")}</eqSort.SortHeader></TableHead>
                        <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="modelo">{t("audit.model")}</eqSort.SortHeader></TableHead>
                        <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="serie">Serie</eqSort.SortHeader></TableHead>
                        <TableHead className="text-right whitespace-nowrap"><eqSort.SortHeader col="valor_real">{t("audit.realValue")}</eqSort.SortHeader></TableHead>
                        <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="depreciado">{t("audit.deprecated")}</eqSort.SortHeader></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {eqSort.sorted(storeEquipment).map(eq => (
                          <TableRow key={eq.id}>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{eq.codigo_barras}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap max-w-[140px] truncate">{eq.descripcion}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{eq.marca}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{eq.modelo}</TableCell>
                            <TableCell className="text-xs font-mono whitespace-nowrap">{eq.serie || "—"}</TableCell>
                            <TableCell className="text-right font-mono text-sm whitespace-nowrap">{fmtMoney(eq.valor_real)}</TableCell>
                            <TableCell><Badge variant={eq.depreciado ? "destructive" : "outline"} className="text-[10px]">{eq.depreciado ? "Sí" : "No"}</Badge></TableCell>
                          </TableRow>
                        ))}
                        {storeEquipment.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">{t("common.noResults")}</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="store-dialog-close">{t("common.close")}</Button>
            <Button variant="outline" onClick={handleViewEquipment} data-testid="view-equipment-btn" className="gap-2">
              <Eye className="h-4 w-4" /> Ver Equipos
            </Button>
            <Button onClick={handleStartAudit} disabled={auditLoading} data-testid="start-audit-btn" className="gap-2">
              <Play className="h-4 w-4" /> {t("dashboard.startAudit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
