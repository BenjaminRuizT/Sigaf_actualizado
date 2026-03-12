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

// ── Service Worker registration + update detection ──────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('SW registered:', reg.scope);

        // Poll for new SW every 60s
        setInterval(() => { reg.update(); }, 60_000);

        // Method A: new SW enters "waiting" state (when old SW has no skipWaiting)
        const notifyWaiting = () => {
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        };
        if (reg.waiting) { notifyWaiting(); }
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (nw) {
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                notifyWaiting();
              }
            });
          }
        });
      })
      .catch(err => console.log('SW registration failed:', err));

    // Method B: new SW sends SW_ACTIVATED after self.skipWaiting() + clients.claim()
    // This fires on page load when a new SW already took over since last visit
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_ACTIVATED') {
        // Only show banner if user was already using the app (controller existed before)
        window.dispatchEvent(new CustomEvent('sw-update-available'));
      }
    });

    // Reload when controller changes (after SKIP_WAITING)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  });
}
