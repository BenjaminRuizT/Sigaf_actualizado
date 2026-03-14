import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default inactivity timeout in minutes (overridden by system settings)
const DEFAULT_TIMEOUT_MINUTES = 15;
// Show warning banner when this many seconds remain before auto-logout
const WARNING_THRESHOLD_SECONDS = 5 * 60; // 5 minutes

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(localStorage.getItem("sigaf_token"));
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutRef  = useRef(null);
  const apiRef     = useRef(null);

  // ── Inactivity timer state ──────────────────────────────────────────────
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_TIMEOUT_MINUTES);
  const [secondsLeft, setSecondsLeft]       = useState(null);  // null = timer not running
  const [showWarning, setShowWarning]       = useState(false);

  const timerRef        = useRef(null);   // setInterval handle for countdown display
  const inactivityRef   = useRef(null);   // setTimeout handle for actual logout
  const lastActivityRef = useRef(Date.now());
  const timeoutMinRef   = useRef(timeoutMinutes); // mutable ref, always current

  // Keep ref in sync with state
  useEffect(() => { timeoutMinRef.current = timeoutMinutes; }, [timeoutMinutes]);

  // ── Reset the inactivity clock ─────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    // Clear existing timers
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    if (timerRef.current)       clearInterval(timerRef.current);

    const totalMs = timeoutMinRef.current * 60 * 1000;
    const warnMs  = WARNING_THRESHOLD_SECONDS * 1000;

    // Schedule the warning banner
    const warningDelay = Math.max(0, totalMs - warnMs);
    inactivityRef.current = setTimeout(() => {
      // Start the visible countdown
      let remaining = WARNING_THRESHOLD_SECONDS;
      setSecondsLeft(remaining);
      setShowWarning(true);

      timerRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setShowWarning(false);
          setSecondsLeft(null);
          // Auto-logout
          if (logoutRef.current) logoutRef.current();
        }
      }, 1000);
    }, warningDelay);
  }, []); // no deps — uses refs only

  // ── Activity event listeners (only when logged in) ─────────────────────
  useEffect(() => {
    if (!user) {
      // Clear timers when logged out
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      if (timerRef.current)       clearInterval(timerRef.current);
      setShowWarning(false);
      setSecondsLeft(null);
      return;
    }

    const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    let throttleTimer = null;

    const onActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => { throttleTimer = null; }, 500);
      if (showWarning) return; // Don't reset if warning is already showing — let user decide
      resetInactivityTimer();
    };

    EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    resetInactivityTimer(); // Start timer when user logs in

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, onActivity));
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      if (timerRef.current)       clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, resetInactivityTimer]);

  // ── Poll system settings every 60 s for real-time timeout config updates ──
  useEffect(() => {
    if (!user || !apiRef.current) return;
    const poll = async () => {
      try {
        const res = await apiRef.current.get("/system-settings/public");
        const newMin = Number(res.data?.session_timeout_minutes);
        if (newMin >= 5 && newMin !== timeoutMinRef.current) {
          setTimeoutMinutes(newMin);
          resetInactivityTimer(); // Restart with new timeout
        }
      } catch { /* silencioso */ }
    };
    poll(); // immediate check
    const interval = setInterval(poll, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Auth flow ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("sigaf_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("sigaf_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const loginForce = async (email, password) => {
    const res = await axios.post(`${API}/auth/login/force`, { email, password });
    localStorage.setItem("sigaf_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      const t = localStorage.getItem("sigaf_token");
      if (t) await axios.post(`${API}/auth/logout`, {}, { headers: { Authorization: `Bearer ${t}` } });
    } catch { /* silencioso */ }
    localStorage.removeItem("sigaf_token");
    setToken(null);
    setUser(null);
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
        const status = error?.response?.status;
        if (status === 401) {
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
      // Inactivity timer
      showWarning, secondsLeft, timeoutMinutes,
      continueSession: resetInactivityTimer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
