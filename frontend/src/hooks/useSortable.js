import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

/**
 * Hook compartido para ordenamiento de tablas.
 * Elimina la duplicacion en DashboardPage, AuditPage, LogsPage, AdminPage, ReportsPage.
 */
export function useSortable(defaultKey, defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const toggle = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = (items, key = sortKey, dir = sortDir) => {
    if (!key) return items;
    return [...items].sort((a, b) => {
      let av = a[key], bv = b[key];
      // Support dot notation: "equipment_data.descripcion"
      if (key.includes(".")) {
        const [p, c] = key.split(".");
        av = (a[p] || {})[c];
        bv = (b[p] || {})[c];
      }
      av = av ?? ""; bv = bv ?? "";
      if (typeof av === "number" && typeof bv === "number")
        return dir === "asc" ? av - bv : bv - av;
      return dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  };

  const SortHeader = ({ col, children, className }) => (
    <button
      onClick={() => toggle(col)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap ${className || ""}`}
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortKey === col ? "opacity-80" : "opacity-30"}`} />
    </button>
  );

  return { sortKey, sortDir, toggle, sorted, SortHeader };
}
