import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Download, ChevronLeft, ChevronRight, ClipboardList, ArrowRightLeft, History,
  DollarSign, ArrowUpDown, Search, Eye, Trash2, StickyNote, CheckCircle,
  AlertTriangle, XCircle, TrendingUp, TrendingDown, RefreshCw, Printer, ImageDown
} from "lucide-react";

function useSortable(defaultKey, defaultDir = "desc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);
  const toggle = (key) => { if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };
  const sorted = (items) => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey.includes(".")) { const [p, c] = sortKey.split("."); av = (a[p] || {})[c]; bv = (b[p] || {})[c]; }
      av = av ?? ""; bv = bv ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  };
  const SortHeader = ({ col, children, className }) => (
    <button onClick={() => toggle(col)} className={`flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap ${className || ""}`}>
      {children} <ArrowUpDown className={`h-3 w-3 ${sortKey === col ? "opacity-80" : "opacity-30"}`} />
    </button>
  );
  return { sorted, SortHeader };
}

const movTypeLabel = (type) => {
  const labels = { alta: "ALTA", baja: "BAJA", disposal: "BAJA", transfer: "TRANSFERENCIA" };
  return labels[type] || type?.toUpperCase() || "—";
};

const movTypeBadge = (type) => {
  if (type === "alta") return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (type === "baja" || type === "disposal") return "bg-red-500/15 text-red-600 border-red-500/30";
  if (type === "transfer") return "bg-blue-500/15 text-blue-600 border-blue-500/30";
  return "";
};

export default function LogsPage() {
  const { api, user } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState("classifications");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [exporting, setExporting] = useState(false);

  const [classData, setClassData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [classFilter, setClassFilter] = useState("all");
  const [classPage, setClassPage] = useState(1);

  const [movData, setMovData] = useState({ items: [], total: 0, page: 1, pages: 1, transfer_total_value: 0, disposal_total_value: 0, alta_total_value: 0 });
  const [movFilter, setMovFilter] = useState("all");
  const [movPage, setMovPage] = useState(1);

  const [auditData, setAuditData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditPage, setAuditPage] = useState(1);

  const [selectedAudit, setSelectedAudit] = useState(null);
  const [auditSummary, setAuditSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFilter, setSummaryFilter] = useState("not_found"); // "located" | "surplus" | "not_found"
  const [deleteDialog, setDeleteDialog] = useState(null);

  const classSort = useSortable("scanned_at");
  const movSort = useSortable("created_at");
  const auditSort = useSortable("started_at");
  const isSuperAdmin = user?.perfil === "Super Administrador";

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClassifications = useCallback(async () => {
    try {
      const params = { page: classPage, limit: 50 };
      if (classFilter !== "all") params.classification = classFilter;
      if (searchDebounced) params.search = searchDebounced;
      const res = await api.get("/logs/classifications", { params });
      setClassData(res.data);
    } catch {}
  }, [api, classPage, classFilter, searchDebounced]);

  const fetchMovements = useCallback(async () => {
    try {
      const params = { page: movPage, limit: 50 };
      if (movFilter !== "all") params.type = movFilter;
      if (searchDebounced) params.search = searchDebounced;
      const res = await api.get("/logs/movements", { params });
      setMovData(res.data);
    } catch {}
  }, [api, movPage, movFilter, searchDebounced]);

  const fetchAudits = useCallback(async () => {
    try {
      const params = { page: auditPage, limit: 50 };
      if (auditFilter !== "all") params.status = auditFilter;
      if (searchDebounced) params.search = searchDebounced;
      const res = await api.get("/logs/audits", { params });
      setAuditData(res.data);
    } catch {}
  }, [api, auditPage, auditFilter, searchDebounced]);

  useEffect(() => { fetchClassifications(); }, [fetchClassifications]);
  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  const doExport = async (exportType, extraParams = {}, filename) => {
    setExporting(true);
    try {
      const res = await api.get(`/export/${exportType}`, { params: extraParams, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `sigaf_${exportType}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Archivo exportado correctamente");
    } catch { toast.error(t("common.error")); }
    finally { setExporting(false); }
  };

  const handleExportClassifications = () => {
    const params = {};
    if (classFilter !== "all") params.classification = classFilter;
    if (searchDebounced) params.search = searchDebounced;
    doExport("classifications", params, `sigaf_clasificaciones_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportMovAB = () => {
    const params = {};
    if (movFilter === "bajas") params.type = "bajas";
    else if (movFilter === "altas") params.type = "altas";
    if (searchDebounced) params.search = searchDebounced;
    doExport("movements-ab", params, `SIGAF_AB_General_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportMovTransfer = () => {
    const params = {};
    if (searchDebounced) params.search = searchDebounced;
    doExport("movements-transferencias", params, `SIGAF_TRANSFERENCIAS_General_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportAudits = () => {
    const params = {};
    if (auditFilter !== "all") params.status = auditFilter;
    if (searchDebounced) params.search = searchDebounced;
    doExport("audits", params, `sigaf_auditorias_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleViewAudit = async (audit) => {
    setSelectedAudit(audit);
    setSummaryFilter("not_found");
    if (audit.status !== "in_progress") {
      setSummaryLoading(true);
      try {
        const [sumRes, auditRes] = await Promise.all([
          api.get(`/audits/${audit.id}/summary`),
          api.get(`/audits/${audit.id}`)
        ]);
        setAuditSummary(sumRes.data);
        // Actualizar selectedAudit con datos completos (incluyendo fotos)
        setSelectedAudit(auditRes.data);
      }
      catch { toast.error(t("common.error")); }
      finally { setSummaryLoading(false); }
    } else { setAuditSummary(null); }
  };

  const handleDeleteAudit = async () => {
    if (!deleteDialog) return;
    try {
      await api.delete(`/audits/${deleteDialog.id}`);
      toast.success("Auditoría eliminada");
      setDeleteDialog(null); setSelectedAudit(null); setAuditSummary(null);
      fetchAudits();
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
  };

  const fmtMoney = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
  const fmtDate = (d) => d ? new Date(d).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—";

  // Descargar imagen de formato
  const handleDownloadPhoto = (base64Data, filename) => {
    const a = document.createElement("a");
    a.href = `data:image/jpeg;base64,${base64Data}`;
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  };

  // Generar PDF ejecutivo de auditoría (una página, usa ventana de impresión)
  const handlePrintReport = () => {
    if (!selectedAudit) return;
    const a = selectedAudit;
    const s = auditSummary?.stats || {};
    const fmtD = (d) => d ? new Date(d).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—";
    const fmtM = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

    const photoAB = a.photo_ab ? `<div style="margin-top:12px"><p style="font-size:10px;font-weight:600;color:#555;margin-bottom:4px">FORMATO ALTAS / BAJAS</p><img src="data:image/jpeg;base64,${a.photo_ab}" style="max-width:100%;max-height:200px;border:1px solid #ddd;border-radius:4px"/></div>` : "";
    const photoT = a.photo_transf ? `<div style="margin-top:12px"><p style="font-size:10px;font-weight:600;color:#555;margin-bottom:4px">FORMATO TRANSFERENCIAS</p><img src="data:image/jpeg;base64,${a.photo_transf}" style="max-width:100%;max-height:200px;border:1px solid #ddd;border-radius:4px"/></div>` : "";
    const notFound = (auditSummary?.not_found || []).slice(0, 20).map(sc => {
      const eq = sc.equipment_data || {};
      return `<tr><td style="border:1px solid #ddd;padding:3px 6px;font-size:9px;font-family:monospace">${sc.codigo_barras}</td><td style="border:1px solid #ddd;padding:3px 6px;font-size:9px">${eq.descripcion||"—"}</td><td style="border:1px solid #ddd;padding:3px 6px;font-size:9px">${eq.marca||"—"} ${eq.modelo||""}</td><td style="border:1px solid #ddd;padding:3px 6px;font-size:9px;text-align:right">${fmtM(eq.valor_real)}</td><td style="border:1px solid #ddd;padding:3px 6px;font-size:9px;text-align:center">${eq.depreciado?"Sí":"No"}</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte Auditoría — ${a.tienda}</title>
    <style>
      body{font-family:Calibri,Arial,sans-serif;margin:0;padding:16px;color:#222;font-size:11px}
      h1{font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px}
      .header{background:#1E3C78;color:#fff;padding:12px 16px;border-radius:6px;margin-bottom:12px}
      .header p{margin:2px 0;font-size:11px;opacity:.9}
      .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600}
      .grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:12px}
      .stat{border:1px solid #ddd;border-radius:6px;padding:8px;text-align:center}
      .stat .num{font-size:20px;font-weight:700;font-family:monospace}
      .stat .lbl{font-size:9px;color:#666;text-transform:uppercase;margin-top:2px}
      .stat.green .num{color:#16a34a} .stat.amber .num{color:#d97706} .stat.red .num{color:#dc2626}
      .row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0}
      .photos{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      th{background:#1E3C78;color:#fff;padding:4px 6px;font-size:9px;text-align:left;border:1px solid #1E3C78}
      @media print{body{padding:8px}@page{size:A4;margin:10mm}}
    </style></head><body>
    <div class="header">
      <h1>${a.tienda}</h1>
      <p>CR: ${a.cr_tienda} · Plaza: ${a.plaza} · Auditor: ${a.auditor_name}</p>
      <p>Inicio: ${fmtD(a.started_at)}${a.finished_at ? "  ·  Fin: " + fmtD(a.finished_at) : ""}</p>
    </div>
    <div class="grid">
      <div class="stat"><div class="num">${a.total_equipment||0}</div><div class="lbl">Total Equipos</div></div>
      <div class="stat green"><div class="num">${s.located_count||0}</div><div class="lbl">Localizados</div></div>
      <div class="stat amber"><div class="num">${s.surplus_count||0}</div><div class="lbl">Sobrantes</div></div>
      <div class="stat red"><div class="num">${s.not_found_count||0}</div><div class="lbl">No Localizados</div></div>
    </div>
    <div style="border:1px solid #eee;border-radius:6px;padding:10px;margin-bottom:12px">
      <div class="row"><span style="color:#555">Valor Equipos No Localizados</span><span style="font-weight:700;color:#dc2626;font-family:monospace">${fmtM(s.not_found_value)}</span></div>
      <div class="row"><span style="color:#555">Movimientos Generados</span><span style="font-weight:700;font-family:monospace">${s.movements_count||0}</span></div>
      ${a.notes ? `<div style="margin-top:6px;padding:6px;background:#f9f9f9;border-radius:4px;font-size:10px;color:#555"><strong>Notas:</strong> ${a.notes}</div>` : ""}
    </div>
    ${(auditSummary?.not_found||[]).length > 0 ? `
    <p style="font-weight:700;font-size:11px;margin:0 0 4px;text-transform:uppercase">Equipos No Localizados (${Math.min(20,(auditSummary?.not_found||[]).length)}${(auditSummary?.not_found||[]).length>20?" de "+(auditSummary?.not_found||[]).length:""})</p>
    <table><thead><tr><th>Código Barras</th><th>Descripción</th><th>Marca / Modelo</th><th style="text-align:right">Valor</th><th style="text-align:center">Depr.</th></tr></thead><tbody>${notFound}</tbody></table>` : ""}
    ${(a.photo_ab || a.photo_transf) ? `<div style="margin-top:14px"><p style="font-weight:700;font-size:11px;text-transform:uppercase;margin-bottom:6px">Formatos de Movimiento</p><div class="photos">${photoAB}${photoT}</div></div>` : ""}
    <p style="margin-top:16px;font-size:8px;color:#999;text-align:right">Generado por SIGAF · ${new Date().toLocaleString("es-MX")}</p>
    <script>window.onload=()=>{window.print();}</script></body></html>`;

    const w = window.open("", "_blank", "width=800,height=900");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const classLabels = { localizado: t("audit.located"), sobrante: t("audit.surplus"), sobrante_desconocido: t("audit.surplusUnknown"), no_localizado: t("audit.notFound") };
  const classColors = {
    localizado: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    sobrante: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    sobrante_desconocido: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    no_localizado: "bg-red-500/15 text-red-600 border-red-500/30"
  };

  const Pagination = ({ page, pages, setPage, testId }) => pages > 1 && (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid={`${testId}-prev`}><ChevronLeft className="h-4 w-4" /></Button>
      <span className="text-sm text-muted-foreground font-mono">{page} / {pages}</span>
      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} data-testid={`${testId}-next`}><ChevronRight className="h-4 w-4" /></Button>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="logs-page">
      <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight">{t("logs.title")}</h1>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => { setSearch(e.target.value); setClassPage(1); setMovPage(1); setAuditPage(1); }}
          placeholder="Buscar por CR o nombre de tienda..." className="pl-10 h-10" data-testid="logs-search" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3" data-testid="logs-tabs">
          <TabsTrigger value="classifications" data-testid="tab-classifications" className="gap-1.5">
            <ClipboardList className="h-4 w-4 hidden sm:block" /><span className="truncate">{t("logs.classifications")}</span>
          </TabsTrigger>
          <TabsTrigger value="movements" data-testid="tab-movements" className="gap-1.5">
            <ArrowRightLeft className="h-4 w-4 hidden sm:block" /><span className="truncate">{t("logs.movements")}</span>
          </TabsTrigger>
          <TabsTrigger value="audits" data-testid="tab-audits" className="gap-1.5">
            <History className="h-4 w-4 hidden sm:block" /><span className="truncate">{t("logs.auditHistory")}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Classifications Tab ── */}
        <TabsContent value="classifications" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Select value={classFilter} onValueChange={v => { setClassFilter(v); setClassPage(1); }}>
              <SelectTrigger className="w-48" data-testid="class-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("logs.all")}</SelectItem>
                <SelectItem value="localizado">{t("audit.located")}</SelectItem>
                <SelectItem value="sobrante">{t("audit.surplus")}</SelectItem>
                <SelectItem value="sobrante_desconocido">{t("audit.surplusUnknown")}</SelectItem>
                <SelectItem value="no_localizado">{t("audit.notFound")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportClassifications} disabled={exporting} data-testid="export-classifications" className="gap-2">
              {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t("logs.exportExcel")}
            </Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <ScrollArea className="h-[500px]">
                <Table style={{ minWidth: "700px" }}>
                  <TableHeader><TableRow>
                    <TableHead><classSort.SortHeader col="scanned_at">{t("logs.date")}</classSort.SortHeader></TableHead>
                    <TableHead><classSort.SortHeader col="codigo_barras">{t("audit.barcode")}</classSort.SortHeader></TableHead>
                    <TableHead><classSort.SortHeader col="classification">{t("audit.classification")}</classSort.SortHeader></TableHead>
                    <TableHead><classSort.SortHeader col="equipment_data.descripcion">{t("audit.description")}</classSort.SortHeader></TableHead>
                    <TableHead><classSort.SortHeader col="equipment_data.marca">{t("audit.brand")}</classSort.SortHeader></TableHead>
                    <TableHead className="text-right"><classSort.SortHeader col="equipment_data.valor_real">{t("audit.realValue")}</classSort.SortHeader></TableHead>
                    <TableHead>{t("logs.store")}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {classSort.sorted(classData.items).map(item => {
                      const eq = item.equipment_data || {};
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(item.scanned_at)}</TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{item.codigo_barras}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${classColors[item.classification] || ""}`}>{classLabels[item.classification] || item.classification}</Badge></TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{eq.descripcion || "—"}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{eq.marca || "—"}</TableCell>
                          <TableCell className="text-right font-mono text-sm whitespace-nowrap">{fmtMoney(eq.valor_real)}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{eq.tienda || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {classData.items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("common.noResults")}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </Card>
          <Pagination page={classPage} pages={classData.pages} setPage={setClassPage} testId="class" />
        </TabsContent>

        {/* ── Movements Tab ── */}
        <TabsContent value="movements" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card><CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
              <div><p className="text-xs text-muted-foreground uppercase">Valor Altas</p><p className="font-mono font-bold text-sm">{fmtMoney(movData.alta_total_value)}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-red-500 shrink-0" />
              <div><p className="text-xs text-muted-foreground uppercase">Valor Bajas</p><p className="font-mono font-bold text-sm">{fmtMoney(movData.disposal_total_value)}</p></div>
            </CardContent></Card>
            <Card className="col-span-2 md:col-span-1"><CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-blue-500 shrink-0" />
              <div><p className="text-xs text-muted-foreground uppercase">Valor Transferencias</p><p className="font-mono font-bold text-sm">{fmtMoney(movData.transfer_total_value)}</p></div>
            </CardContent></Card>
          </div>

          {/* Filter + Export Buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Select value={movFilter} onValueChange={v => { setMovFilter(v); setMovPage(1); }}>
              <SelectTrigger className="w-52" data-testid="mov-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("logs.all")}</SelectItem>
                <SelectItem value="bajas">No Localizado (BAJA)</SelectItem>
                <SelectItem value="altas">Sobrante (ALTA)</SelectItem>
                <SelectItem value="transferencias">Transferencias</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportMovAB} disabled={exporting} data-testid="export-movements-ab" className="gap-2">
                {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exportar ALTAS / BAJAS
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportMovTransfer} disabled={exporting} data-testid="export-movements-transfer" className="gap-2">
                {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exportar Transferencias
              </Button>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <ScrollArea className="h-[500px]">
                <Table style={{ minWidth: "800px" }}>
                  <TableHeader><TableRow>
                    <TableHead><movSort.SortHeader col="created_at">{t("logs.date")}</movSort.SortHeader></TableHead>
                    <TableHead><movSort.SortHeader col="type">{t("logs.type")}</movSort.SortHeader></TableHead>
                    <TableHead><movSort.SortHeader col="equipment_data.codigo_barras">{t("audit.barcode")}</movSort.SortHeader></TableHead>
                    <TableHead><movSort.SortHeader col="equipment_data.descripcion">{t("audit.description")}</movSort.SortHeader></TableHead>
                    <TableHead><movSort.SortHeader col="equipment_data.modelo">Modelo</movSort.SortHeader></TableHead>
                    <TableHead className="text-right"><movSort.SortHeader col="equipment_data.valor_real">{t("audit.realValue")}</movSort.SortHeader></TableHead>
                    <TableHead>{t("logs.fromStore")}</TableHead>
                    <TableHead>{t("logs.toStore")}</TableHead>
                    <TableHead>{t("logs.createdBy")}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {movSort.sorted(movData.items).map(item => {
                      const eq = item.equipment_data || {};
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(item.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${movTypeBadge(item.type)}`}>{movTypeLabel(item.type)}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{eq.codigo_barras || "—"}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap max-w-[180px] truncate">{eq.descripcion || "—"}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{eq.modelo || "—"}</TableCell>
                          <TableCell className="text-right font-mono text-sm whitespace-nowrap">{fmtMoney(eq.valor_real)}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{item.from_tienda || "—"}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{item.to_tienda || "—"}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{item.created_by}</TableCell>
                        </TableRow>
                      );
                    })}
                    {movData.items.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t("common.noResults")}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </Card>
          <Pagination page={movPage} pages={movData.pages} setPage={setMovPage} testId="mov" />
        </TabsContent>

        {/* ── Audits Tab ── */}
        <TabsContent value="audits" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Select value={auditFilter} onValueChange={v => { setAuditFilter(v); setAuditPage(1); }}>
              <SelectTrigger className="w-48" data-testid="audit-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("logs.all")}</SelectItem>
                <SelectItem value="in_progress">{t("dashboard.inProgress")}</SelectItem>
                <SelectItem value="completed">{t("logs.completed")}</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportAudits} disabled={exporting} data-testid="export-audits" className="gap-2">
              {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t("logs.exportExcel")}
            </Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <ScrollArea className="h-[500px]">
                <Table style={{ minWidth: "900px" }}>
                  <TableHeader><TableRow>
                    <TableHead><auditSort.SortHeader col="started_at">{t("logs.startDate")}</auditSort.SortHeader></TableHead>
                    <TableHead><auditSort.SortHeader col="finished_at">{t("logs.endDate")}</auditSort.SortHeader></TableHead>
                    <TableHead><auditSort.SortHeader col="cr_tienda">{t("common.cr")}</auditSort.SortHeader></TableHead>
                    <TableHead><auditSort.SortHeader col="tienda">{t("logs.store")}</auditSort.SortHeader></TableHead>
                    <TableHead><auditSort.SortHeader col="plaza">{t("common.plaza")}</auditSort.SortHeader></TableHead>
                    <TableHead><auditSort.SortHeader col="auditor_name">{t("logs.auditor")}</auditSort.SortHeader></TableHead>
                    <TableHead>{t("audit.status")}</TableHead>
                    <TableHead className="text-right">{t("logs.locatedCount")}</TableHead>
                    <TableHead className="text-right">{t("logs.notFoundCount")}</TableHead>
                    <TableHead className="text-center">{t("common.actions")}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {auditSort.sorted(auditData.items).map(item => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewAudit(item)} data-testid={`audit-row-${item.id}`}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(item.started_at)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(item.finished_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{item.cr_tienda}</TableCell>
                        <TableCell className="text-sm font-medium whitespace-nowrap">{item.tienda}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{item.plaza}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{item.auditor_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${
                            item.status === "completed" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
                            item.status === "cancelada" ? "bg-gray-500/10 text-gray-500 border-gray-400/30" :
                            "bg-blue-500/15 text-blue-600 border-blue-500/30"}`}>
                            {item.status === "completed" ? t("logs.completed") :
                              item.status === "cancelada" ? "Cancelada" : t("dashboard.inProgress")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{item.located_count}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-red-500">{item.not_found_count}</TableCell>
                        <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewAudit(item)} data-testid={`view-audit-${item.id}`}><Eye className="h-3.5 w-3.5" /></Button>
                            {isSuperAdmin && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setDeleteDialog(item)} data-testid={`delete-audit-${item.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {auditData.items.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{t("common.noResults")}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </Card>
          <Pagination page={auditPage} pages={auditData.pages} setPage={setAuditPage} testId="audit" />
        </TabsContent>
      </Tabs>

      {/* ── Audit Summary Dialog ── */}
      <Dialog open={!!selectedAudit} onOpenChange={(open) => { if (!open) { setSelectedAudit(null); setAuditSummary(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="audit-summary-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-tight">{selectedAudit?.tienda}</DialogTitle>
            <DialogDescription>CR: {selectedAudit?.cr_tienda} &middot; {selectedAudit?.plaza} &middot; Auditor: {selectedAudit?.auditor_name}</DialogDescription>
          </DialogHeader>
          {summaryLoading && <div className="flex items-center justify-center py-10"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}
          {selectedAudit && !summaryLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className={`text-xs ${
                  selectedAudit.status === "completed" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
                  selectedAudit.status === "cancelada" ? "bg-gray-500/10 text-gray-500 border-gray-400/30" :
                  "bg-blue-500/15 text-blue-600 border-blue-500/30"}`}>
                  {selectedAudit.status === "completed" ? t("logs.completed") : selectedAudit.status === "cancelada" ? "CANCELADA" : t("dashboard.inProgress")}
                </Badge>
                <span className="text-xs text-muted-foreground">Inicio: {fmtDate(selectedAudit.started_at)}</span>
                {selectedAudit.finished_at && <span className="text-xs text-muted-foreground">Fin: {fmtDate(selectedAudit.finished_at)}</span>}
              </div>

              {/* Cancellation notice */}
              {selectedAudit.status === "cancelada" && selectedAudit.cancel_reason && (
                <Card className="border-gray-300 bg-gray-50 dark:bg-gray-800/30">
                  <CardContent className="p-3 space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo de Cancelación</p>
                    <p className="text-sm text-muted-foreground">{selectedAudit.cancel_reason}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground uppercase">{t("audit.equipment")}</p><p className="font-mono text-xl font-bold">{selectedAudit.total_equipment || 0}</p></CardContent></Card>
                <Card
                  className={`cursor-pointer transition-all ${summaryFilter === "located" ? "ring-2 ring-emerald-500 bg-emerald-500/5" : "hover:ring-1 hover:ring-emerald-400"}`}
                  onClick={() => auditSummary && setSummaryFilter("located")}
                ><CardContent className="p-3 text-center"><CheckCircle className="h-4 w-4 text-emerald-500 mx-auto mb-0.5" /><p className="font-mono text-xl font-bold text-emerald-500">{auditSummary?.stats?.located_count ?? selectedAudit.located_count ?? 0}</p><p className="text-xs text-muted-foreground uppercase">{t("audit.located")}</p></CardContent></Card>
                <Card
                  className={`cursor-pointer transition-all ${summaryFilter === "surplus" ? "ring-2 ring-amber-500 bg-amber-500/5" : "hover:ring-1 hover:ring-amber-400"}`}
                  onClick={() => auditSummary && setSummaryFilter("surplus")}
                ><CardContent className="p-3 text-center"><AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mb-0.5" /><p className="font-mono text-xl font-bold text-amber-500">{auditSummary?.stats?.surplus_count ?? selectedAudit.surplus_count ?? 0}</p><p className="text-xs text-muted-foreground uppercase">{t("audit.surplus")}</p></CardContent></Card>
                <Card
                  className={`cursor-pointer transition-all ${summaryFilter === "not_found" ? "ring-2 ring-red-500 bg-red-500/5" : "hover:ring-1 hover:ring-red-400"}`}
                  onClick={() => auditSummary && setSummaryFilter("not_found")}
                ><CardContent className="p-3 text-center"><XCircle className="h-4 w-4 text-red-500 mx-auto mb-0.5" /><p className="font-mono text-xl font-bold text-red-500">{auditSummary?.stats?.not_found_count ?? selectedAudit.not_found_count ?? 0}</p><p className="text-xs text-muted-foreground uppercase">{t("audit.notFound")}</p></CardContent></Card>
              </div>

              {selectedAudit.status !== "in_progress" && selectedAudit.status !== "cancelada" && (
                <Card><CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("audit.notFoundValue")}</span><span className="font-mono font-bold text-red-500">{fmtMoney(auditSummary?.stats?.not_found_value ?? selectedAudit.not_found_value)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("audit.movementsPending")}</span><span className="font-mono font-bold">{auditSummary?.stats?.movements_count ?? 0}</span></div>
                  {selectedAudit.status === "completed" && <div className="mt-2 p-2 bg-amber-500/10 rounded text-sm text-amber-600 font-medium">Estado: INCOMPLETO (&gt;20% equipos no localizados)</div>}
                </CardContent></Card>
              )}

              {selectedAudit.notes && (
                <Card><CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2"><StickyNote className="h-4 w-4 text-primary" /><p className="text-sm font-medium">Notas de Auditoría</p></div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="audit-notes-content">{selectedAudit.notes}</p>
                </CardContent></Card>
              )}

              {auditSummary && summaryFilter && (
                <Card><CardContent className="p-4 space-y-2">
                  {(() => {
                    const items = summaryFilter === "located" ? (auditSummary.located || [])
                      : summaryFilter === "surplus" ? (auditSummary.surplus || [])
                      : (auditSummary.not_found || []);
                    const label = summaryFilter === "located" ? t("audit.located")
                      : summaryFilter === "surplus" ? t("audit.surplus")
                      : t("audit.notFound");
                    return (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">{label} ({items.length})</p>
                        {items.length > 0 ? (
                          <div className="overflow-x-auto rounded border">
                            <ScrollArea className="h-[220px]">
                              <Table style={{ minWidth: 560 }}>
                                <TableHeader><TableRow>
                                  <TableHead className="whitespace-nowrap">{t("audit.barcode")}</TableHead>
                                  <TableHead className="whitespace-nowrap">{t("audit.description")}</TableHead>
                                  <TableHead className="whitespace-nowrap">{t("audit.brand")}</TableHead>
                                  <TableHead className="whitespace-nowrap">Modelo</TableHead>
                                  <TableHead className="whitespace-nowrap">Serie</TableHead>
                                  <TableHead className="text-right whitespace-nowrap">{t("audit.realValue")}</TableHead>
                                  <TableHead className="whitespace-nowrap">{t("audit.deprecated")}</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                  {items.slice(0, 100).map(scan => {
                                    const eq = scan.equipment_data || {};
                                    return (
                                      <TableRow key={scan.id}>
                                        <TableCell className="font-mono text-xs whitespace-nowrap">{scan.codigo_barras}</TableCell>
                                        <TableCell className="text-sm whitespace-nowrap max-w-[140px] truncate">{eq.descripcion || "—"}</TableCell>
                                        <TableCell className="text-sm whitespace-nowrap">{eq.marca || "—"}</TableCell>
                                        <TableCell className="text-sm whitespace-nowrap">{eq.modelo || "—"}</TableCell>
                                        <TableCell className="text-xs font-mono whitespace-nowrap">{eq.serie || "—"}</TableCell>
                                        <TableCell className="text-right font-mono text-sm whitespace-nowrap">{fmtMoney(eq.valor_real)}</TableCell>
                                        <TableCell><Badge variant={eq.depreciado ? "destructive" : "outline"} className="text-[10px]">{eq.depreciado ? "Sí" : "No"}</Badge></TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </div>
                        ) : (
                          <p className="text-sm text-center text-muted-foreground py-4">{t("common.noResults")}</p>
                        )}
                      </div>
                    );
                  })()}
                </CardContent></Card>
              )}

              {/* Fotos de formatos (solo auditorías completadas) */}
              {selectedAudit?.status === "completed" && (selectedAudit?.photo_ab || selectedAudit?.photo_transf) && (
                <Card><CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Formatos de Movimiento</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedAudit?.photo_ab && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Formato ALTAS / BAJAS</p>
                        <img src={`data:image/jpeg;base64,${selectedAudit.photo_ab}`} alt="Formato AB" className="w-full rounded border object-contain max-h-48"/>
                      </div>
                    )}
                    {selectedAudit?.photo_transf && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Formato TRANSFERENCIAS</p>
                        <img src={`data:image/jpeg;base64,${selectedAudit.photo_transf}`} alt="Formato Transferencias" className="w-full rounded border object-contain max-h-48"/>
                      </div>
                    )}
                  </div>
                </CardContent></Card>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
            {isSuperAdmin && selectedAudit && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteDialog(selectedAudit)} data-testid="dialog-delete-audit" className="gap-2 mr-auto">
                <Trash2 className="h-4 w-4" /> Eliminar Auditoría
              </Button>
            )}
            <div className="flex gap-2 flex-wrap justify-end">
              {selectedAudit?.photo_ab && (
                <Button variant="outline" size="sm" onClick={() => handleDownloadPhoto(selectedAudit.photo_ab, `formato_AB_${selectedAudit.cr_tienda}.jpg`)} className="gap-1.5">
                  <ImageDown className="h-4 w-4" /> AB
                </Button>
              )}
              {selectedAudit?.photo_transf && (
                <Button variant="outline" size="sm" onClick={() => handleDownloadPhoto(selectedAudit.photo_transf, `formato_TRANSF_${selectedAudit.cr_tienda}.jpg`)} className="gap-1.5">
                  <ImageDown className="h-4 w-4" /> Transf.
                </Button>
              )}
              {selectedAudit?.status === "completed" && auditSummary && (
                <Button variant="outline" size="sm" onClick={handlePrintReport} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Reporte PDF
                </Button>
              )}
              <Button variant="outline" onClick={() => { setSelectedAudit(null); setAuditSummary(null); }}>{t("common.close")}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Audit Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent data-testid="delete-audit-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-tight text-red-500">Eliminar Auditoría</DialogTitle>
            <DialogDescription>Esta acción eliminará permanentemente la auditoría, sus escaneos y movimientos.</DialogDescription>
          </DialogHeader>
          {deleteDialog && (
            <div className="bg-muted rounded-lg p-4 space-y-1.5">
              <p className="text-sm font-medium">{deleteDialog.tienda}</p>
              <p className="text-xs text-muted-foreground">CR: {deleteDialog.cr_tienda} &middot; {deleteDialog.plaza}</p>
              <p className="text-xs text-muted-foreground">Auditor: {deleteDialog.auditor_name}</p>
              <p className="text-xs text-muted-foreground">Fecha: {fmtDate(deleteDialog.started_at)}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)} data-testid="delete-audit-cancel">{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleDeleteAudit} data-testid="delete-audit-confirm" className="gap-2">
              <Trash2 className="h-4 w-4" /> Confirmar Eliminación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
