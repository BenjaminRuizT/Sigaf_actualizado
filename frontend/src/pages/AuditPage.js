import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Scan, CheckCircle, AlertTriangle, XCircle, ArrowRightLeft, Trash2, ArrowLeft,
  FileCheck, Package, HelpCircle, StickyNote, ArrowUpDown, X, WifiOff, RefreshCw,
  CloudOff, Cloud, Camera, CameraOff, PlusCircle, Ban, TrendingDown, TrendingUp
} from "lucide-react";

const classColors = {
  localizado: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  sobrante: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  sobrante_desconocido: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  no_localizado: "bg-red-500/15 text-red-600 border-red-500/30",
};
const classIcons = { localizado: CheckCircle, sobrante: AlertTriangle, sobrante_desconocido: HelpCircle, no_localizado: XCircle };

function useSortable(defaultKey, defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);
  const toggle = (key) => { if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };
  const sorted = (items) => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
      if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  };
  const SortHeader = ({ col, children }) => (
    <button onClick={() => toggle(col)} className="flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap">
      {children} <ArrowUpDown className="h-3 w-3 opacity-40" />
    </button>
  );
  return { sorted, SortHeader };
}

// ── Barcode Scanner Component ──
// Approach A: Native BarcodeDetector (Chrome/Android/iOS 17+) — live continuous scan
// Approach B: Photo capture → backend Gemini Vision → reads number from label image
// Image never saved to device — processed in memory only, then discarded
function BarcodeScanner({ onDetected, onClose }) {
  const { api } = useAuth(); // get api directly inside component — no prop needed
  const [screen, setScreen] = useState("menu"); // menu | live | photo-cam | photo-preview | photo-processing
  const [liveError, setLiveError] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [photoError, setPhotoError] = useState(null);

  const videoRef = useRef(null);
  const liveStreamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const photoVideoRef = useRef(null);
  const photoStreamRef = useRef(null);
  const photoCaptured = useRef(null); // holds base64, not state to avoid re-render lag

  // ─── cleanup on unmount ───
  useEffect(() => {
    return () => { stopLive(); stopPhotoStream(); };
  }, []); // eslint-disable-line

  // ─── LIVE: BarcodeDetector ───
  async function startLive() {
    setLiveError(null);
    setScreen("live");
    if (!("BarcodeDetector" in window)) {
      setLiveError("Este navegador no tiene BarcodeDetector. Usa la opción Foto.");
      return;
    }
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const wanted = ["code_128","code_39","code_93","ean_13","ean_8","upc_a","upc_e","itf","qr_code","data_matrix","aztec","pdf417"];
      const formats = wanted.filter(f => supported.includes(f));
      detectorRef.current = new window.BarcodeDetector({ formats: formats.length ? formats : supported });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      liveStreamRef.current = stream;
    } catch (err) {
      setLiveError("Cámara no disponible: " + (err.message || "verifica permisos"));
    }
  }

  // videoRef callback — called when the video element mounts in the DOM
  const setVideoRef = useCallback((el) => {
    videoRef.current = el;
    if (el && liveStreamRef.current) {
      el.srcObject = liveStreamRef.current;
      el.play().then(() => { rafRef.current = requestAnimationFrame(liveFrame); }).catch(() => {});
    }
  }, []); // eslint-disable-line

  async function liveFrame() {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(liveFrame);
      return;
    }
    try {
      const results = await detector.detect(video);
      if (results.length > 0) {
        const code = results[0].rawValue.trim();
        stopLive();
        onDetected(code);
        return;
      }
    } catch {}
    rafRef.current = requestAnimationFrame(liveFrame);
  }

  function stopLive() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (liveStreamRef.current) { liveStreamRef.current.getTracks().forEach(t => t.stop()); liveStreamRef.current = null; }
  }

  // ─── PHOTO: camera → capture → Gemini ───
  async function startPhotoStream() {
    setPhotoError(null);
    setScreen("photo-cam");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      photoStreamRef.current = stream;
    } catch (err) {
      setPhotoError("Cámara no disponible: " + (err.message || "verifica permisos"));
    }
  }

  // photoVideoRef callback — called when video element mounts
  const setPhotoVideoRef = useCallback((el) => {
    photoVideoRef.current = el;
    if (el && photoStreamRef.current) {
      el.srcObject = photoStreamRef.current;
      el.play().catch(() => {});
    }
  }, []); // eslint-disable-line

  function stopPhotoStream() {
    if (photoStreamRef.current) { photoStreamRef.current.getTracks().forEach(t => t.stop()); photoStreamRef.current = null; }
  }

  function capturePhoto() {
    const video = photoVideoRef.current;
    if (!video || video.readyState < 2) return;
    // Draw to offscreen canvas — never touches device storage
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    // Free canvas from memory
    canvas.width = 0; canvas.height = 0;
    // Stop camera stream immediately — image is only in JS memory
    stopPhotoStream();
    photoCaptured.current = dataUrl;
    setPreviewSrc(dataUrl);
    setScreen("photo-preview");
  }

  async function analyzePhoto() {
    const imageData = photoCaptured.current;
    if (!imageData) return;
    setScreen("photo-processing");
    setPhotoError(null);
    try {
      const res = await api.post("/scan-image", { image_base64: imageData });
      // Discard image from memory
      photoCaptured.current = null;
      setPreviewSrc(null);
      onDetected(res.data.barcode);
    } catch (err) {
      photoCaptured.current = null;
      const d = err.response?.data?.detail;
      setPhotoError(typeof d === "string" ? d : "No se detectó número. Intenta con mejor iluminación y más cerca.");
      setPreviewSrc(null);
      setScreen("photo-cam");
      // Restart camera for retry
      startPhotoStream();
    }
  }

  // ─── SCREENS ───

  if (screen === "menu") {
    const hasDetector = "BarcodeDetector" in window;
    return (
      <div className="space-y-3 py-1">
        <p className="text-sm text-center text-muted-foreground font-medium">¿Cómo quieres capturar el código?</p>
        <div className="space-y-2">
          <button
            onClick={startLive}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${hasDetector ? "border-primary/30 hover:border-primary hover:bg-primary/5" : "border-muted opacity-60 cursor-not-allowed"}`}
            disabled={!hasDetector}
          >
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Scan className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Escaneo en vivo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasDetector ? "Apunta la cámara y el código se detecta solo" : "No disponible en este navegador"}
              </p>
            </div>
          </button>

          <button
            onClick={startPhotoStream}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500/30 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="h-11 w-11 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Camera className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Tomar foto de etiqueta</p>
              <p className="text-xs text-muted-foreground mt-0.5">La IA lee el número de la foto. Funciona en todos los dispositivos.</p>
            </div>
          </button>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
          <X className="h-4 w-4 mr-1" /> Cancelar
        </Button>
      </div>
    );
  }

  if (screen === "live") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button onClick={() => { stopLive(); setScreen("menu"); }} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Menú
          </button>
          <span className="text-xs font-semibold">Escaneo en vivo</span>
        </div>
        {liveError ? (
          <div className="space-y-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <CameraOff className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">{liveError}</p>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={startPhotoStream}>
              <Camera className="h-4 w-4" /> Usar modo foto
            </Button>
          </div>
        ) : liveStreamRef.current ? (
          <div className="relative rounded-xl overflow-hidden bg-black border border-primary/40" style={{ minHeight: 230 }}>
            <video
              ref={setVideoRef}
              className="w-full block"
              style={{ maxHeight: 280 }}
              playsInline muted autoPlay
            />
            {/* Scan area overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: "78%", height: "28%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)", borderRadius: 6, border: "2px solid rgba(99,102,241,0.9)" }}
              >
                {/* animated scan line */}
                <div className="absolute left-2 right-2 h-px bg-primary animate-bounce" style={{ top: "50%" }} />
              </div>
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/90 pointer-events-none">
              Centra el código de barras en el recuadro
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={() => { stopLive(); onClose(); }}>
          <X className="h-4 w-4 mr-1" /> Cancelar
        </Button>
      </div>
    );
  }

  if (screen === "photo-cam") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button onClick={() => { stopPhotoStream(); setScreen("menu"); }} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Menú
          </button>
          <span className="text-xs font-semibold">Tomar foto de etiqueta</span>
        </div>
        {photoError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{photoError}</div>
        )}
        {photoStreamRef.current ? (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden bg-black border" style={{ minHeight: 230 }}>
              <video
                ref={setPhotoVideoRef}
                className="w-full block"
                style={{ maxHeight: 300 }}
                playsInline muted autoPlay
              />
              {/* Guide frame for label positioning */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ width: "84%", height: "42%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)", borderRadius: 6, border: "2px solid rgba(234,179,8,0.9)" }}
                />
              </div>
              <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/90 pointer-events-none">
                Centra la etiqueta completa en el recuadro amarillo
              </p>
            </div>
            <Button className="w-full h-11 gap-2" onClick={capturePhoto}>
              <Camera className="h-5 w-5" /> Capturar foto
            </Button>
          </div>
        ) : !photoError && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={() => { stopPhotoStream(); onClose(); }}>
          <X className="h-4 w-4 mr-1" /> Cancelar
        </Button>
      </div>
    );
  }

  if (screen === "photo-preview") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => { setPreviewSrc(null); startPhotoStream(); }} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Repetir foto
          </button>
          <span className="text-xs font-semibold">Confirmar foto</span>
        </div>
        {previewSrc && (
          <img src={previewSrc} alt="Etiqueta" className="w-full rounded-xl border object-contain max-h-52" />
        )}
        <p className="text-xs text-muted-foreground text-center">
          ¿La etiqueta se ve clara y legible? Si es así, analizala.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-2" onClick={() => { setPreviewSrc(null); startPhotoStream(); }}>
            <Camera className="h-4 w-4" /> Nueva foto
          </Button>
          <Button className="gap-2" onClick={analyzePhoto}>
            <Scan className="h-4 w-4" /> Analizar
          </Button>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
          <X className="h-4 w-4 mr-1" /> Cancelar
        </Button>
      </div>
    );
  }

  if (screen === "photo-processing") {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="relative">
          <div className="animate-spin h-14 w-14 border-4 border-primary border-t-transparent rounded-full" />
          <Scan className="absolute inset-0 m-auto h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm">Analizando etiqueta...</p>
          <p className="text-xs text-muted-foreground mt-1">La IA está leyendo el número del código</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Photo capture component — camera only, no gallery ──
function PhotoCapture({ label, icon, onCapture, captured, testId }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [camError, setCamError] = useState(null);

  const startCam = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      }, 100);
    } catch {
      setCamError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopCam = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
    stopCam();
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 font-semibold">{icon}{label} <span className="text-red-500">*</span></Label>
      {captured ? (
        <div className="space-y-2">
          <img src={captured} alt="Foto capturada" className="max-h-40 mx-auto rounded object-contain border" />
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={startCam}>
            <Camera className="h-4 w-4" /> Volver a tomar foto
          </Button>
        </div>
      ) : !cameraOpen ? (
        <div>
          <Button variant="outline" className="w-full h-24 flex-col gap-2 border-dashed border-2" onClick={startCam} data-testid={`${testId}-open-cam`}>
            <Camera className="h-8 w-8 opacity-50" />
            <span className="text-sm">Tomar foto con cámara</span>
          </Button>
          {camError && <p className="text-xs text-red-500 mt-1">{camError}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden bg-black border" style={{ minHeight: 200 }}>
            <video ref={videoRef} className="w-full" style={{ maxHeight: 240, display: "block" }} playsInline muted autoPlay />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={stopCam}>Cancelar</Button>
            <Button className="flex-1 gap-2" onClick={capture} data-testid={`${testId}-capture`}>
              <Camera className="h-4 w-4" /> Capturar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const { auditId } = useParams();
  const { api } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const { isOnline, syncing, addToQueue, getQueueForAudit, syncQueue, removeFromQueue } = useOfflineSync(api);

  const [audit, setAudit] = useState(null);
  const [scans, setScans] = useState([]);
  const [storeEquipment, setStoreEquipment] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [flashClass, setFlashClass] = useState("");
  const [summary, setSummary] = useState(null);
  const [transferDialog, setTransferDialog] = useState(null);
  const [finalizeDialog, setFinalizeDialog] = useState(false);
  const [disposalDialog, setDisposalDialog] = useState(null);
  const [notesDialog, setNotesDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scans");
  const eqSort = useSortable("descripcion");
  const offlineQueue = getQueueForAudit(auditId);

  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Camera barcode scanner
  const [cameraActive, setCameraActive] = useState(false);

  // Unknown surplus
  const [unknownSurplusDialog, setUnknownSurplusDialog] = useState(null);
  const [unknownForm, setUnknownForm] = useState({ codigo_barras: "", descripcion: "", marca: "", modelo: "" });
  const [savingUnknown, setSavingUnknown] = useState(false);
  const unknownDescOptions = ["COMPUTADORA","LAPTOP","IMPRESORA","MONITOR","SERVIDOR","SWITCH","ROUTER","UPS","SCANNER","TABLET","PROYECTOR","TELEFONO IP","CAMARA","DVR/NVR","DISCO DURO EXTERNO","ACCESS POINT","IMPRESORA FISCAL","TECLADO/MOUSE","OTRO"];
  const unknownMarcaOptions = ["EPSON","HP","DELL","LENOVO","ACER","ASUS","SAMSUNG","LG","CISCO","BROTHER","CANON","ZEBRA","HONEYWELL","APC","TOSHIBA","APPLE","HUAWEI","OTRO"];

  // Photo state — camera only, required when there are movements
  const [photoDialog, setPhotoDialog] = useState(false);
  const [photoABCapture, setPhotoABCapture] = useState(null);
  const [photoTransfCapture, setPhotoTransfCapture] = useState(null);
  const [pendingFinalize, setPendingFinalize] = useState(null);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await api.get(`/audits/${auditId}`);
      setAudit(res.data);
      setNotes(res.data.notes || "");
      if (res.data.status !== "in_progress") {
        const sumRes = await api.get(`/audits/${auditId}/summary`);
        setSummary(sumRes.data);
      }
    } catch { toast.error(t("common.error")); }
  }, [api, auditId, t]);

  const fetchScans = useCallback(async () => {
    try { const res = await api.get(`/audits/${auditId}/scans`); setScans(res.data); } catch {}
  }, [api, auditId]);

  const fetchStoreEquipment = useCallback(async () => {
    if (!audit?.cr_tienda) return;
    try {
      const res = await api.get(`/stores/${audit.cr_tienda}/equipment`, { params: { limit: 1000 } });
      setStoreEquipment(res.data.equipment);
    } catch {}
  }, [api, audit?.cr_tienda]);

  useEffect(() => { Promise.all([fetchAudit(), fetchScans()]).finally(() => setLoading(false)); }, [fetchAudit, fetchScans]);
  useEffect(() => { if (audit?.cr_tienda) fetchStoreEquipment(); }, [audit?.cr_tienda, fetchStoreEquipment]);
  useEffect(() => { if (audit?.status === "in_progress" && inputRef.current && !cameraActive) inputRef.current.focus(); }, [audit, cameraActive]);

  useEffect(() => {
    if (isOnline && audit?.status === "in_progress" && offlineQueue.length > 0 && !syncing) {
      const handleSyncResult = (data) => {
        const { status, scan } = data;
        if (status !== "already_scanned" && scan) setScans(prev => [scan, ...prev]);
        if (status === "localizado") setAudit(p => p ? { ...p, located_count: (p.located_count || 0) + 1 } : p);
        else if (status === "sobrante" || status === "sobrante_desconocido") setAudit(p => p ? { ...p, surplus_count: (p.surplus_count || 0) + 1 } : p);
      };
      syncQueue(auditId, handleSyncResult);
    }
  }, [isOnline, audit?.status, offlineQueue.length, syncing, syncQueue, auditId]);

  // ── Scan Logic ──
  const performScan = useCallback(async (bc) => {
    if (!bc || scanning) return;
    setScanning(true);
    if (!navigator.onLine) {
      addToQueue(auditId, bc); setFlashClass("flash-warning");
      toast.info(`Escaneo guardado localmente: ${bc}`);
      setTimeout(() => setFlashClass(""), 600); setScanning(false);
      if (inputRef.current) inputRef.current.focus(); return;
    }
    try {
      const res = await api.post(`/audits/${auditId}/scan`, { barcode: bc });
      const { status, scan } = res.data;
      if (status !== "already_scanned") setScans(prev => [scan, ...prev]);
      if (status === "localizado") {
        setFlashClass("flash-success"); toast.success(`${t("audit.located")}: ${bc}`);
        setAudit(p => p ? { ...p, located_count: (p.located_count || 0) + 1 } : p);
      } else if (status === "sobrante") {
        setFlashClass("flash-warning"); toast.warning(`${t("audit.surplus")}: ${bc}`);
        setTransferDialog(scan); setAudit(p => p ? { ...p, surplus_count: (p.surplus_count || 0) + 1 } : p);
      } else if (status === "sobrante_desconocido") {
        setFlashClass("flash-error"); toast.warning(`${t("audit.surplusUnknown")}: ${bc}`);
        setAudit(p => p ? { ...p, surplus_count: (p.surplus_count || 0) + 1 } : p);
        // Open registration dialog immediately with the barcode
        setUnknownForm({ codigo_barras: bc, descripcion: "", marca: "", modelo: "" });
        setUnknownSurplusDialog(scan);
      } else if (status === "already_scanned") { toast.info(t("audit.alreadyScanned")); }
      setTimeout(() => setFlashClass(""), 600);
    } catch (err) {
      if (!err.response || err.response.status === 503) {
        addToQueue(auditId, bc); toast.info(`Sin conexión. Escaneo guardado: ${bc}`);
      } else { toast.error(err.response?.data?.detail || t("common.error")); }
    } finally {
      setScanning(false);
      if (inputRef.current && !cameraActive) inputRef.current.focus();
    }
  }, [scanning, api, auditId, t, addToQueue, cameraActive]);

  const handleScan = async () => { const bc = barcode.trim(); if (!bc) return; await performScan(bc); setBarcode(""); };

  const handleCameraDetected = useCallback(async (detectedBarcode) => {
    setCameraActive(false);
    setBarcode(detectedBarcode);
    await performScan(detectedBarcode);
    setBarcode("");
  }, [performScan]);

  const handleDeleteScan = async (scanId) => {
    try {
      await api.delete(`/audits/${auditId}/scans/${scanId}`);
      const deleted = scans.find(s => s.id === scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
      if (deleted?.classification === "localizado") setAudit(p => p ? { ...p, located_count: Math.max(0, (p.located_count || 0) - 1) } : p);
      else if (["sobrante","sobrante_desconocido"].includes(deleted?.classification)) setAudit(p => p ? { ...p, surplus_count: Math.max(0, (p.surplus_count || 0) - 1) } : p);
      toast.success("Escaneo eliminado");
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
  };

  const handleTransfer = async (scan) => {
    try {
      await api.post("/movements", { audit_id: auditId, equipment_id: scan.equipment_id, type: "transfer", from_cr_tienda: scan.origin_store?.cr_tienda, to_cr_tienda: audit.cr_tienda });
      toast.success(t("audit.confirmTransfer")); setTransferDialog(null);
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
  };

  const handleDisposal = async (scan) => {
    try {
      await api.post("/movements", { audit_id: auditId, equipment_id: scan.equipment_id, type: "baja", from_cr_tienda: audit.cr_tienda, to_cr_tienda: null });
      toast.success("Baja solicitada"); setDisposalDialog(null);
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
  };

  const handleRegisterUnknown = async () => {
    if (!unknownForm.descripcion || !unknownForm.marca || !unknownForm.modelo) {
      toast.error("Completa todos los campos obligatorios"); return;
    }
    setSavingUnknown(true);
    try {
      const res = await api.post(`/audits/${auditId}/register-unknown-surplus`, { ...unknownForm });
      const { equipment, movement } = res.data;
      // Update scan in local state — match by barcode only (classification may vary)
      setScans(prev => prev.map(s =>
        s.codigo_barras === unknownForm.codigo_barras
          ? { ...s, equipment_id: equipment.id, equipment_data: equipment, registered_manually: true, classification: "sobrante_desconocido" }
          : s
      ));
      toast.success(`Equipo registrado: ${equipment.descripcion} · ${equipment.marca} ${equipment.modelo}`);
      setUnknownSurplusDialog(null);
      setUnknownForm({ codigo_barras: "", descripcion: "", marca: "", modelo: "" });
    } catch (err) {
      // Handle FastAPI validation errors (array) and string errors
      const detail = err.response?.data?.detail;
      let msg = "Error al registrar el equipo";
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail)) msg = detail.map(d => d.msg || d.message || JSON.stringify(d)).join(", ");
      else if (err.message) msg = err.message;
      toast.error(msg);
    } finally {
      setSavingUnknown(false);
    }
  };

  const handleCancelAudit = async () => {
    if (!cancelReason.trim()) { toast.error("Debes ingresar el motivo de cancelación"); return; }
    setCancelling(true);
    try {
      await api.post(`/audits/${auditId}/cancel`, { reason: cancelReason.trim() });
      toast.success("Auditoría cancelada"); navigate("/");
    } catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
    finally { setCancelling(false); }
  };

  const handleFinalizeCheck = async () => {
    setFinalizeDialog(false);
    try {
      await api.post(`/audits/${auditId}/finalize`);
      const [auditRes, sumRes, scansRes] = await Promise.all([
        api.get(`/audits/${auditId}`), api.get(`/audits/${auditId}/summary`), api.get(`/audits/${auditId}/scans`),
      ]);
      setAudit(auditRes.data); setSummary(sumRes.data); setScans(scansRes.data);
      const movements = sumRes.data?.movements || [];
      const hasAB = movements.some(m => ["alta","baja","disposal"].includes(m.type));
      const hasTransf = movements.some(m => m.type === "transfer");
      if (hasAB || hasTransf) {
        setPendingFinalize({ hasAB, hasTransf });
        setPhotoABCapture(null);
        setPhotoTransfCapture(null);
        setPhotoDialog(true);
      } else {
        toast.success(t("audit.auditCompleted"));
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = "Error al finalizar la auditoría";
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail)) msg = detail.map(d => d.msg || JSON.stringify(d)).join(", ");
      toast.error(msg);
    }
  };

  const handleSaveNotes = async () => {
    try { await api.put(`/audits/${auditId}/notes`, { notes }); toast.success(t("common.success")); setNotesDialog(false); }
    catch (err) { toast.error(err.response?.data?.detail || t("common.error")); }
  };

  const handleSavePhotos = async () => {
    if (pendingFinalize?.hasAB && !photoABCapture) {
      toast.error("Debes tomar la foto del formato de ALTAS/BAJAS antes de continuar"); return;
    }
    if (pendingFinalize?.hasTransf && !photoTransfCapture) {
      toast.error("Debes tomar la foto del formato de TRANSFERENCIAS antes de continuar"); return;
    }
    try {
      const fd = new FormData();
      if (photoABCapture) {
        const res = await fetch(photoABCapture); const blob = await res.blob();
        fd.append("photo_ab", blob, "foto_ab.jpg");
      }
      if (photoTransfCapture) {
        const res = await fetch(photoTransfCapture); const blob = await res.blob();
        fd.append("photo_transf", blob, "foto_transf.jpg");
      }
      fd.append("audit_id", auditId);
      await api.post(`/audits/${auditId}/photos`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Fotos guardadas correctamente");
    } catch { toast.info("Fotos registradas"); }
    setPhotoDialog(false);
    toast.success(t("audit.auditCompleted"));
  };

  const fmtMoney = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isActive = audit?.status === "in_progress";
  const scannedBarcodes = new Set(scans.filter(s => s.scanned_by !== "system").map(s => s.codigo_barras));
  const locatedCount = audit?.located_count || 0;
  const totalEq = audit?.total_equipment || 0;
  const realTimeNotFound = Math.max(0, totalEq - locatedCount);
  const userScans = scans.filter(s => s.scanned_by !== "system");
  const unknownPendingScans = userScans.filter(s => s.classification === "sobrante_desconocido" && !s.registered_manually);

  return (
    <div className={`space-y-4 ${flashClass}`} data-testid="audit-page">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-tight truncate">{audit?.tienda}</h1>
          <p className="text-sm text-muted-foreground">CR: {audit?.cr_tienda} &middot; {audit?.plaza}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="icon" onClick={() => setNotesDialog(true)} title="Notas"><StickyNote className="h-4 w-4" /></Button>
          {isActive && (
            <Button variant="outline" size="sm" onClick={() => setCancelDialog(true)} className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
              <Ban className="h-4 w-4" /> Cancelar
            </Button>
          )}
          <Badge variant="outline" className={`text-xs ${isActive ? "bg-blue-500/15 text-blue-600 border-blue-500/30" : audit?.status === "cancelada" ? "bg-red-500/15 text-red-600 border-red-500/30" : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"}`}>
            {isActive ? t("dashboard.inProgress") : audit?.status === "cancelada" ? "CANCELADA" : t("audit.auditCompleted")}
          </Badge>
        </div>
      </div>

      {audit?.status === "cancelada" && audit?.cancel_reason && (
        <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-3 flex items-center gap-3">
          <Ban className="h-5 w-5 text-red-500 shrink-0" />
          <div><p className="text-sm font-medium text-red-600">Auditoría cancelada</p><p className="text-xs text-muted-foreground">Motivo: {audit.cancel_reason}</p></div>
        </CardContent></Card>
      )}

      {/* Scanner Input */}
      {isActive && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input ref={inputRef} value={barcode} onChange={e => setBarcode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder={t("audit.enterBarcode")} className="pl-11 h-14 text-lg font-mono"
                  data-testid="barcode-input" autoComplete="off" />
              </div>
              <Button onClick={handleScan} disabled={scanning || !barcode.trim()} className="h-14 px-6"><Scan className="h-5 w-5" /></Button>
              <Button
                variant={cameraActive ? "destructive" : "outline"}
                className="h-14 px-4"
                onClick={() => setCameraActive(v => !v)}
                title={cameraActive ? "Cerrar cámara" : "Escanear con cámara"}
              >
                {cameraActive ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </Button>
            </div>
            {cameraActive && (
              <BarcodeScanner
                onDetected={handleCameraDetected}
                onClose={() => setCameraActive(false)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Offline/Sync Banners */}
      {isActive && !isOnline && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-3 flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1"><p className="text-sm font-medium text-amber-700">Modo sin conexión</p><p className="text-xs text-amber-600/80">Los escaneos se guardarán localmente y se sincronizarán al recuperar la conexión</p></div>
            {offlineQueue.length > 0 && <Badge variant="outline" className="bg-amber-500/20 text-amber-700 border-amber-500/40">{offlineQueue.length} pendiente{offlineQueue.length > 1 ? "s" : ""}</Badge>}
          </CardContent>
        </Card>
      )}
      {isActive && syncing && (
        <Card className="border-blue-500/50 bg-blue-500/10"><CardContent className="p-3 flex items-center gap-3"><RefreshCw className="h-5 w-5 text-blue-600 animate-spin shrink-0" /><p className="text-sm font-medium text-blue-700">Sincronizando escaneos pendientes...</p></CardContent></Card>
      )}
      {isActive && offlineQueue.length > 0 && !syncing && isOnline && (
        <Card className="border-blue-500/30"><CardContent className="p-3 flex items-center gap-3">
          <Cloud className="h-5 w-5 text-blue-500 shrink-0" />
          <div className="flex-1"><p className="text-sm font-medium">{offlineQueue.length} escaneo(s) pendiente(s) de sincronizar</p></div>
          <Button size="sm" variant="outline" onClick={() => syncQueue(auditId, (data) => {
            const { status, scan } = data;
            if (status !== "already_scanned" && scan) setScans(prev => [scan, ...prev]);
            if (status === "localizado") setAudit(p => p ? { ...p, located_count: (p.located_count || 0) + 1 } : p);
            else if (status === "sobrante" || status === "sobrante_desconocido") setAudit(p => p ? { ...p, surplus_count: (p.surplus_count || 0) + 1 } : p);
          })}><RefreshCw className="h-4 w-4 mr-1" /> Sincronizar</Button>
        </CardContent></Card>
      )}

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center"><CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" /><p className="font-mono text-2xl font-bold">{locatedCount}</p><p className="text-xs text-muted-foreground uppercase tracking-wider">{t("audit.located")}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" /><p className="font-mono text-2xl font-bold">{audit?.surplus_count || 0}</p><p className="text-xs text-muted-foreground uppercase tracking-wider">{t("audit.surplus")}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" /><p className="font-mono text-2xl font-bold">{isActive ? realTimeNotFound : (audit?.not_found_count || 0)}</p><p className="text-xs text-muted-foreground uppercase tracking-wider">{t("audit.notFound")}</p></CardContent></Card>
      </div>

      {/* Unknown surplus pending alert */}
      {isActive && unknownPendingScans.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/10">
          <CardContent className="p-3">
            <p className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              {unknownPendingScans.length} equipo(s) sobrante(s) desconocido(s) pendiente(s) de registrar
            </p>
            <div className="mt-2 space-y-1">
              {unknownPendingScans.map(scan => (
                <div key={scan.id} className="flex items-center justify-between bg-orange-500/10 rounded px-2 py-1">
                  <span className="font-mono text-xs text-orange-700">{scan.codigo_barras}</span>
                  <Button size="sm" variant="outline" className="h-6 text-xs gap-1 border-orange-400"
                    onClick={() => { setUnknownForm({ codigo_barras: scan.codigo_barras, descripcion: "", marca: "", modelo: "" }); setUnknownSurplusDialog(scan); }}>
                    <PlusCircle className="h-3 w-3" /> Registrar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Audit Tabs */}
      {isActive && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <TabsList>
              <TabsTrigger value="scans">{t("audit.scanHistory")} ({userScans.length + offlineQueue.length})</TabsTrigger>
              <TabsTrigger value="equipment">{t("audit.storeEquipment")} ({totalEq})</TabsTrigger>
            </TabsList>
            <Button variant="destructive" size="sm" onClick={() => setFinalizeDialog(true)} data-testid="finalize-btn" className="gap-2">
              <FileCheck className="h-4 w-4" /> {t("audit.finalize")}
            </Button>
          </div>
          <TabsContent value="scans">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {offlineQueue.map((entry) => (
                  <Card key={entry.id} className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-3 flex items-center gap-3">
                      <CloudOff className="h-5 w-5 shrink-0 text-amber-500" />
                      <div className="flex-1 min-w-0"><p className="font-mono text-sm font-medium">{entry.barcode}</p><p className="text-xs text-amber-600">Pendiente de sincronización</p></div>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30">Offline</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromQueue(entry.id)}><X className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                    </CardContent>
                  </Card>
                ))}
                {userScans.map((scan, i) => {
                  const Icon = classIcons[scan.classification] || Package;
                  return (
                    <Card key={scan.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i,5)*30}ms` }}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Icon className={`h-5 w-5 shrink-0 ${scan.classification==="localizado"?"text-emerald-500":scan.classification==="sobrante"?"text-amber-500":"text-orange-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-medium">{scan.codigo_barras}</p>
                          {scan.registered_manually && scan.equipment_data ? (
                            <p className="text-xs text-emerald-600 font-medium">
                              ✓ {scan.equipment_data.descripcion} · {scan.equipment_data.marca} {scan.equipment_data.modelo}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground truncate">
                              {scan.equipment_data?.descripcion || (scan.classification === "sobrante_desconocido" ? "Pendiente de registrar" : "—")}
                              {scan.equipment_data?.marca ? ` · ${scan.equipment_data.marca}` : ""}
                            </p>
                          )}
                        </div>
                        <Badge className={`text-[10px] ${classColors[scan.classification]||""}`}>
                          {scan.classification==="localizado"?t("audit.located"):scan.classification==="sobrante"?t("audit.surplus"):t("audit.surplusUnknown")}
                        </Badge>
                        {scan.classification==="sobrante" && (
                          <Button variant="outline" size="sm" onClick={()=>setTransferDialog(scan)}><ArrowRightLeft className="h-3.5 w-3.5"/></Button>
                        )}
                        {scan.classification==="sobrante_desconocido" && !scan.registered_manually && (
                          <Button variant="outline" size="sm" className="border-orange-400"
                            onClick={()=>{setUnknownForm({codigo_barras:scan.codigo_barras,descripcion:"",marca:"",modelo:""});setUnknownSurplusDialog(scan);}}>
                            <PlusCircle className="h-3.5 w-3.5"/>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>handleDeleteScan(scan.id)}><X className="h-3.5 w-3.5 text-muted-foreground"/></Button>
                      </CardContent>
                    </Card>
                  );
                })}
                {userScans.length===0&&offlineQueue.length===0&&(
                  <div className="text-center py-8 text-muted-foreground"><Scan className="h-10 w-10 mx-auto mb-2 opacity-30"/><p className="text-sm">{t("audit.scanOrType")}</p></div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="equipment">
            <div className="rounded-md border overflow-x-auto">
              <Table style={{ minWidth: 750 }}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 whitespace-nowrap">Estado</TableHead>
                    <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="codigo_barras">{t("audit.barcode")}</eqSort.SortHeader></TableHead>
                    <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="descripcion">{t("audit.description")}</eqSort.SortHeader></TableHead>
                    <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="marca">{t("audit.brand")}</eqSort.SortHeader></TableHead>
                    <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="modelo">{t("audit.model")}</eqSort.SortHeader></TableHead>
                    <TableHead className="whitespace-nowrap"><eqSort.SortHeader col="serie">Serie</eqSort.SortHeader></TableHead>
                    <TableHead className="text-right whitespace-nowrap"><eqSort.SortHeader col="valor_real">{t("audit.realValue")}</eqSort.SortHeader></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eqSort.sorted(storeEquipment).map(eq => {
                    const isScanned = scannedBarcodes.has(eq.codigo_barras);
                    return (
                      <TableRow key={eq.id} className={isScanned?"bg-emerald-500/5":""}>
                        <TableCell className="sticky left-0 bg-background z-10">{isScanned?<CheckCircle className="h-4 w-4 text-emerald-500"/>:<span className="text-muted-foreground text-xs">—</span>}</TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{eq.codigo_barras}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{eq.descripcion}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{eq.marca}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{eq.modelo}</TableCell>
                        <TableCell className="text-sm font-mono text-xs whitespace-nowrap">{eq.serie}</TableCell>
                        <TableCell className="text-right font-mono text-sm whitespace-nowrap">{fmtMoney(eq.valor_real)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Completed Audit Summary */}
      {!isActive && summary && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">{t("audit.summary")}</TabsTrigger>
            <TabsTrigger value="notfound">{t("audit.notFound")} ({summary.stats?.not_found_count||0})</TabsTrigger>
            <TabsTrigger value="surplus">{t("audit.surplus")} ({summary.stats?.surplus_count||0})</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground uppercase">{t("audit.equipment")}</p><p className="font-mono text-2xl font-bold">{summary.stats?.total_equipment||0}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground uppercase">{t("audit.located")}</p><p className="font-mono text-2xl font-bold text-emerald-500">{summary.stats?.located_count||0}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground uppercase">{t("audit.surplus")}</p><p className="font-mono text-2xl font-bold text-amber-500">{summary.stats?.surplus_count||0}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground uppercase">{t("audit.notFound")}</p><p className="font-mono text-2xl font-bold text-red-500">{summary.stats?.not_found_count||0}</p></CardContent></Card>
            </div>
            <Card className="mt-4"><CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("audit.notFoundValue")}</span><span className="font-mono font-bold text-red-500">{fmtMoney(summary.stats?.not_found_value)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("audit.deprecatedNotFound")}</span><span className="font-mono font-bold">{summary.stats?.not_found_deprecated||0}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("audit.movementsPending")}</span><span className="font-mono font-bold">{summary.stats?.movements_count||0}</span></div>
            </CardContent></Card>
            <Button className="mt-4" onClick={()=>navigate("/")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("audit.backToDashboard")}</Button>
          </TabsContent>
          <TabsContent value="notfound">
            <div className="rounded-md border overflow-x-auto">
              <Table style={{ minWidth: 680 }}>
                <TableHeader><TableRow>
                  <TableHead className="whitespace-nowrap">{t("audit.barcode")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.description")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.brand")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.model")}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("audit.realValue")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.deprecated")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("common.actions")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(summary.not_found||[]).map(scan=>{const eq=scan.equipment_data||{};return(
                    <TableRow key={scan.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{scan.codigo_barras}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{eq.descripcion}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{eq.marca}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{eq.modelo}</TableCell>
                      <TableCell className="text-right font-mono text-sm whitespace-nowrap">{fmtMoney(eq.valor_real)}</TableCell>
                      <TableCell><Badge variant={eq.depreciado?"destructive":"outline"} className="text-[10px]">{eq.depreciado?t("audit.deprecated"):t("audit.activeAsset")}</Badge></TableCell>
                      <TableCell>{eq.depreciado&&<Button variant="outline" size="sm" onClick={()=>setDisposalDialog(scan)}><Trash2 className="h-3.5 w-3.5 mr-1"/>{t("audit.disposal")}</Button>}</TableCell>
                    </TableRow>);})}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="surplus">
            <div className="rounded-md border overflow-x-auto">
              <Table style={{ minWidth: 600 }}>
                <TableHeader><TableRow>
                  <TableHead className="whitespace-nowrap">{t("audit.barcode")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.description")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.brand")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.model")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.originStore")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.classification")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(summary.surplus||[]).map(scan=>{const eq=scan.equipment_data||{};return(
                    <TableRow key={scan.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{scan.codigo_barras}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{eq.descripcion||"—"}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{eq.marca||"—"}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{eq.modelo||"—"}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{scan.origin_store?.tienda||"—"}</TableCell>
                      <TableCell><Badge className={classColors[scan.classification]||""}>{scan.classification==="sobrante"?t("audit.surplus"):t("audit.surplusUnknown")}</Badge></TableCell>
                    </TableRow>);})}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* ── DIALOGS ── */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-tight text-red-600">Cancelar Auditoría</DialogTitle><DialogDescription>Indica el motivo de cancelación para que quede registrado.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted rounded-lg p-3 space-y-1"><p className="text-xs text-muted-foreground uppercase">Auditoría</p><p className="text-sm font-medium">{audit?.tienda}</p><p className="text-xs text-muted-foreground">CR: {audit?.cr_tienda} · {audit?.plaza}</p></div>
            <div className="space-y-1.5">
              <Label>Motivo de cancelación <span className="text-red-500">*</span></Label>
              <Textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Describe el motivo de cancelación..." rows={3}/>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={()=>{setCancelDialog(false);setCancelReason("");}} disabled={cancelling}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleCancelAudit} disabled={cancelling||!cancelReason.trim()} className="gap-2"><Ban className="h-4 w-4"/>{cancelling?"Cancelando...":"Cancelar Auditoría"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!transferDialog} onOpenChange={()=>setTransferDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-tight">{t("audit.transfer")}</DialogTitle><DialogDescription>{t("audit.confirmTransfer")}</DialogDescription></DialogHeader>
          {transferDialog&&(<div className="space-y-3"><div className="bg-muted rounded-lg p-3 space-y-1.5"><p className="text-xs text-muted-foreground uppercase">{t("audit.equipmentData")}</p><p className="font-mono text-sm">{transferDialog.codigo_barras}</p><p className="text-sm">{transferDialog.equipment_data?.descripcion} &middot; {transferDialog.equipment_data?.marca}</p></div><div className="flex items-center gap-3"><div className="flex-1 bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground uppercase">{t("audit.originStore")}</p><p className="text-sm font-medium mt-1">{transferDialog.origin_store?.tienda}</p></div><ArrowRightLeft className="h-5 w-5 text-primary shrink-0"/><div className="flex-1 bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground uppercase">{t("audit.destinationStore")}</p><p className="text-sm font-medium mt-1">{audit?.tienda}</p></div></div></div>)}
          <DialogFooter className="gap-2"><Button variant="outline" onClick={()=>setTransferDialog(null)}>{t("common.cancel")}</Button><Button onClick={()=>handleTransfer(transferDialog)} className="gap-2"><ArrowRightLeft className="h-4 w-4"/>{t("audit.confirmTransfer")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!unknownSurplusDialog} onOpenChange={(open) => { if (!open && !savingUnknown) setUnknownSurplusDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-tight flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-orange-500"/>Sobrante Desconocido — Registrar ALTA
            </DialogTitle>
            <DialogDescription>Este equipo no está en el MAF. Registra sus datos para catalogarlo como ALTA en {audit?.tienda}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase mb-0.5">Código de barras detectado</p>
              <p className="font-mono text-sm font-bold text-orange-600">{unknownForm.codigo_barras}</p>
            </div>
            <div className="space-y-1.5"><Label>Código de barras <span className="text-red-500">*</span></Label>
              <Input value={unknownForm.codigo_barras} onChange={e=>setUnknownForm(f=>({...f,codigo_barras:e.target.value}))} placeholder="Código de barras"/>
            </div>
            <div className="space-y-1.5"><Label>Descripción del equipo <span className="text-red-500">*</span></Label>
              <Select value={unknownForm.descripcion} onValueChange={v=>setUnknownForm(f=>({...f,descripcion:v}))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo de equipo..."/></SelectTrigger>
                <SelectContent>{unknownDescOptions.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Marca <span className="text-red-500">*</span></Label>
              <Select value={unknownForm.marca} onValueChange={v=>setUnknownForm(f=>({...f,marca:v}))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar marca..."/></SelectTrigger>
                <SelectContent>{unknownMarcaOptions.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Modelo <span className="text-red-500">*</span></Label>
              <Input value={unknownForm.modelo} onChange={e=>setUnknownForm(f=>({...f,modelo:e.target.value}))} placeholder="Ej. FX890II, LaserJet Pro..."/>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={()=>setUnknownSurplusDialog(null)} disabled={savingUnknown}>{t("common.cancel")}</Button>
            <Button onClick={handleRegisterUnknown} disabled={savingUnknown} className="gap-2">
              <TrendingUp className="h-4 w-4"/>{savingUnknown ? "Registrando..." : "Registrar como ALTA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalizeDialog} onOpenChange={setFinalizeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-tight">{t("audit.finalize")}</DialogTitle><DialogDescription>{t("audit.finalizeWarning")}</DialogDescription></DialogHeader>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm">{t("audit.scanned")}: <span className="font-mono font-bold">{userScans.length}</span></p>
            <p className="text-sm">{t("audit.equipment")}: <span className="font-mono font-bold">{totalEq}</span></p>
            <p className="text-sm text-amber-600">{t("audit.notFound")}: <span className="font-mono font-bold">{realTimeNotFound}</span></p>
            {realTimeNotFound>0&&<p className="text-xs text-muted-foreground">Los equipos no localizados serán dados de BAJA automáticamente.</p>}
            {unknownPendingScans.length > 0 && (
              <p className="text-sm text-orange-600 font-medium">⚠ {unknownPendingScans.length} sobrante(s) desconocido(s) sin registrar. Puedes finalizar igualmente.</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={()=>setFinalizeDialog(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleFinalizeCheck} className="gap-2"><FileCheck className="h-4 w-4"/>{t("audit.finalize")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!disposalDialog} onOpenChange={()=>setDisposalDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-tight">{t("audit.requestDisposal")}</DialogTitle></DialogHeader>
          {disposalDialog&&(<div className="bg-muted rounded-lg p-3 space-y-1.5"><p className="font-mono text-sm">{disposalDialog.codigo_barras}</p><p className="text-sm">{disposalDialog.equipment_data?.descripcion}</p><p className="text-sm text-muted-foreground">{t("audit.realValue")}: {fmtMoney(disposalDialog.equipment_data?.valor_real)}</p></div>)}
          <DialogFooter className="gap-2"><Button variant="outline" onClick={()=>setDisposalDialog(null)}>{t("common.cancel")}</Button><Button variant="destructive" onClick={()=>handleDisposal(disposalDialog)} className="gap-2"><TrendingDown className="h-4 w-4"/>{t("audit.requestDisposal")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notesDialog} onOpenChange={setNotesDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-tight">Notas de Auditoría</DialogTitle></DialogHeader>
          <Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Agregue notas sobre la auditoría..." rows={5}/>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={()=>setNotesDialog(false)}>{t("common.cancel")}</Button><Button onClick={handleSaveNotes}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo dialog — camera only, required */}
      <Dialog open={photoDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg" data-testid="photo-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-tight flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" /> Foto de Formato de Movimiento
            </DialogTitle>
            <DialogDescription>
              Es <strong>obligatorio</strong> tomar foto del formato de movimiento de activo para poder finalizar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {pendingFinalize?.hasAB && (
              <PhotoCapture
                label="Formato ALTAS y/o BAJAS"
                icon={<><TrendingUp className="h-4 w-4 text-emerald-500"/><TrendingDown className="h-4 w-4 text-red-500"/></>}
                onCapture={setPhotoABCapture}
                captured={photoABCapture}
                testId="photo-ab"
              />
            )}
            {pendingFinalize?.hasTransf && (
              <PhotoCapture
                label="Formato TRANSFERENCIAS"
                icon={<ArrowRightLeft className="h-4 w-4 text-blue-500"/>}
                onCapture={setPhotoTransfCapture}
                captured={photoTransfCapture}
                testId="photo-transf"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleSavePhotos}
              className="w-full gap-2"
              disabled={(pendingFinalize?.hasAB && !photoABCapture) || (pendingFinalize?.hasTransf && !photoTransfCapture)}
            >
              <Camera className="h-4 w-4" /> Guardar Fotos y Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
