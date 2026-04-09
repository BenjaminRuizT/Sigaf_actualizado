import { useState, useEffect, useCallback } from "react";
import { useSortable } from "@/hooks/useSortable";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Monitor, RotateCcw, AlertTriangle, Eye, EyeOff, Upload, FileSpreadsheet, ShieldAlert, Settings, Camera, History, FileX, UserMinus, UserCog, UserPlus, DatabaseZap, Wrench, ChevronDown, ChevronUp, Filter, Lock, CheckCircle, CheckCircle2, LogOut, Loader2 } from "lucide-react";


export default function AdminPage({ defaultTab = "users" }) {
  const { api, user: currentUser } = useAuth();
  const { t , fmtDate, fmtMoney, locale} = useLanguage();
  const [tab, setTab] = useState(defaultTab);
  const [users, setUsers] = useState([]);
  const [userDialog, setUserDialog] = useState(null);
  const [userForm, setUserForm] = useState({ nombre: "", email: "", password: "", perfil: "Administrador" });
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [equipment, setEquipment] = useState({ items: [], total: 0, pages: 1 });
  const [eqSearch, setEqSearch] = useState("");
  const [eqPlaza, setEqPlaza] = useState("all");
  const [eqPage, setEqPage] = useState(1);
  const [plazas, setPlazas] = useState([]);
  const [editEq, setEditEq] = useState(null);
  const [eqForm, setEqForm] = useState({});
  const [resetDialog, setResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mafFile, setMafFile] = useState(null);
  const [usersFile, setUsersFile] = useState(null);
  const [sysSettings, setSysSettings] = useState({ photo_required_alta: true, photo_required_baja: true, photo_required_transf: true, pending_photos_ttl_hours: 24, session_timeout_minutes: 15, allow_multi_session: false });
  const [sysSettingsSaving, setSysSettingsSaving] = useState(false);
  const [reconLoading, setReconLoading] = useState(false);
  const [reconData, setReconData] = useState(null);
  const [reconFixing, setReconFixing] = useState(false);
  const [reconExpanded, setReconExpanded] = useState(false);

  // Importación masiva de usuarios
  // Auditorías vencidas
  const [expiredAudits, setExpiredAudits] = useState([]);
  const [expiredLoading, setExpiredLoading] = useState(false);
  // Sesiones activas
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [closingSession, setClosingSession] = useState(null);

  const fetchExpiredAudits = async () => {
    setExpiredLoading(true);
    try {
      const res = await api.get("/admin/expired-audits");
      setExpiredAudits(res.data.expired || []);
    } catch { toast.error("Error al cargar auditorías vencidas"); }
    finally { setExpiredLoading(false); }
  };

  const handleRestoreAudit = async (auditId) => {
    try {
      await api.post(`/admin/expired-audits/${auditId}/restore`);
      toast.success("Auditoría restaurada con 24 horas adicionales");
      fetchExpiredAudits();
    } catch { toast.error("Error al restaurar auditoría"); }
  };

  const fetchActiveSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get("/admin/active-sessions");
      setActiveSessions(res.data || []);
    } catch { toast.error("Error al cargar sesiones activas"); }
    finally { setSessionsLoading(false); }
  };

  const handleCloseSession = async (sessionId) => {
    setClosingSession(sessionId);
    try {
      await api.delete(`/admin/active-sessions/${sessionId}`);
      toast.success("Sesión cerrada");
      fetchActiveSessions();
    } catch { toast.error("Error al cerrar sesión"); }
    finally { setClosingSession(null); }
  };

  const [importUsersDialog, setImportUsersDialog] = useState(false);
  const [importUsersFile, setImportUsersFile] = useState(null);
  const [importUsersLoading, setImportUsersLoading] = useState(false);
  const [importUsersErrors, setImportUsersErrors] = useState([]);
  const [importUsersFileValid, setImportUsersFileValid] = useState(null); // null=no validado, true=ok, false=error
  const [importUsersFileMsg, setImportUsersFileMsg] = useState("");

  // Reset data file validation
  const [mafFileValid, setMafFileValid] = useState(null);
  const [mafFileMsg, setMafFileMsg] = useState("");
  const [usersFileValid, setUsersFileValid] = useState(null);
  const [usersFileMsg, setUsersFileMsg] = useState("");

  // ── History state ────────────────────────────────────────────────────────
  const ACTION_META = {
    DELETE_AUDIT:     { label: "Auditoría eliminada",       icon: FileX,       color: "text-red-600",    bg: "bg-red-500/10 border-red-500/30" },
    DELETE_USER:      { label: "Usuario eliminado",         icon: UserMinus,   color: "text-red-600",    bg: "bg-red-500/10 border-red-500/30" },
    UPDATE_USER:      { label: "Usuario actualizado",       icon: UserCog,     color: "text-amber-600",  bg: "bg-amber-500/10 border-amber-500/30" },
    CREATE_USER:      { label: "Usuario creado",            icon: UserPlus,    color: "text-blue-600",   bg: "bg-blue-500/10 border-blue-500/30" },
    UPDATE_EQUIPMENT: { label: "Equipo modificado",         icon: Wrench,      color: "text-amber-600",  bg: "bg-amber-500/10 border-amber-500/30" },
    DATA_RESET:       { label: "Reset de datos",            icon: DatabaseZap, color: "text-red-700",    bg: "bg-red-600/15 border-red-600/40" },
    UPDATE_SETTINGS:  { label: "Configuración actualizada", icon: Settings,    color: "text-blue-600",   bg: "bg-blue-500/10 border-blue-500/30" },
  };
  const [histItems, setHistItems] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histLoaded, setHistLoaded] = useState(false);
  const [histFilter, setHistFilter] = useState("all");
  const [histExpanded, setHistExpanded] = useState(null);
  const [rollingBack, setRollingBack] = useState(null);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const params = { limit: 500 };
      if (histFilter !== "all") params.action = histFilter;
      const res = await api.get("/admin/history", { params });
      setHistItems(res.data || []);
      setHistLoaded(true);
    } catch { toast.error("Error al cargar historial"); }
    finally { setHistLoading(false); }
  }, [api, histFilter]);

  useEffect(() => { if (histLoaded) fetchHistory(); }, [histFilter, histLoaded, fetchHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRollback = async (snap) => {
    if (!window.confirm(`¿Revertir esta acción?\n\n"${ACTION_META[snap.action]?.label}" sobre "${snap.target_label}"\n\nEsta operación restaurará el estado anterior.`)) return;
    setRollingBack(snap.id);
    try {
      const res = await api.post(`/admin/history/${snap.id}/rollback`);
      toast.success(res.data.message);
      fetchHistory();
    } catch (err) { toast.error(err.response?.data?.detail || "Error al revertir"); }
    finally { setRollingBack(null); }
  };
  const canRollback = (snap) => snap.can_rollback && !snap.rolled_back;

  // Unlock requests (Super Admin only)
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [unlockLoading, setUnlockLoading] = useState(null); // user_id being unlocked

  const userSort = useSortable("nombre");
  const eqSort = useSortable("descripcion");

  const fetchUsers = useCallback(async () => { try { const res = await api.get("/admin/users"); setUsers(res.data); } catch {} }, [api]);
  const fetchPlazas = useCallback(async () => { try { const res = await api.get("/stores/plazas"); setPlazas(res.data); } catch {} }, [api]);
  const fetchEquipment = useCallback(async () => {
    try {
      const params = { page: eqPage, limit: 30 };
      if (eqSearch) params.search = eqSearch;
      if (eqPlaza !== "all") params.plaza = eqPlaza;
      const res = await api.get("/admin/equipment", { params });
      setEquipment(res.data);
    } catch {}
  }, [api, eqPage, eqSearch, eqPlaza]);

  const fetchUnlockRequests = useCallback(async () => {
    if (currentUser?.perfil !== "Super Administrador") return;
    try { const res = await api.get("/admin/unlock-requests"); setUnlockRequests(res.data); } catch {}
  }, [api, currentUser?.perfil]);

  const handleUnlockUser = async (userId, userEmail) => {
    setUnlockLoading(userId);
    try {
      await api.post(`/admin/unlock/${userId}`);
      toast.success(`Usuario ${userEmail} desbloqueado`);
      fetchUnlockRequests();
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
    finally { setUnlockLoading(null); }
  };

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);
  useEffect(() => { fetchPlazas(); }, [fetchPlazas]);
  useEffect(() => { fetchUnlockRequests(); }, [fetchUnlockRequests]);
  useEffect(() => {
    const DEFAULTS = { photo_required_alta: true, photo_required_baja: true, photo_required_transf: true, pending_photos_ttl_hours: 24, session_timeout_minutes: 15, allow_multi_session: false };
    api.get("/admin/system-settings").then(r => {
      const raw = r.data || {};
      setSysSettings({
        ...DEFAULTS,
        ...raw,
        // Force numeric types
        pending_photos_ttl_hours: Number(raw.pending_photos_ttl_hours) > 0
          ? Number(raw.pending_photos_ttl_hours)
          : 24,
        session_timeout_minutes: Number(raw.session_timeout_minutes) >= 5
          ? Number(raw.session_timeout_minutes)
          : 15,
      });
    }).catch(() => {});
  }, [api]);

  const handleSaveSysSettings = async (newSettings) => {
    setSysSettingsSaving(true);
    try {
      const payload = {
        ...newSettings,
        pending_photos_ttl_hours: Math.max(1, Math.min(168, Number(newSettings.pending_photos_ttl_hours) || 24)),
        session_timeout_minutes: Math.max(5, Math.min(480, Number(newSettings.session_timeout_minutes) || 15)),
      };
      const res = await api.put("/admin/system-settings", payload);
      const DEFAULTS = { photo_required_alta: true, photo_required_baja: true, photo_required_transf: true, pending_photos_ttl_hours: 24, session_timeout_minutes: 15, allow_multi_session: false };
      const raw = res.data || {};
      setSysSettings({
        ...DEFAULTS,
        ...raw,
        pending_photos_ttl_hours: Number(raw.pending_photos_ttl_hours) > 0
          ? Number(raw.pending_photos_ttl_hours)
          : Number(payload.pending_photos_ttl_hours) || 24,
        session_timeout_minutes: Number(raw.session_timeout_minutes) >= 5
          ? Number(raw.session_timeout_minutes)
          : Number(payload.session_timeout_minutes) || 15,
      });
      toast.success("Configuración guardada");
    } catch { toast.error("Error al guardar configuración"); }
    finally { setSysSettingsSaving(false); }
  };

  const handleCheckInconsistencies = async () => {
    setReconLoading(true);
    setReconData(null);
    try {
      const res = await api.get("/admin/audit-inconsistencies");
      setReconData(res.data);
      setReconExpanded(true);
      if (res.data.total === 0) {
        toast.success("No se encontraron inconsistencias en las auditorías");
      } else {
        toast.warning(`Se encontraron ${res.data.total} equipos con inconsistencias`);
      }
    } catch { toast.error("Error al verificar inconsistencias"); }
    finally { setReconLoading(false); }
  };

  const handleFixAllInconsistencies = async () => {
    setReconFixing(true);
    try {
      const res = await api.post("/admin/fix-all-audit-inconsistencies");
      toast.success(`Corregidos ${res.data.fixed_scans} equipos en ${res.data.audits_recalculated} auditorías`);
      setReconData(null);
      setReconExpanded(false);
    } catch { toast.error("Error al corregir inconsistencias"); }
    finally { setReconFixing(false); }
  };

  const handleFixSingle = async (item) => {
    try {
      await api.post("/admin/fix-audit-inconsistency", null, {
        params: {
          equipment_id: item.equipment_id,
          origin_audit_id: item.origin_audit_id,
          resolved_by_audit: item.resolved_by_audit || "",
        }
      });
      toast.success(`Corregido: ${item.codigo_barras || item.descripcion}`);
      await handleCheckInconsistencies();
    } catch { toast.error("Error al corregir el equipo"); }
  };

  const handleSaveUser = async () => {
    try {
      if (userDialog === "create") { await api.post("/admin/users", userForm); toast.success(t("admin.userCreated")); }
      else {
        const update = {};
        if (userForm.nombre) update.nombre = userForm.nombre;
        if (userForm.email) update.email = userForm.email;
        if (userForm.password) update.password = userForm.password;
        if (userForm.perfil) update.perfil = userForm.perfil;
        await api.put(`/admin/users/${userDialog}`, update);
        toast.success(t("admin.userUpdated"));
      }
      setUserDialog(null); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
  };

  const handleDeleteUser = async () => {
    try { await api.delete(`/admin/users/${deleteDialog}`); toast.success(t("admin.userDeleted")); setDeleteDialog(null); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
  };

  const handleSaveEquipment = async () => {
    try { await api.put(`/admin/equipment/${editEq}`, eqForm); toast.success(t("common.success")); setEditEq(null); fetchEquipment(); }
    catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
  };

  // ── File validation helpers ──────────────────────────────────────────────
  const USERS_REQUIRED_COLS = ["nombre", "email", "password", "perfil"];
  const MAF_REQUIRED_COLS   = ["cr plaza", "plaza", "cr tienda", "tienda", "codigo barras", "no activo",
                                "descripción", "marca", "modelo", "costo"];

  const readXlsxHeaders = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        // Simple header extraction: read first row as CSV-like
        // Use basic binary parsing to find first row
        const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
        // For xlsx files we need a different approach - use ArrayBuffer
        resolve({ raw: data });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const validateXlsxHeaders = async (file, requiredCols) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Parse first row using basic CSV-detection or raw text scan
          const arr = new Uint8Array(e.target.result);
          // Check file signature: xlsx = PK (zip), csv = plain text
          const isXlsx = arr[0] === 0x50 && arr[1] === 0x4B;
          const isCsv  = !isXlsx;
          let headers = [];
          if (isCsv) {
            const text = new TextDecoder("utf-8", { fatal: false }).decode(arr);
            const firstLine = text.split(/\r?\n/)[0];
            headers = firstLine.split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
          } else {
            // For xlsx: scan the raw bytes for the first row cell strings
            // Simple approach: convert to text and look for common column names
            const text = new TextDecoder("latin1", { fatal: false }).decode(arr);
            // xlsx stores sheet data in xl/worksheets/sheet1.xml inside the zip
            // Basic heuristic: look for <v> or <t> tags — too complex without a lib
            // Instead flag as "not verifiable" and let backend validate
            resolve({ valid: true, msg: "Archivo xlsx seleccionado — la estructura se validará al importar.", headers: [] });
            return;
          }
          const missing = requiredCols.filter(r => !headers.some(h => h.includes(r.replace(/ /g, ""))));
          if (missing.length === 0) {
            resolve({ valid: true, msg: `✓ Estructura correcta (${headers.length} columnas detectadas)`, headers });
          } else {
            resolve({ valid: false, msg: `✗ Columnas faltantes: ${missing.join(", ")}`, headers });
          }
        } catch { resolve({ valid: true, msg: "Archivo seleccionado — estructura pendiente de validación.", headers: [] }); }
      };
      reader.onerror = () => resolve({ valid: false, msg: "No se pudo leer el archivo." });
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImportUsersFileChange = async (file) => {
    setImportUsersFile(file);
    setImportUsersErrors([]);
    setImportUsersFileValid(null);
    setImportUsersFileMsg("Validando estructura...");
    if (!file) return;
    const result = await validateXlsxHeaders(file, USERS_REQUIRED_COLS);
    setImportUsersFileValid(result.valid);
    setImportUsersFileMsg(result.msg);
  };

  const handleMafFileChange = async (file) => {
    setMafFile(file);
    setMafFileValid(null);
    setMafFileMsg(file ? "Archivo MAF seleccionado — la estructura se validará al procesar." : "");
    if (file) setMafFileValid(true); // MAF is complex xlsx, backend validates
  };

  const handleUsersResetFileChange = async (file) => {
    setUsersFile(file);
    setUsersFileValid(null);
    setUsersFileMsg("Validando estructura...");
    if (!file) return;
    const result = await validateXlsxHeaders(file, ["perfil", "nombre", "email"]);
    setUsersFileValid(result.valid);
    setUsersFileMsg(result.msg);
  };

  const handleResetData = async () => {
    if (!mafFile || !usersFile) { toast.error("Debe adjuntar ambos archivos (MAF.xlsx y USUARIOS.xlsx)"); return; }
    if (!resetPassword) { setResetPasswordError("Ingresa tu contraseña para confirmar"); return; }
    setResetPasswordError("");
    setResetLoading(true);
    try {
      // Validate password first
      await api.post("/auth/validate-password", { password: resetPassword });
      const formData = new FormData();
      formData.append("maf_file", mafFile);
      formData.append("users_file", usersFile);
      const res = await api.post("/admin/reset-data", formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 });
      toast.success(`Datos reiniciados: ${res.data.equipment} equipos, ${res.data.stores} tiendas, ${res.data.users} usuarios`);
      setResetDialog(false); setMafFile(null); setUsersFile(null); setResetPassword("");
      fetchUsers(); fetchEquipment();
    } catch (err) {
      if (err.response?.status === 401) {
        setResetPasswordError("Contraseña incorrecta");
      } else {
        toast.error(err.response?.data?.detail || t("common.error"));
      }
    }
    finally { setResetLoading(false); }
  };

  const handleImportUsers = async () => {
    if (!importUsersFile) { toast.error("Selecciona un archivo Excel"); return; }
    setImportUsersLoading(true);
    setImportUsersErrors([]);
    try {
      const fd = new FormData();
      fd.append("file", importUsersFile);
      const res = await api.post("/admin/import-users", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(res.data.message);
      setImportUsersDialog(false); setImportUsersFile(null);
      fetchUsers();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail?.errors) {
        setImportUsersErrors(detail.errors);
      } else {
        toast.error(typeof detail === "string" ? detail : t("common.error"));
      }
    }
    finally { setImportUsersLoading(false); }
  };

  const handleDownloadUsersTemplate = () => {
    // Create a simple CSV-like template explanation as downloadable text
    const headers = ["nombre", "email", "password", "perfil"];
    const example = ["Juan Pérez", "juan.perez@oxxo.com", "Contraseña123", "Administrador"];
    const example2 = ["María García", "maria.garcia@oxxo.com", "Password456", "Socio Tecnologico"];
    let csv = headers.join(",") + "\n" + example.join(",") + "\n" + example2.join(",");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plantilla_usuarios.csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async (type) => {
    try {
      const res = await api.get(`/admin/template/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url;
      a.download = `template_${type}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error(t("common.error")); }
  };

  const openEditUser = (u) => { setUserForm({ nombre: u.nombre, email: u.email, password: "", perfil: u.perfil }); setShowPassword(false); setUserDialog(u.id); };
  const openCreateUser = () => { setUserForm({ nombre: "", email: "", password: "", perfil: "Administrador" }); setShowPassword(false); setUserDialog("create"); };
  const openEditEq = (eq) => { setEqForm({ descripcion: eq.descripcion, marca: eq.marca, modelo: eq.modelo, serie: eq.serie, costo: eq.costo, depreciacion: eq.depreciacion }); setEditEq(eq.id); };
  
  return (
    <div className="space-y-6" data-testid="admin-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight">{t("admin.title")}</h1>
        <Button variant="outline" size="sm" onClick={() => setResetDialog(true)} data-testid="reset-data-btn" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
          <RotateCcw className="h-4 w-4" /> Reiniciar Datos
        </Button>
      </div>

      {/* Unlock Requests Panel — Super Admin only */}
      {currentUser?.perfil === "Super Administrador" && unlockRequests.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/8 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm font-semibold text-amber-700">
              {unlockRequests.filter(u => u.unlock_requested).length > 0
                ? `${unlockRequests.filter(u => u.unlock_requested).length} solicitud(es) de desbloqueo pendiente(s)`
                : `${unlockRequests.length} cuenta(s) bloqueada(s)`
              }
            </p>
          </div>
          <div className="space-y-2">
            {unlockRequests.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-background/80 rounded-md px-3 py-2 gap-3 flex-wrap">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{u.nombre}</span>
                    <span className="text-xs font-mono text-muted-foreground">{u.email}</span>
                    {u.unlock_requested && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-medium">
                        Solicitud enviada
                      </span>
                    )}
                  </div>
                  {u.unlock_request_reason && (
                    <p className="text-xs text-muted-foreground italic">"{u.unlock_request_reason}"</p>
                  )}
                  {u.locked_at && (
                    <p className="text-[10px] text-muted-foreground">
                      Bloqueado: {new Date(u.locked_at).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950 shrink-0"
                  onClick={() => handleUnlockUser(u.id, u.email)} disabled={unlockLoading === u.id}>
                  {unlockLoading === u.id
                    ? <div className="animate-spin h-3 w-3 border-2 border-amber-600 border-t-transparent rounded-full" />
                    : <ShieldAlert className="h-3.5 w-3.5" />
                  }
                  Desbloquear
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3" data-testid="admin-tabs">
          <TabsTrigger value="users" data-testid="admin-tab-users" className="gap-2"><Users className="h-4 w-4" /> {t("admin.users")}</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
          <TabsTrigger value="history" className="gap-2" onClick={() => { if (!histLoaded) fetchHistory(); fetchActiveSessions(); fetchExpiredAudits(); }}>
            <History className="h-4 w-4" /> Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => { setImportUsersDialog(true); setImportUsersFile(null); setImportUsersErrors([]); }} className="gap-2">
              <Upload className="h-4 w-4" /> Importar Excel
            </Button>
            <Button size="sm" onClick={openCreateUser} data-testid="create-user-btn" className="gap-2"><Plus className="h-4 w-4" /> {t("admin.create")}</Button>
          </div>
          <Card><div className="overflow-x-auto"><ScrollArea className="h-[500px]"><Table style={{minWidth:600}}>
            <TableHeader><TableRow>
              <TableHead><userSort.SortHeader col="nombre">{t("admin.name")}</userSort.SortHeader></TableHead>
              <TableHead><userSort.SortHeader col="email">{t("auth.email")}</userSort.SortHeader></TableHead>
              <TableHead><userSort.SortHeader col="perfil">{t("admin.profile")}</userSort.SortHeader></TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {userSort.sorted(users).map(u => (
                <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{u.perfil === "Super Administrador" ? t("admin.superAdmin") : u.perfil === "Administrador" ? t("admin.administrator") : t("admin.techPartner")}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditUser(u)} data-testid={`edit-user-${u.id}`}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog(u.id)} disabled={u.id === currentUser?.id} data-testid={`delete-user-${u.id}`} title={u.id === currentUser?.id ? "No puede eliminarse a si mismo" : ""}><Trash2 className={`h-4 w-4 ${u.id === currentUser?.id ? "text-muted-foreground" : "text-destructive"}`} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></ScrollArea></div></Card>
        </TabsContent>

        {/* Pestaña Configuración */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-5">
              <div>
                <p className="font-heading font-bold uppercase tracking-tight text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" /> Fotos al Finalizar Auditoría
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Controla si se solicita foto del formato físico al finalizar una auditoría con movimientos.
                </p>
              </div>
              {/* Toggle ALTAS */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">Foto Formato ALTAS</p>
                  <p className="text-xs text-muted-foreground">Se solicita cuando hay equipos dados de alta (sobrante) en la auditoría</p>
                </div>
                <button
                  onClick={() => handleSaveSysSettings({ ...sysSettings, photo_required_alta: !sysSettings.photo_required_alta })}
                  disabled={sysSettingsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${sysSettings.photo_required_alta ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sysSettings.photo_required_alta ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              {/* Toggle BAJAS */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">Foto Formato BAJAS</p>
                  <p className="text-xs text-muted-foreground">Se solicita cuando hay equipos dados de baja (no localizado) en la auditoría</p>
                </div>
                <button
                  onClick={() => handleSaveSysSettings({ ...sysSettings, photo_required_baja: !sysSettings.photo_required_baja })}
                  disabled={sysSettingsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${sysSettings.photo_required_baja ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sysSettings.photo_required_baja ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              {/* Toggle Transferencias */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">Foto Formato TRANSFERENCIAS</p>
                  <p className="text-xs text-muted-foreground">Se solicita cuando hay equipos transferidos entre tiendas en la auditoría</p>
                </div>
                <button
                  onClick={() => handleSaveSysSettings({ ...sysSettings, photo_required_transf: !sysSettings.photo_required_transf })}
                  disabled={sysSettingsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${sysSettings.photo_required_transf ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sysSettings.photo_required_transf ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nota: si no hay movimientos del tipo correspondiente, no se solicitará foto independientemente de esta configuración.
              </p>

              {/* Divider */}
              <div className="border-t pt-4 space-y-3">
                <div>
                  <p className="font-heading font-bold uppercase tracking-tight text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" /> Tiempo de espera para completar fotos
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Cuando una auditoría queda en estado <strong>Pendiente de fotos</strong>, el auditor tiene este tiempo para regresar y completarlas. Al vencer el plazo, la auditoría es eliminada automáticamente.
                  </p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                  <div className="flex-1 space-y-0.5">
                    <p className="font-medium text-sm">Horas disponibles para completar fotos</p>
                    <p className="text-xs text-muted-foreground">Rango recomendado: 4 a 72 horas</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1} max={168}
                      value={sysSettings.pending_photos_ttl_hours ?? 24}
                      onChange={e => setSysSettings(s => ({ ...s, pending_photos_ttl_hours: Math.max(1, Math.min(168, parseInt(e.target.value) || 24)) }))}
                      className="w-20 h-9 text-center rounded-md border border-input bg-background text-sm font-mono font-bold"
                    />
                    <span className="text-sm text-muted-foreground">horas</span>
                    <Button size="sm" onClick={() => handleSaveSysSettings(sysSettings)} disabled={sysSettingsSaving} className="ml-2">
                      {sysSettingsSaving ? "..." : "Guardar"}
                    </Button>
                  </div>
                </div>
                {/* Manual cleanup */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm text-red-700">Limpieza manual de auditorías vencidas</p>
                    <p className="text-xs text-muted-foreground">Elimina inmediatamente todas las auditorías <em>pendiente de fotos</em> que hayan superado su plazo.</p>
                  </div>
                  <Button size="sm" variant="destructive" className="gap-1.5 ml-4 shrink-0"
                    onClick={async () => {
                      try {
                        const res = await api.post("/admin/cleanup-expired-audits");
                        toast.success(res.data.message);
                      } catch { toast.error("Error en la limpieza"); }
                    }}>
                    <Trash2 className="h-3.5 w-3.5" /> Limpiar ahora
                  </Button>
                </div>
                {/* Fix pending_photos that no longer need photos */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm text-amber-700">Corregir auditorías en espera de fotos</p>
                    <p className="text-xs text-muted-foreground">Completa automáticamente las auditorías <em>pendiente de fotos</em> que ya no requieran foto según la configuración actual.</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 ml-4 shrink-0 border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                    onClick={async () => {
                      try {
                        const res = await api.post("/admin/fix-pending-photos");
                        toast.success(res.data.message);
                      } catch { toast.error("Error al corregir auditorías"); }
                    }}>
                    <CheckCircle className="h-3.5 w-3.5" /> Corregir ahora
                  </Button>
                </div>
              </div>

              {/* ── Cierre de sesión por inactividad ── */}
              <div className="border-t pt-4 space-y-3">
                <div>
                  <p className="font-heading font-bold uppercase tracking-tight text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" /> Cierre de sesión por inactividad
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Si un usuario no registra actividad durante este tiempo, su sesión se cierra automáticamente. Un banner de aviso aparece 5 minutos antes con cuenta regresiva.
                  </p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                  <div className="flex-1 space-y-0.5">
                    <p className="font-medium text-sm">Minutos de inactividad para cerrar sesión</p>
                    <p className="text-xs text-muted-foreground">Rango: 5 – 480 minutos (mínimo recomendado: 15)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={sysSettings.session_timeout_minutes ?? 15}
                      onChange={e => setSysSettings(s => ({
                        ...s,
                        session_timeout_minutes: Math.max(5, Math.min(480, parseInt(e.target.value) || 15))
                      }))}
                      className="w-20 h-9 rounded-md border border-input bg-background px-3 text-sm text-center font-mono"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                    <Button size="sm" onClick={() => handleSaveSysSettings(sysSettings)} disabled={sysSettingsSaving} className="ml-1">
                      {sysSettingsSaving ? "..." : "Guardar"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  El cambio se aplica en tiempo real a todas las sesiones activas (dentro del minuto siguiente al guardar).
                </p>
              </div>

              {/* ── Multisesión ── */}
              <div className="border-t pt-4 space-y-3">
                <div>
                  <p className="font-heading font-bold uppercase tracking-tight text-base flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" /> Sesiones simultáneas
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Por defecto cada usuario solo puede tener una sesión activa. Habilitar esta opción permite que el mismo usuario inicie sesión desde múltiples dispositivos simultáneamente.
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">Permitir múltiples sesiones por usuario</p>
                    <p className="text-xs text-muted-foreground">Al activar, no se mostrará el diálogo de conflicto de sesión al iniciar sesión desde otro dispositivo</p>
                  </div>
                  <button
                    onClick={() => handleSaveSysSettings({ ...sysSettings, allow_multi_session: !sysSettings.allow_multi_session })}
                    disabled={sysSettingsSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${sysSettings.allow_multi_session ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sysSettings.allow_multi_session ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Reconciliación de Auditorías (Solo Super Admin) ── */}
          {currentUser?.perfil === "Super Administrador" && (
            <Card className="border-amber-500/30">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Revisión de Inconsistencias en Auditorías</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Detecta y corrige equipos marcados como No Localizado en una auditoría que
                      posteriormente fueron encontrados (transferidos) en otra auditoría posterior.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-amber-700">¿Cuándo ocurre este escenario?</p>
                  <p>1. Tienda A audita y un equipo no se encuentra → queda como No Localizado + Baja generada</p>
                  <p>2. Días después, Tienda B audita y encuentra ese equipo → se registra como Transferencia</p>
                  <p>3. La Baja original queda cancelada pero el conteo de No Localizados en Tienda A no se actualiza</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleCheckInconsistencies}
                    disabled={reconLoading || reconFixing}
                    variant="outline"
                    className="gap-2 border-amber-500/40 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                  >
                    {reconLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <AlertTriangle className="h-4 w-4" />}
                    Verificar Auditorías
                  </Button>
                  {reconData && reconData.total > 0 && (
                    <Button
                      onClick={handleFixAllInconsistencies}
                      disabled={reconFixing || reconLoading}
                      className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {reconFixing
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <CheckCircle2 className="h-4 w-4" />}
                      Corregir Todas ({reconData.total})
                    </Button>
                  )}
                  {reconData && reconData.total === 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Todas las auditorías están consistentes
                    </div>
                  )}
                </div>
                {reconData && reconData.total > 0 && reconExpanded && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-amber-500/10 px-4 py-2 flex items-center justify-between border-b">
                      <span className="text-sm font-semibold text-amber-700">
                        {reconData.total} equipo{reconData.total !== 1 ? "s" : ""} con inconsistencia
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs"
                        onClick={() => setReconExpanded(false)}>
                        Ocultar
                      </Button>
                    </div>
                    <div className="divide-y max-h-80 overflow-y-auto">
                      {reconData.inconsistencies.map((item, idx) => (
                        <div key={idx} className="px-4 py-3 flex items-start gap-3">
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold">{item.codigo_barras || "—"}</span>
                              <span className="text-xs text-muted-foreground">{item.descripcion}</span>
                              {item.marca && <span className="text-xs text-muted-foreground">· {item.marca}</span>}
                              {item.valor_real > 0 && (
                                <span className="text-xs font-mono text-red-600">${Number(item.valor_real).toFixed(2)}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              <span className="text-red-600 font-medium">No Localizado en:</span> {item.origin_tienda}
                              {item.resolved_to_tienda && (
                                <span> → <span className="text-emerald-600 font-medium">Encontrado en:</span> {item.resolved_to_tienda}</span>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline"
                            className="shrink-0 h-7 text-xs gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleFixSingle(item)}>
                            <CheckCircle className="h-3 w-3" /> Corregir
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Historial de Cambios ── */}
        <TabsContent value="history" className="space-y-4">
          {/* ── Sesiones Activas ── */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Sesiones Activas</CardTitle>
                  {activeSessions.length > 0 && (
                    <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                      {activeSessions.length}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={fetchActiveSessions} disabled={sessionsLoading} className="gap-1.5">
                  <RotateCcw className={`h-3.5 w-3.5 ${sessionsLoading ? "animate-spin" : ""}`} /> Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  {sessionsLoading ? "Cargando..." : "Sin sesiones activas o presiona Actualizar"}
                </p>
              ) : (
                <div className="divide-y">
                  {activeSessions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <UserCog className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.nombre || s.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.perfil} · {s.ip}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Inicio: {s.created_at ? new Date(s.created_at).toLocaleString(locale) : "—"}
                          {s.last_seen ? ` · Última actividad: ${new Date(s.last_seen).toLocaleString(locale)}` : ""}
                        </p>
                        {s.user_agent && (
                          <p className="text-[10px] text-muted-foreground/60 truncate">{s.user_agent.slice(0, 80)}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloseSession(s.id)}
                        disabled={closingSession === s.id}
                        className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 shrink-0"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        {closingSession === s.id ? "..." : "Cerrar"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Auditorías vencidas ── */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">Auditorías Vencidas (Pendiente Fotos)</CardTitle>
                  {expiredAudits.length > 0 && (
                    <span className="text-xs bg-amber-500/10 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                      {expiredAudits.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchExpiredAudits} disabled={expiredLoading} className="gap-1.5">
                    <RotateCcw className={`h-3.5 w-3.5 ${expiredLoading ? "animate-spin" : ""}`} /> Ver
                  </Button>
                  {expiredAudits.length > 0 && (
                    <Button variant="destructive" size="sm" className="gap-1.5"
                      onClick={async () => {
                        try {
                          const res = await api.post("/admin/cleanup-expired-audits");
                          toast.success(res.data.message);
                          setExpiredAudits([]);
                        } catch { toast.error("Error en la limpieza"); }
                      }}>
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar todas
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {expiredAudits.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  {expiredLoading ? "Cargando..." : "Sin auditorías vencidas o presiona Ver"}
                </p>
              ) : (
                <div className="divide-y">
                  {expiredAudits.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                        <FileX className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.tienda}</p>
                        <p className="text-xs text-muted-foreground">{a.plaza} · CR: {a.cr_tienda} · Auditor: {a.auditor_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Inicio: {a.started_at ? new Date(a.started_at).toLocaleString(locale) : "—"}
                          {a.photos_deadline ? ` · Vencía: ${new Date(a.photos_deadline).toLocaleString(locale)}` : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          ✓ {a.located_count} localizados · ⊗ {a.not_found_count} no localizados · ⚠ {a.surplus_count} sobrantes
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreAudit(a.id)}
                        className="gap-1.5 border-emerald-400 text-emerald-700 hover:bg-emerald-50 shrink-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Historial de acciones ── */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchHistory} className="gap-1.5">
              <RotateCcw className={`h-3.5 w-3.5 ${histLoading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono">{histItems.length}</p>
              <p className="text-xs text-muted-foreground">Total acciones</p>
            </CardContent></Card>
            <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-amber-600">{histItems.filter(i => i.can_rollback && !i.rolled_back).length}</p>
              <p className="text-xs text-muted-foreground">Reversibles</p>
            </CardContent></Card>
            <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-blue-600">{histItems.filter(i => i.rolled_back).length}</p>
              <p className="text-xs text-muted-foreground">Revertidas</p>
            </CardContent></Card>
            <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono text-red-600">{histItems.filter(i => ["DELETE_AUDIT","DELETE_USER","DATA_RESET"].includes(i.action)).length}</p>
              <p className="text-xs text-muted-foreground">Eliminaciones</p>
            </CardContent></Card>
          </div>
          {/* Filtro */}
          <Card><CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={histFilter} onValueChange={setHistFilter}>
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
            <CardContent className="p-0">
              {histLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : !histLoaded ? (
                <div className="text-center py-10 space-y-2">
                  <History className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                  <p className="text-sm text-muted-foreground">Haz clic en "Actualizar" para cargar el historial</p>
                </div>
              ) : histItems.length === 0 ? (
                <div className="text-center py-10">
                  <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin acciones registradas</p>
                </div>
              ) : (
                <div className="divide-y">
                  {histItems.map(snap => {
                    const meta = ACTION_META[snap.action] || { label: snap.action, icon: ShieldAlert, color: "text-muted-foreground", bg: "" };
                    const Icon = meta.icon;
                    const isExp = histExpanded === snap.id;
                    return (
                      <div key={snap.id} className={`px-4 py-3 ${snap.rolled_back ? "opacity-60" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${meta.bg}`}>
                            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                              {snap.rolled_back && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-700 border-emerald-500/30 bg-emerald-500/10">↩ Revertida</Badge>}
                              {snap.target_label && <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[180px]" title={snap.target_label}>{snap.target_label}</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              <span>{new Date(snap.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "medium" })}</span>
                              <span className="font-medium text-foreground">{snap.actor_email}</span>
                            </div>
                            {snap.rolled_back && snap.rolled_back_by && (
                              <p className="text-[11px] text-emerald-600 mt-0.5">Revertida por {snap.rolled_back_by} · {new Date(snap.rolled_back_at).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {snap.before && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setHistExpanded(isExp ? null : snap.id)}>
                                {isExp ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            {canRollback(snap) && (
                              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs"
                                onClick={() => handleRollback(snap)} disabled={rollingBack === snap.id}>
                                {rollingBack === snap.id ? <div className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                Revertir
                              </Button>
                            )}
                          </div>
                        </div>
                        {isExp && snap.before && (
                          <div className="mt-3 ml-10 p-3 bg-muted/40 rounded-lg border text-xs font-mono space-y-1 max-h-48 overflow-auto">
                            <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Estado anterior (snapshot)</p>
                            {Object.entries(snap.before).filter(([k]) => !["password_hash","_id"].includes(k)).map(([k, v]) => (
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
        </TabsContent>
      </Tabs>

      {/* User Create/Edit Dialog */}
      <Dialog open={!!userDialog} onOpenChange={() => setUserDialog(null)}>
        <DialogContent data-testid="user-dialog">
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-tight">{userDialog === "create" ? t("admin.create") : t("admin.edit")} {t("admin.users")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("admin.name")}</Label><Input value={userForm.nombre} onChange={e => setUserForm(f => ({ ...f, nombre: e.target.value }))} data-testid="user-name-input" /></div>
            <div className="space-y-2"><Label>{t("auth.email")}</Label><Input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} data-testid="user-email-input" /></div>
            <div className="space-y-2"><Label>{t("auth.password")}</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder={userDialog !== "create" ? "Dejar en blanco para no cambiar" : ""} data-testid="user-password-input" className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="toggle-user-password">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2"><Label>{t("admin.profile")}</Label><Select value={userForm.perfil} onValueChange={v => setUserForm(f => ({ ...f, perfil: v }))}><SelectTrigger data-testid="user-profile-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Super Administrador">{t("admin.superAdmin")}</SelectItem><SelectItem value="Administrador">{t("admin.administrator")}</SelectItem><SelectItem value="Socio Tecnologico">{t("admin.techPartner")}</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setUserDialog(null)} data-testid="user-cancel">{t("admin.cancel")}</Button><Button onClick={handleSaveUser} data-testid="user-save">{t("admin.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent data-testid="delete-dialog">
          <DialogHeader><DialogTitle>{t("admin.confirmDelete")}</DialogTitle></DialogHeader>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setDeleteDialog(null)}>{t("admin.cancel")}</Button><Button variant="destructive" onClick={handleDeleteUser} data-testid="confirm-delete">{t("admin.delete")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Edit Dialog */}

      {/* Reset Data Dialog */}
      <Dialog open={resetDialog} onOpenChange={(v) => { setResetDialog(v); if (!v) { setMafFile(null); setUsersFile(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="reset-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-tight flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Reiniciar Datos del Sistema</DialogTitle>
            <DialogDescription>Esta acción eliminará TODOS los datos actuales y recargará la información desde los nuevos archivos. Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>

          <div className="bg-destructive/10 rounded-lg p-4 text-sm text-destructive">
            <p className="font-medium">Se eliminarán:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Todas las auditorías realizadas</li>
              <li>Todos los movimientos (transferencias y bajas)</li>
              <li>Todas las clasificaciones de equipos</li>
              <li>Todos los usuarios (se recargarán desde USUARIOS.xlsx)</li>
            </ul>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium">Archivo MAF.xlsx <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">{mafFile ? mafFile.name : "Seleccionar archivo MAF.xlsx..."}</span>
                  <input type="file" accept=".xlsx" className="hidden" onChange={e => handleMafFileChange(e.target.files[0] || null)} data-testid="maf-file-input" />
                </label>
                {mafFile && (
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge variant="outline" className={`text-xs ${mafFileValid === false ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"}`}>
                      {mafFileValid === false ? "Error" : "Cargado"}
                    </Badge>
                    {mafFileMsg && <span className="text-xs text-muted-foreground">{mafFileMsg}</span>}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Archivo USUARIOS.xlsx <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">{usersFile ? usersFile.name : "Seleccionar archivo USUARIOS.xlsx..."}</span>
                  <input type="file" accept=".xlsx" className="hidden" onChange={e => handleUsersResetFileChange(e.target.files[0] || null)} data-testid="users-file-input" />
                </label>
                {usersFile && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className={`text-xs font-medium flex items-center gap-1.5 ${usersFileValid === false ? "text-destructive" : "text-emerald-600"}`}>
                      {usersFileValid === false ? "✗" : "✓"} {usersFileMsg}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Structure Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Estructura requerida de los archivos:</h4>
            <div className="bg-muted rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">MAF.xlsx</p>
                <Button variant="ghost" size="sm" onClick={() => handleDownloadTemplate("maf")} data-testid="download-maf-template" className="h-7 gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Descargar Formato
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p><span className="font-mono bg-background px-1 rounded">Cr Plaza</span> <span className="font-mono bg-background px-1 rounded">Plaza</span> <span className="font-mono bg-background px-1 rounded">Cr Tienda</span> <span className="font-mono bg-background px-1 rounded">Tienda</span> <span className="font-mono bg-background px-1 rounded">Codigo Barras</span> <span className="font-mono bg-background px-1 rounded">No Activo</span></p>
                <p><span className="font-mono bg-background px-1 rounded">Mes Adquisicion</span> <span className="font-mono bg-background px-1 rounded">Año Adquisicion</span> <span className="font-mono bg-background px-1 rounded">Factura</span> <span className="font-mono bg-background px-1 rounded">Costo</span> <span className="font-mono bg-background px-1 rounded">Depresiacion</span> <span className="font-mono bg-background px-1 rounded">Vida util</span></p>
                <p><span className="font-mono bg-background px-1 rounded">Remanente</span> <span className="font-mono bg-background px-1 rounded">Descripción</span> <span className="font-mono bg-background px-1 rounded">Marca</span> <span className="font-mono bg-background px-1 rounded">Modelo</span> <span className="font-mono bg-background px-1 rounded">Serie</span></p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">USUARIOS.xlsx</p>
                <Button variant="ghost" size="sm" onClick={() => handleDownloadTemplate("usuarios")} data-testid="download-users-template" className="h-7 gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Descargar Formato
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <p><span className="font-mono bg-background px-1 rounded">Perfil</span> <span className="font-mono bg-background px-1 rounded">Nombre</span> <span className="font-mono bg-background px-1 rounded">Email</span> <span className="font-mono bg-background px-1 rounded">Contraseña</span></p>
                <p className="mt-1 text-[10px]">Perfiles válidos: Super Administrador, Administrador, Socio Tecnologico</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-col">
            {/* Confirmación con contraseña */}
            <div className="w-full space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-destructive" /> Confirmar con tu contraseña
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña actual para confirmar"
                  value={resetPassword}
                  onChange={e => { setResetPassword(e.target.value); setResetPasswordError(""); }}
                  className={`pr-10 ${resetPasswordError ? "border-destructive" : ""}`}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {resetPasswordError && <p className="text-xs text-destructive">{resetPasswordError}</p>}
            </div>
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => { setResetDialog(false); setMafFile(null); setUsersFile(null); setResetPassword(""); setResetPasswordError(""); setMafFileValid(null); setMafFileMsg(""); setUsersFileValid(null); setUsersFileMsg(""); }}>Cancelar</Button>
              <Button variant="destructive" onClick={handleResetData} disabled={resetLoading || !mafFile || !usersFile || !resetPassword || usersFileValid === false} data-testid="confirm-reset" className="gap-2">
                {resetLoading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <RotateCcw className="h-4 w-4" />}
                Reiniciar Datos
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Importación masiva de usuarios */}
      <Dialog open={importUsersDialog} onOpenChange={v => { setImportUsersDialog(v); if (!v) { setImportUsersFile(null); setImportUsersErrors([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-tight flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Importar Usuarios desde Excel
            </DialogTitle>
            <DialogDescription>Carga masiva de usuarios desde un archivo .xlsx o .csv con la estructura requerida.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Estructura */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estructura requerida</p>
                <Button variant="ghost" size="sm" onClick={handleDownloadUsersTemplate} className="h-7 gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Descargar plantilla
                </Button>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex gap-1 flex-wrap">
                  {["nombre","email","password","perfil"].map(col => (
                    <span key={col} className="font-mono bg-background border rounded px-1.5 py-0.5">{col}</span>
                  ))}
                </div>
                <p className="text-muted-foreground">Perfiles válidos: <code>Administrador</code> · <code>Socio Tecnologico</code></p>
                <p className="text-muted-foreground text-[11px]">La primera fila debe ser el encabezado. Los emails ya registrados serán omitidos.</p>
              </div>
            </div>
            {/* File picker */}
            <div className="space-y-2">
              <Label className="font-medium">Archivo Excel <span className="text-destructive">*</span></Label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">{importUsersFile ? importUsersFile.name : "Seleccionar archivo .xlsx..."}</span>
                <input type="file" accept=".xlsx,.csv" className="hidden" onChange={e => handleImportUsersFileChange(e.target.files[0] || null)} />
              </label>
              {importUsersFile && (
              <div className={`flex items-center gap-2 mt-1 p-2 rounded-lg text-xs font-medium ${
                importUsersFileValid === null ? "bg-muted text-muted-foreground" :
                importUsersFileValid ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30" :
                "bg-destructive/10 text-destructive border border-destructive/30"
              }`}>
                {importUsersFileValid === null ? "⏳" : importUsersFileValid ? "✓" : "✗"} {importUsersFileMsg}
              </div>
            )}
            </div>
            {/* Errores de validación */}
            {importUsersErrors.length > 0 && (
              <div className="bg-destructive/10 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-destructive">Errores encontrados en el archivo:</p>
                {importUsersErrors.map((e, i) => <p key={i} className="text-xs text-destructive">• {e}</p>)}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportUsersDialog(false)}>Cancelar</Button>
            <Button onClick={handleImportUsers} disabled={importUsersLoading || !importUsersFile || importUsersFileValid === false} className="gap-2">
              {importUsersLoading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Upload className="h-4 w-4" />}
              Importar Usuarios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

