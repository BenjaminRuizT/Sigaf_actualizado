import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_TIMEOUT_MINUTES = 15;
const WARNING_THRESHOLD_SECONDS = 5 * 60; // show banner 5 min before logout
const TICK_INTERVAL_MS = 1000; // check every second

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(localStorage.getItem("sigaf_token"));
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutRef  = useRef(null);
  const apiRef     = useRef(null);

  // ── Inactivity timer state ──────────────────────────────────────────────
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_TIMEOUT_MINUTES);
  const [secondsLeft, setSecondsLeft]       = useState(null);
  const [showWarning, setShowWarning]       = useState(false);

  // All mutable values stored in refs — avoids stale closure bugs entirely
  const timeoutMinRef    = useRef(DEFAULT_TIMEOUT_MINUTES);
  const showWarningRef   = useRef(false);
  const isLoggedInRef    = useRef(false);
  const lastActivityRef  = useRef(Date.now()); // wall-clock time of last activity
  const tickRef          = useRef(null);        // single setInterval for everything

  // Keep refs in sync with state
  useEffect(() => { timeoutMinRef.current = timeoutMinutes; }, [timeoutMinutes]);
  useEffect(() => { showWarningRef.current = showWarning; },   [showWarning]);
  useEffect(() => { isLoggedInRef.current = !!user; },         [user]);

  // ── Single ticker: runs every second, uses wall-clock to compute real elapsed ──
  // This approach is immune to tab throttling because we measure actual elapsed time
  // with Date.now() instead of trusting that N ticks == N seconds.
  const startTicker = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    tickRef.current = setInterval(() => {
      if (!isLoggedInRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
        return;
      }

      const now       = Date.now();
      const elapsed   = now - lastActivityRef.current;            // ms since last activity
      const totalMs   = timeoutMinRef.current * 60 * 1000;
      const remaining = Math.max(0, totalMs - elapsed);           // ms until logout
      const remSec    = Math.ceil(remaining / 1000);

      if (remaining <= 0) {
        // Time is up — logout immediately regardless of tab visibility
        clearInterval(tickRef.current);
        tickRef.current = null;
        setShowWarning(false);
        setSecondsLeft(null);
        showWarningRef.current = false;
        if (logoutRef.current) logoutRef.current();
        return;
      }

      if (remSec <= WARNING_THRESHOLD_SECONDS) {
        // In warning zone — show banner and countdown
        if (!showWarningRef.current) {
          setShowWarning(true);
          showWarningRef.current = true;
        }
        setSecondsLeft(remSec);
      } else {
        // Still safe — hide banner if it was showing (shouldn't normally happen)
        if (showWarningRef.current) {
          setShowWarning(false);
          setSecondsLeft(null);
          showWarningRef.current = false;
        }
      }
    }, TICK_INTERVAL_MS);
  }, []);

  // ── Record user activity and reset the inactivity clock ───────────────
  const resetInactivityTimer = useCallback(() => {
    if (!isLoggedInRef.current) return;
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setSecondsLeft(null);
    showWarningRef.current = false;
    // The ticker keeps running — it will compute new remaining time from lastActivity
    if (!tickRef.current) startTicker();
  }, [startTicker]);

  // ── Tab visibility: force-check when tab becomes visible again ─────────
  // This catches the case where the timer expired while the tab was hidden.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && isLoggedInRef.current) {
        // Re-evaluate immediately when user switches back to this tab
        const now     = Date.now();
        const elapsed = now - lastActivityRef.current;
        const totalMs = timeoutMinRef.current * 60 * 1000;
        if (elapsed >= totalMs) {
          // Already timed out while hidden — logout now
          if (logoutRef.current) logoutRef.current();
        }
        // Ensure ticker is running (some browsers pause it when tab is hidden)
        if (!tickRef.current && isLoggedInRef.current) startTicker();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [startTicker]);

  // ── Activity event listeners ───────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      setShowWarning(false);
      setSecondsLeft(null);
      showWarningRef.current = false;
      return;
    }

    const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    let throttle = null;

    const onActivity = () => {
      // Ignore activity during warning — let user click the button explicitly
      if (showWarningRef.current) return;
      if (throttle) return;
      throttle = setTimeout(() => { throttle = null; }, 500);
      lastActivityRef.current = Date.now(); // update timestamp (ticker computes rest)
    };

    EVENTS.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }));
    lastActivityRef.current = Date.now();
    startTicker(); // start the single ticker

    return () => {
      EVENTS.forEach(ev => window.removeEventListener(ev, onActivity));
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [user, startTicker]);

  // ── Poll settings + heartbeat ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      if (!apiRef.current) return;
      try {
        const res = await apiRef.current.get("/system-settings/public");
        const newMin = Number(res.data?.session_timeout_minutes);
        if (newMin >= 5 && newMin !== timeoutMinRef.current) {
          setTimeoutMinutes(newMin);
          timeoutMinRef.current = newMin;
        }
      } catch { /* silent */ }
    };

    const heartbeat = async () => {
      if (!apiRef.current) return;
      try { await apiRef.current.post("/auth/heartbeat"); } catch { /* silent */ }
    };

    const init = setTimeout(() => { poll(); heartbeat(); }, 200);
    const si   = setInterval(poll, 60_000);
    const hi   = setInterval(heartbeat, 120_000);
    return () => { clearTimeout(init); clearInterval(si); clearInterval(hi); };
  }, [user]);

  // ── Auth flow ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem("sigaf_token"); setToken(null); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("sigaf_token", res.data.token);
    setToken(res.data.token); setUser(res.data.user);
    return res.data.user;
  };

  const loginForce = async (email, password) => {
    const res = await axios.post(`${API}/auth/login/force`, { email, password });
    localStorage.setItem("sigaf_token", res.data.token);
    setToken(res.data.token); setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      const t = localStorage.getItem("sigaf_token");
      if (t) await axios.post(`${API}/auth/logout`, {}, { headers: { Authorization: `Bearer ${t}` } });
    } catch { /* silent */ }
    localStorage.removeItem("sigaf_token");
    setToken(null); setUser(null);
  };

  const closeOtherSessions = async () => {
    if (apiRef.current) await apiRef.current.post("/auth/sessions/close-others");
  };

  logoutRef.current = logout;

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API });
    instance.interceptors.request.use(config => {
      const t = localStorage.getItem("sigaf_token");
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
    instance.interceptors.response.use(
      response => response,
      error => {
        if (error?.response?.status === 401) {
          localStorage.removeItem("sigaf_token");
          if (logoutRef.current) logoutRef.current();
        }
        return Promise.reject(error);
      }
    );
    apiRef.current = instance;
    return instance;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{
      token, user, loading, login, loginForce, logout, closeOtherSessions, api,
      showWarning, secondsLeft, timeoutMinutes,
      continueSession: resetInactivityTimer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
