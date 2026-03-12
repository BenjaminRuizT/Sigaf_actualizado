import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// ── Service Worker: registration + update detection ───────────────────────────
// How it works:
//   1. Each new deploy changes sw.js (at minimum the CACHE_NAME changes).
//   2. The browser detects the byte difference and installs the new SW.
//   3. The new SW does NOT call skipWaiting() — it waits.
//   4. reg.waiting becomes truthy → we dispatch 'sw-update-available'.
//   5. UpdateBanner appears. User clicks "Recargar".
//   6. We send SKIP_WAITING to the waiting SW.
//   7. The new SW activates (controllerchange fires) → page reloads automatically.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      const notifyUpdate = () =>
        window.dispatchEvent(new CustomEvent('sw-update-available', { detail: { reg } }));

      // A new SW might already be waiting when the page loads (e.g. the user
      // had the tab open while the deploy happened and then refreshed).
      if (reg.waiting) {
        notifyUpdate();
      }

      // A new SW starts installing while the page is open.
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          // 'installed' + an existing controller = a new version is waiting.
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdate();
          }
        });
      });

      // After the user clicks "Recargar", we send SKIP_WAITING.
      // The new SW activates, controllerchange fires, and we reload.
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
          reloading = true;
          window.location.reload();
        }
      });

      // Poll for updates every 60 s (catches deploys that happen while the tab is idle).
      setInterval(() => reg.update(), 60_000);

    } catch (err) {
      console.warn('SW registration failed:', err);
    }
  });
}
