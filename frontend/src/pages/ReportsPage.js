import { useState, useEffect, useCallback } from "react";
import { useSortable } from "@/hooks/useSortable";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import {TrendingDown, DollarSign, Store, AlertTriangle} from "lucide-react";

const COLORS = ["hsl(220, 70%, 50%)", "hsl(354, 70%, 50%)", "hsl(44, 90%, 50%)", "hsl(160, 55%, 42%)", "hsl(280, 55%, 50%)"];


export default function ReportsPage() {
  const { api } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const storeSort = useSortable("not_found_count");

  const fetchData = useCallback(async () => {
    try { const res = await api.get("/reports/summary"); setData(res.data); } catch {}
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtMoney = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
  const fmt = (n) => new Intl.NumberFormat("es-MX").format(n || 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  const plazaCostData = (data.plaza_equipment || []).map((p, i) => ({
    name: p.plaza, equipos: p.count, valor: Math.round(p.total_real), depreciados: p.deprecated, fill: COLORS[i % COLORS.length]
  }));

  const yearData = (data.equipment_by_year || []).map(y => ({
    year: String(y.year), count: y.count, cost: Math.round(y.cost)
  }));

  const movSummary = data.movement_summary || {};

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">Análisis comparativo de auditorías, depreciación y faltantes</p>
      </div>

      {/* Movement KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="kpi-card"><CardContent className="p-4"><div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-blue-500" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transferencias</p><p className="font-mono text-lg font-bold">{fmt(movSummary.transfer?.count || 0)}</p><p className="text-xs text-muted-foreground">{fmtMoney(movSummary.transfer?.value || 0)}</p></div></div></CardContent></Card>
        <Card className="kpi-card"><CardContent className="p-4"><div className="flex items-center gap-3"><TrendingDown className="h-5 w-5 text-red-500" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bajas</p><p className="font-mono text-lg font-bold">{fmt(movSummary.disposal?.count || 0)}</p><p className="text-xs text-muted-foreground">{fmtMoney(movSummary.disposal?.value || 0)}</p></div></div></CardContent></Card>
        <Card className="kpi-card"><CardContent className="p-4"><div className="flex items-center gap-3"><Store className="h-5 w-5 text-amber-500" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tiendas con faltante</p><p className="font-mono text-lg font-bold">{fmt(data.top_missing_stores?.length || 0)}</p></div></div></CardContent></Card>
        <Card className="kpi-card"><CardContent className="p-4"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total faltantes</p><p className="font-mono text-lg font-bold">{fmt(data.top_missing_stores?.reduce((s, x) => s + (x.not_found_count || 0), 0) || 0)}</p></div></div></CardContent></Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Value by Plaza */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-heading text-base uppercase tracking-tight">Valor Real por Plaza</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plazaCostData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => v >= 1e6 ? `$${(v/1e6).toFixed(0)}M` : `$${(v/1e3).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px", color: "hsl(var(--foreground))" }} formatter={(v) => fmtMoney(v)} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={45} name="Valor Real">
                  {plazaCostData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Depreciation by Plaza */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-heading text-base uppercase tracking-tight">Depreciación por Plaza</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plazaCostData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="equipos" name="Total" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="depreciados" name="Depreciados" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Legend wrapperStyle={{ fontSize: "11px" }} formatter={(v) => <span style={{ color: "hsl(var(--foreground))" }}>{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Acquisition Timeline */}
      {yearData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-heading text-base uppercase tracking-tight">Tendencia de Adquisición por Año</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px", color: "hsl(var(--foreground))" }} formatter={(v, name) => [name === "count" ? fmt(v) : fmtMoney(v), name === "count" ? "Equipos" : "Costo"]} />
                <Line type="monotone" dataKey="count" stroke="hsl(220, 70%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="count" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Missing Stores Ranking */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="font-heading text-base uppercase tracking-tight">Ranking: Tiendas con Mayor Faltante</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead>
                <TableHead><storeSort.SortHeader col="tienda">Tienda</storeSort.SortHeader></TableHead>
                <TableHead><storeSort.SortHeader col="plaza">{t("common.plaza")}</storeSort.SortHeader></TableHead>
                <TableHead className="text-right"><storeSort.SortHeader col="total_equipment">Total Equipos</storeSort.SortHeader></TableHead>
                <TableHead className="text-right"><storeSort.SortHeader col="not_found_count">No Localizados</storeSort.SortHeader></TableHead>
                <TableHead className="text-right"><storeSort.SortHeader col="not_found_value">Valor Faltante</storeSort.SortHeader></TableHead>
                <TableHead className="text-right">% Faltante</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {storeSort.sorted(data.top_missing_stores || []).map((store, i) => {
                  const pct = store.total_equipment > 0 ? ((store.not_found_count / store.total_equipment) * 100).toFixed(1) : "0";
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{store.tienda}</TableCell>
                      <TableCell className="text-sm">{store.plaza}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{store.total_equipment}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-500">{store.not_found_count}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-500">{fmtMoney(store.not_found_value)}</TableCell>
                      <TableCell className="text-right"><Badge variant="outline" className={`text-[10px] ${parseFloat(pct) > 20 ? "bg-red-500/15 text-red-600 border-red-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"}`}>{pct}%</Badge></TableCell>
                    </TableRow>
                  );
                })}
                {(data.top_missing_stores || []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("common.noResults")}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Audit Results by Plaza */}
      {(data.plaza_audits || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-heading text-base uppercase tracking-tight">Resultados de Auditorías por Plaza</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Plaza</TableHead><TableHead className="text-right">Completadas</TableHead>
                <TableHead className="text-right">Incompletas</TableHead><TableHead className="text-right">Total No Localizados</TableHead>
                <TableHead className="text-right">Valor No Localizado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.plaza_audits.map((pa, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{pa.plaza}</TableCell>
                    <TableCell className="text-right font-mono">{pa.completed}</TableCell>
                    <TableCell className="text-right font-mono text-amber-500">{pa.incompleto}</TableCell>
                    <TableCell className="text-right font-mono text-red-500">{fmt(pa.total_not_found)}</TableCell>
                    <TableCell className="text-right font-mono text-red-500">{fmtMoney(pa.total_not_found_value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
