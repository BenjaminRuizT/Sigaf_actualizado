import { useState, useEffect, useCallback } from "react";
import { useSortable } from "@/hooks/useSortable";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Users, Monitor, Search, ChevronLeft, ChevronRight, ArrowUpDown, RotateCcw, AlertTriangle, Eye, EyeOff, Download, Upload, FileSpreadsheet, ShieldAlert, Settings, Camera } from "lucide-react";


export default function AdminPage() {
  const { api, user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState("users");
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
  const [showPassword, setShowPassword] = useState(false);
  const [mafFile, setMafFile] = useState(null);
  const [usersFile, setUsersFile] = useState(null);
  const [sysSettings, setSysSettings] = useState({ photo_required_ab: true, photo_required_transf: true });
  const [sysSettingsSaving, setSysSettingsSaving] = useState(false);

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
    api.get("/admin/system-settings").then(r => setSysSettings(r.data)).catch(() => {});
  }, [api]);

  const handleSaveSysSettings = async (newSettings) => {
    setSysSettingsSaving(true);
    try {
      const res = await api.put("/admin/system-settings", newSettings);
      setSysSettings(res.data);
      toast.success("Configuración guardada");
    } catch { toast.error("Error al guardar configuración"); }
    finally { setSysSettingsSaving(false); }
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

  const handleResetData = async () => {
    if (!mafFile || !usersFile) { toast.error("Debe adjuntar ambos archivos (MAF.xlsx y USUARIOS.xlsx)"); return; }
    setResetLoading(true);
    try {
      const formData = new FormData();
      formData.append("maf_file", mafFile);
      formData.append("users_file", usersFile);
      const res = await api.post("/admin/reset-data", formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 });
      toast.success(`Datos reiniciados: ${res.data.equipment} equipos, ${res.data.stores} tiendas, ${res.data.users} usuarios`);
      setResetDialog(false); setMafFile(null); setUsersFile(null);
      fetchUsers(); fetchEquipment();
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
    finally { setResetLoading(false); }
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
  const fmtMoney = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

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
                      Bloqueado: {new Date(u.locked_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
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
          <TabsTrigger value="equipment" data-testid="admin-tab-equipment" className="gap-2"><Monitor className="h-4 w-4" /> {t("admin.equipment")}</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={openCreateUser} data-testid="create-user-btn" className="gap-2"><Plus className="h-4 w-4" /> {t("admin.create")}</Button></div>
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

        <TabsContent value="equipment" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={eqPlaza} onValueChange={v => { setEqPlaza(v); setEqPage(1); }}><SelectTrigger className="w-48" data-testid="eq-plaza-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("dashboard.allPlazas")}</SelectItem>{plazas.map(p => <SelectItem key={p.cr_plaza || p.plaza} value={p.plaza}>{p.plaza}</SelectItem>)}</SelectContent></Select>
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t("admin.searchEquipment")} value={eqSearch} onChange={e => { setEqSearch(e.target.value); setEqPage(1); }} className="pl-10" data-testid="eq-search-input" /></div>
          </div>
          <Card><div className="overflow-x-auto"><ScrollArea className="h-[500px]"><Table style={{minWidth:600}}>
            <TableHeader><TableRow>
              <TableHead><eqSort.SortHeader col="codigo_barras">{t("audit.barcode")}</eqSort.SortHeader></TableHead>
              <TableHead><eqSort.SortHeader col="descripcion">{t("audit.description")}</eqSort.SortHeader></TableHead>
              <TableHead><eqSort.SortHeader col="marca">{t("audit.brand")}</eqSort.SortHeader></TableHead>
              <TableHead><eqSort.SortHeader col="modelo">{t("audit.model")}</eqSort.SortHeader></TableHead>
              <TableHead>{t("logs.store")}</TableHead>
              <TableHead className="text-right"><eqSort.SortHeader col="costo">{t("audit.cost")}</eqSort.SortHeader></TableHead>
              <TableHead className="text-right"><eqSort.SortHeader col="valor_real">{t("audit.realValue")}</eqSort.SortHeader></TableHead>
              <TableHead><eqSort.SortHeader col="depreciado">{t("audit.deprecated")}</eqSort.SortHeader></TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {eqSort.sorted(equipment.items).map(eq => (
                <TableRow key={eq.id} data-testid={`eq-row-${eq.id}`}>
                  <TableCell className="font-mono text-xs">{eq.codigo_barras}</TableCell>
                  <TableCell className="text-sm">{eq.descripcion}</TableCell>
                  <TableCell className="text-sm">{eq.marca}</TableCell>
                  <TableCell className="text-sm">{eq.modelo}</TableCell>
                  <TableCell className="text-sm truncate max-w-[120px]">{eq.tienda}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmtMoney(eq.costo)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmtMoney(eq.valor_real)}</TableCell>
                  <TableCell><Badge variant={eq.depreciado ? "destructive" : "outline"} className="text-[10px]">{eq.depreciado ? "Si" : "No"}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEditEq(eq)} data-testid={`edit-eq-${eq.id}`}><Pencil className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {equipment.items.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t("common.noResults")}</TableCell></TableRow>}
            </TableBody>
          </Table></ScrollArea></div></Card>
          {equipment.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEqPage(p => Math.max(1, p - 1))} disabled={eqPage === 1} data-testid="eq-prev"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground font-mono">{eqPage} / {equipment.pages}</span>
              <Button variant="outline" size="sm" onClick={() => setEqPage(p => Math.min(equipment.pages, p + 1))} disabled={eqPage === equipment.pages} data-testid="eq-next"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

        {/* Pestaña Configuración */}
        <TabsContent value="settings" className="space-y-4 mt-4">
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

              {/* Toggle AB */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">Foto Formato ALTAS / BAJAS</p>
                  <p className="text-xs text-muted-foreground">Se solicita cuando hay equipos dados de alta o de baja en la auditoría</p>
                </div>
                <button
                  onClick={() => handleSaveSysSettings({ ...sysSettings, photo_required_ab: !sysSettings.photo_required_ab })}
                  disabled={sysSettingsSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${sysSettings.photo_required_ab ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sysSettings.photo_required_ab ? "translate-x-6" : "translate-x-1"}`} />
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
            </CardContent>
          </Card>
        </TabsContent>


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
      <Dialog open={!!editEq} onOpenChange={() => setEditEq(null)}>
        <DialogContent data-testid="eq-edit-dialog">
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-tight">{t("admin.edit")} {t("admin.equipment")}</DialogTitle></DialogHeader>
          <div className="space-y-4"><div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("audit.description")}</Label><Input value={eqForm.descripcion || ""} onChange={e => setEqForm(f => ({ ...f, descripcion: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t("audit.brand")}</Label><Input value={eqForm.marca || ""} onChange={e => setEqForm(f => ({ ...f, marca: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t("audit.model")}</Label><Input value={eqForm.modelo || ""} onChange={e => setEqForm(f => ({ ...f, modelo: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t("audit.serial")}</Label><Input value={eqForm.serie || ""} onChange={e => setEqForm(f => ({ ...f, serie: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t("audit.cost")}</Label><Input type="number" value={eqForm.costo || ""} onChange={e => setEqForm(f => ({ ...f, costo: parseFloat(e.target.value) }))} /></div>
            <div className="space-y-2"><Label>Depreciación</Label><Input type="number" value={eqForm.depreciacion || ""} onChange={e => setEqForm(f => ({ ...f, depreciacion: parseFloat(e.target.value) }))} /></div>
          </div></div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setEditEq(null)}>{t("admin.cancel")}</Button><Button onClick={handleSaveEquipment} data-testid="eq-save">{t("admin.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <input type="file" accept=".xlsx" className="hidden" onChange={e => setMafFile(e.target.files[0] || null)} data-testid="maf-file-input" />
                </label>
                {mafFile && <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs shrink-0">Cargado</Badge>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Archivo USUARIOS.xlsx <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">{usersFile ? usersFile.name : "Seleccionar archivo USUARIOS.xlsx..."}</span>
                  <input type="file" accept=".xlsx" className="hidden" onChange={e => setUsersFile(e.target.files[0] || null)} data-testid="users-file-input" />
                </label>
                {usersFile && <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs shrink-0">Cargado</Badge>}
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

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setResetDialog(false); setMafFile(null); setUsersFile(null); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleResetData} disabled={resetLoading || !mafFile || !usersFile} data-testid="confirm-reset" className="gap-2">
              {resetLoading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <RotateCcw className="h-4 w-4" />}
              Reiniciar Datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
