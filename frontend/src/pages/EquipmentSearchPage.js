import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Package, X, Barcode, Hash, Tag, MapPin, DollarSign, Calendar, Wrench } from "lucide-react";
import { toast } from "sonner";

const fmtM = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "short" }) : "—";

export default function EquipmentSearchPage() {
  const { api } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = no buscado aún
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  const handleSearch = async (q = query) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) { toast.warning("Ingresa al menos 2 caracteres"); return; }
    setLoading(true);
    setSelected(null);
    try {
      const res = await api.get("/equipment/search", { params: { q: trimmed } });
      setResults(res.data.results || []);
    } catch (err) {
      toast.error("Error al buscar equipo");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const Field = ({ icon: Icon, label, value, mono = false, color }) => value ? (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-sm break-all ${mono ? "font-mono" : "font-medium"} ${color || ""}`}>{value}</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-5" data-testid="equipment-search-page">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" /> Consultar Equipo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Busca por código de barras, no. activo, serie, descripción, marca o tienda</p>
      </div>

      {/* Barra de búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: 03363282 · TC52 · ESCANER · CORDILLERAS..."
                className="pl-9 h-11 text-base font-mono"
                autoFocus
              />
              {query && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => { setQuery(""); setResults(null); setSelected(null); inputRef.current?.focus(); }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button onClick={() => handleSearch()} disabled={loading} className="h-11 px-6 gap-2">
              {loading
                ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Search className="h-4 w-4" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results !== null && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Lista */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              {results.length === 0 ? "Sin resultados" : `${results.length} equipo${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}`}
            </p>
            {results.length === 0 ? (
              <Card><CardContent className="p-8 text-center space-y-2">
                <Package className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No se encontró ningún equipo con esa búsqueda</p>
              </CardContent></Card>
            ) : (
              results.map(eq => (
                <Card key={eq.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selected?.id === eq.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelected(eq)}>
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{eq.descripcion || "Sin descripción"}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{eq.codigo_barras}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{eq.marca || "—"}</Badge>
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{eq.tienda}</span>
                        {eq.depreciado && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-500/30">Depreciado</Badge>}
                      </div>
                    </div>
                    <p className="text-sm font-mono font-bold text-primary shrink-0">{fmtM(eq.valor_real)}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Detalle */}
          <div>
            {selected ? (
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base leading-tight">{selected.descripcion || "Sin descripción"}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{selected.marca} {selected.modelo && `· ${selected.modelo}`}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-mono font-bold text-lg text-primary">{fmtM(selected.valor_real)}</p>
                      {selected.depreciado
                        ? <Badge className="text-[10px] bg-amber-500/15 text-amber-700 border-amber-500/30">Depreciado</Badge>
                        : <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Activo</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Identificación */}
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Identificación</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Field icon={Barcode} label="Código de Barras" value={selected.codigo_barras} mono />
                      <Field icon={Hash} label="No. Activo" value={selected.no_activo} mono />
                      <Field icon={Tag} label="Serie" value={selected.serie} mono />
                    </div>
                  </div>
                  {/* Ubicación */}
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ubicación</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Field icon={MapPin} label="Tienda" value={selected.tienda} />
                      <Field icon={MapPin} label="CR Tienda" value={selected.cr_tienda} mono />
                      <Field icon={MapPin} label="Plaza" value={selected.plaza} />
                    </div>
                  </div>
                  {/* Valor y depreciación */}
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Field icon={DollarSign} label="Costo Original" value={fmtM(selected.costo)} mono color="text-foreground" />
                      <Field icon={DollarSign} label="Valor Real" value={fmtM(selected.valor_real)} mono color="text-primary font-bold" />
                      <Field icon={DollarSign} label="Depreciación" value={fmtM(selected.depreciacion)} mono />
                      <Field icon={Calendar} label="Vida Útil" value={selected.vida_util ? `${selected.vida_util} meses` : null} />
                    </div>
                  </div>
                  {/* Adquisición */}
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Adquisición</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Field icon={Calendar} label="Adquisición" value={selected.mes_adquisicion && selected.anio_adquisicion ? `${selected.mes_adquisicion}/${selected.anio_adquisicion}` : null} />
                      <Field icon={Wrench} label="Meses Transcurridos" value={selected.meses_transcurridos ? `${selected.meses_transcurridos} meses` : null} />
                      <Field icon={Tag} label="Factura" value={selected.factura} mono />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center space-y-2">
                  <Package className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                  <p className="text-sm text-muted-foreground">Selecciona un equipo de la lista para ver sus detalles completos</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Estado inicial */}
      {results === null && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-3">
            <Search className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="text-muted-foreground">Ingresa un código de barras, número de serie, descripción o nombre de tienda para buscar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
