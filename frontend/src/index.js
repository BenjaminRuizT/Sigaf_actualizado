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

// ── Service Worker registration + version-based update detection ─────────────
// SW_VERSION must match SW_VERSION constant in public/sw.js
const EXPECTED_SW_VERSION = '5.0';
const SW_VERSION_KEY = 'sigaf_sw_version'; // localStorage — survives reloads

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      // Poll for updates every 60s
      setInterval(() => { reg.update(); }, 60_000);

      // Ask the active SW for its version
      const askVersion = () => {
        const sw = reg.active || navigator.serviceWorker.controller;
        if (sw) sw.postMessage({ type: 'GET_VERSION' });
      };

      // Handle version reply from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_VERSION') {
          const swVersion = event.data.version;
          const lastKnown = localStorage.getItem(SW_VERSION_KEY);
          if (lastKnown && lastKnown !== swVersion) {
            // Different version than what user last saw → show update banner
            window.dispatchEvent(new CustomEvent('sw-update-available'));
          }
          // Always save current version
          localStorage.setItem(SW_VERSION_KEY, swVersion);
        }
      });

      // Method A: new SW is in waiting state
      if (reg.waiting) {
        window.dispatchEvent(new CustomEvent('sw-update-available'));
      }
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (nw) {
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });

      // Method B: controller changed (new SW took over after skipWaiting)
      // Save the OLD version before reloading so next load can compare
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
          reloading = true;
          // Clear stored version so next load detects the change
          localStorage.removeItem(SW_VERSION_KEY);
          window.location.reload();
        }
      });

      // Ask version after short delay (SW needs to be ready)
      setTimeout(askVersion, 800);

    } catch (err) {
      console.warn('SW registration failed:', err);
    }
  });
}
