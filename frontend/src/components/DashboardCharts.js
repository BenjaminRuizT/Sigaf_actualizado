import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(354, 70%, 50%)",
  "hsl(44, 90%, 50%)",
  "hsl(160, 55%, 42%)",
  "hsl(280, 55%, 50%)"
];

export function PlazaBarChart({ data }) {
  const { t } = useLanguage();
  if (!data || Object.keys(data).length === 0) return null;
  const chartData = Object.entries(data).map(([name, value], i) => ({
    name: name.length > 12 ? name.slice(0, 12) + "…" : name,
    fullName: name,
    value,
    fill: COLORS[i % COLORS.length]
  }));

  return (
    <Card data-testid="plaza-bar-chart">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base uppercase tracking-tight">{t("dashboard.equipmentByPlaza")}</CardTitle>
      </CardHeader>
      <CardContent className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
              formatter={(value, name, props) => [new Intl.NumberFormat("es-MX").format(value), props.payload.fullName]}
              labelFormatter={() => ""}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DepreciationPieChart({ active, deprecated }) {
  const { t } = useLanguage();
  if (!active && !deprecated) return null;
  const data = [
    { name: t("dashboard.activeEquipment"), value: active || 0 },
    { name: t("dashboard.deprecatedEquipment"), value: deprecated || 0 },
  ];
  const colors = ["hsl(160, 55%, 42%)", "hsl(38, 92%, 50%)"];

  return (
    <Card data-testid="depreciation-pie-chart">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base uppercase tracking-tight">Activos vs Depreciados</CardTitle>
      </CardHeader>
      <CardContent className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
              {data.map((entry, i) => <Cell key={i} fill={colors[i]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
              formatter={(value) => new Intl.NumberFormat("es-MX").format(value)}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function AuditStatusChart({ completed, inProgress, unaudited }) {
  const { t } = useLanguage();
  const data = [
    { name: t("dashboard.auditedStores"), value: completed || 0 },
    { name: t("dashboard.inProgress"), value: inProgress || 0 },
    { name: t("dashboard.unauditedStores"), value: unaudited || 0 },
  ].filter(d => d.value > 0);
  if (data.length === 0) return null;
  const colors = ["hsl(160, 55%, 42%)", "hsl(220, 70%, 50%)", "hsl(var(--muted-foreground))"];

  return (
    <Card data-testid="audit-status-chart">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base uppercase tracking-tight">{t("dashboard.storesOverview")}</CardTitle>
      </CardHeader>
      <CardContent className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
              formatter={(value) => new Intl.NumberFormat("es-MX").format(value)}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
