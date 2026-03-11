import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, Send, CheckCircle, Clock } from "lucide-react";
import axios from "axios";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginForce, token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Locked account state
  const [lockedState, setLockedState] = useState(null);
  const [unlockView, setUnlockView] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [unlockSent, setUnlockSent] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Session conflict state
  const [sessionConflict, setSessionConflict] = useState(null); // { sessions, email, password }
  const [forceLoading, setForceLoading] = useState(false);

  if (token) { navigate("/", { replace: true }); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLockedState(null);
    setSessionConflict(null);
    try {
      await login(email, password);
      toast.success(t("auth.welcome") + "!");
      navigate("/");
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      // HTTP 409 = sesión activa detectada
      if (status === 409 && typeof detail === "object" && detail?.code === "SESSION_CONFLICT") {
        setSessionConflict({
          sessions: detail.active_sessions || [],
          email,
          password,
        });
      // HTTP 403 with code=ACCOUNT_LOCKED means the account is blocked
      } else if (status === 403 && typeof detail === "object" && detail?.code === "ACCOUNT_LOCKED") {
        setLockedState({
          userId: detail.user_id,
          email: detail.email || email,
          remainingMinutes: detail.remaining_minutes || 30,
          unlockRequested: detail.unlock_requested || false,
        });
        setUnlockView(false);
        setUnlockSent(detail.unlock_requested || false);
      } else {
        const msg = typeof detail === "string" ? detail : t("auth.invalidCredentials");
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUnlock = async () => {
    if (!lockedState?.email) return;
    setUnlockLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/request-unlock`, {
        email: lockedState.email,
        reason: unlockReason.trim() || undefined,
      });
      toast.success("Solicitud enviada. Un administrador la revisará pronto.");
      setLockedState(null);
      setUnlockView(false);
      setUnlockSent(false);
      setUnlockReason("");
    } catch {
      toast.error("No se pudo enviar la solicitud. Intenta de nuevo.");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleForceLogin = async () => {
    if (!sessionConflict) return;
    setForceLoading(true);
    try {
      await loginForce(sessionConflict.email, sessionConflict.password);
      toast.success(t("auth.welcome") + "!");
      navigate("/");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Error al iniciar sesión");
      setSessionConflict(null);
    } finally {
      setForceLoading(false);
    }
  };

  // ── Vista: conflicto de sesión ──────────────────────────────────────────────
  if (sessionConflict) {
    const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—";
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-amber-500/10">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">SIGAF</h1>
          </div>
          <Card className="border-amber-500/30 shadow-lg">
            <CardHeader className="pb-2">
              <h2 className="font-heading font-bold uppercase tracking-tight text-amber-600 text-lg">Sesión activa detectada</h2>
              <p className="text-sm text-muted-foreground">
                Ya existe {sessionConflict.sessions.length === 1 ? "una sesión activa" : `${sessionConflict.sessions.length} sesiones activas`} con este usuario. Solo se permite una sesión simultánea.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Detalle de sesiones activas */}
              <div className="space-y-2">
                {sessionConflict.sessions.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Sesión {i + 1}</p>
                      <p className="text-xs text-muted-foreground">Iniciada: {fmtDate(s.created_at)}</p>
                      <p className="text-xs text-muted-foreground">Último acceso: {fmtDate(s.last_seen)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Si cierras {sessionConflict.sessions.length === 1 ? "la sesión activa" : "las sesiones activas"}, el usuario que la tiene abierta perderá el acceso inmediatamente.
              </p>
              {/* Acciones */}
              <div className="space-y-2 pt-1">
                <Button className="w-full gap-2" onClick={handleForceLogin} disabled={forceLoading}>
                  {forceLoading
                    ? <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    : <Lock className="h-4 w-4" />}
                  Cerrar sesión{sessionConflict.sessions.length > 1 ? "es" : ""} activa{sessionConflict.sessions.length > 1 ? "s" : ""} e iniciar
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setSessionConflict(null)}>
                  Cancelar — regresar al inicio de sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (lockedState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-red-500/10">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">SIGAF</h1>
          </div>
          <Card className="border-red-500/30 shadow-lg">
            <CardHeader className="pb-3">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-red-600 text-center">
                Cuenta Bloqueada
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {!unlockView ? (
                <>
                  <div className="bg-red-500/8 border border-red-500/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                      <Lock className="h-4 w-4 shrink-0" />
                      Tu cuenta fue bloqueada por múltiples intentos fallidos.
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Desbloqueo automático en aproximadamente {lockedState.remainingMinutes} minuto{lockedState.remainingMinutes !== 1 ? "s" : ""}.
                    </div>
                    <p className="text-xs font-mono text-muted-foreground pt-1">{lockedState.email}</p>
                  </div>
                  {unlockSent ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Solicitud enviada</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Un administrador revisará tu solicitud pronto. También puedes esperar el desbloqueo automático.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="w-full flex items-center justify-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      onClick={() => setUnlockView(true)}
                    >
                      <Send className="h-4 w-4" /> Solicitar desbloqueo al administrador
                    </button>
                  )}
                  <button
                    className="w-full text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                    onClick={() => setLockedState(null)}
                  >
                    ← Volver al inicio de sesión
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Tu solicitud será enviada al administrador del sistema para revisión manual.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="unlock-reason">Motivo (opcional)</Label>
                    <textarea
                      id="unlock-reason"
                      value={unlockReason}
                      onChange={e => setUnlockReason(e.target.value)}
                      placeholder="Ej: Olvidé mi contraseña, error al escribir..."
                      rows={3}
                      maxLength={300}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">{unlockReason.length}/300</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setUnlockView(false)} disabled={unlockLoading}>
                      Cancelar
                    </Button>
                    <Button className="flex-1 gap-2" onClick={handleRequestUnlock} disabled={unlockLoading}>
                      {unlockLoading
                        ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                        : <Send className="h-4 w-4" />}
                      Enviar solicitud
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-6">{t("app.fullName")} &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/G%3E%3C/svg%3E\")"
      }} />
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-primary">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight" data-testid="login-title">SIGAF</h1>
          <p className="text-sm text-muted-foreground mt-2">{t("app.fullName")}</p>
        </div>
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <h2 className="font-heading text-xl font-semibold uppercase tracking-tight text-center">{t("auth.login")}</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="usuario@empresa.com" value={email}
                    onChange={e => setEmail(e.target.value)} className="pl-10 h-11" required
                    data-testid="login-email-input" autoComplete="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} className="pl-10 pr-10 h-11" required
                    data-testid="login-password-input" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="toggle-password-visibility">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 font-semibold uppercase tracking-wider text-sm" disabled={loading}
                data-testid="login-submit-btn">
                {loading ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> : t("auth.signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">{t("app.fullName")} &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
