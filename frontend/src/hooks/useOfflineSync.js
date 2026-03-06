import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const QUEUE_KEY = "sigaf_offline_scan_queue";

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineSync(api) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScans, setPendingScans] = useState(getQueue());
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => {
      setIsOnline(false);
      toast.warning("Sin conexión a internet. Los escaneos se guardarán localmente.");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const addToQueue = useCallback((auditId, barcode) => {
    const entry = {
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      audit_id: auditId,
      barcode,
      queued_at: new Date().toISOString(),
    };
    const updated = [...getQueue(), entry];
    setQueue(updated);
    setPendingScans(updated);
    return entry;
  }, []);

  const removeFromQueue = useCallback((entryId) => {
    const updated = getQueue().filter((e) => e.id !== entryId);
    setQueue(updated);
    setPendingScans(updated);
  }, []);

  const syncQueue = useCallback(
    async (auditId, onScanResult) => {
      if (syncingRef.current) return;
      const queue = getQueue().filter((e) => e.audit_id === auditId);
      if (queue.length === 0) return;

      syncingRef.current = true;
      setSyncing(true);
      toast.info(`Sincronizando ${queue.length} escaneo(s) pendiente(s)...`);

      let successCount = 0;
      let failCount = 0;

      for (const entry of queue) {
        try {
          const res = await api.post(`/audits/${entry.audit_id}/scan`, {
            barcode: entry.barcode,
          });
          removeFromQueue(entry.id);
          successCount++;
          if (onScanResult) onScanResult(res.data);
        } catch (err) {
          if (err.response) {
            // Server responded (e.g. already scanned) - remove from queue
            removeFromQueue(entry.id);
            failCount++;
          }
          // Network error - keep in queue for next sync attempt
        }
      }

      syncingRef.current = false;
      setSyncing(false);

      if (successCount > 0) {
        toast.success(`${successCount} escaneo(s) sincronizado(s) correctamente`);
      }
      if (failCount > 0) {
        toast.warning(`${failCount} escaneo(s) ya procesado(s) o con error`);
      }
    },
    [api, removeFromQueue]
  );

  const getQueueForAudit = useCallback(
    (auditId) => {
      return pendingScans.filter((e) => e.audit_id === auditId);
    },
    [pendingScans]
  );

  const clearQueueForAudit = useCallback((auditId) => {
    const updated = getQueue().filter((e) => e.audit_id !== auditId);
    setQueue(updated);
    setPendingScans(updated);
  }, []);

  return {
    isOnline,
    pendingScans,
    syncing,
    addToQueue,
    removeFromQueue,
    syncQueue,
    getQueueForAudit,
    clearQueueForAudit,
  };
}
