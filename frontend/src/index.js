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

// Register PWA Service Worker + update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('SW registered:', reg.scope);

        // Poll for updates every 60 seconds
        setInterval(() => { reg.update(); }, 60_000);

        // Notify app when a new SW is waiting to take over
        const notifyUpdate = () => {
          window.dispatchEvent(new CustomEvent('sw-update-available', { detail: { reg } }));
        };

        if (reg.waiting) { notifyUpdate(); }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                notifyUpdate();
              }
            });
          }
        });
      })
      .catch(err => console.log('SW registration failed:', err));

    // When SW is activated after skipWaiting, reload automatically
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  });
}
