import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_TIMEOUT_MINUTES = 15;
const WARNING_THRESHOLD_SECONDS = 5 * 60; // show banner 5 min before logout

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

  // Use REFS for timer handles and mutable values — avoids stale closure bugs
  const timerRef        = useRef(null);      // setInterval for countdown
  const inactivityRef   = useRef(null);      // setTimeout for warning trigger
  const timeoutMinRef   = useRef(DEFAULT_TIMEOUT_MINUTES);
  const showWarningRef  = useRef(false);     // REF-backed showWarning — no stale closures
  const isLoggedInRef   = useRef(false);     // whether user is currently logged in

  // Keep refs in sync with state
  useEffect(() => { timeoutMinRef.current = timeoutMinutes; }, [timeoutMinutes]);
  useEffect(() => { showWarningRef.current = showWarning; },   [showWarning]);
  useEffect(() => { isLoggedInRef.current = !!user; },         [user]);

  // ── Core: clear all inactivity timers ─────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (inactivityRef.current) { clearTimeout(inactivityRef.current);  inactivityRef.current = null; }
    if (timerRef.current)      { clearInterval(timerRef.current);       timerRef.current = null; }
  }, []);

  // ── Core: start/restart the inactivity clock ───────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (!isLoggedInRef.current) return;

    clearAllTimers();
    setShowWarning(false);
    setSecondsLeft(null);
    showWarningRef.current = false;

    const totalMs   = timeoutMinRef.current * 60 * 1000;
    const warnMs    = WARNING_THRESHOLD_SECONDS * 1000;
    const warnDelay = Math.max(0, totalMs - warnMs);

    // Phase 1: wait until 5 minutes before timeout, then show warning
    inactivityRef.current = setTimeout(() => {
      if (!isLoggedInRef.current) return;

      let remaining = WARNING_THRESHOLD_SECONDS;
      setSecondsLeft(remaining);
      setShowWarning(true);
      showWarningRef.current = true;

      // Phase 2: count down every second
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          clearAllTimers();
          setShowWarning(false);
          setSecondsLeft(null);
          showWarningRef.current = false;
          // Execute logout
          if (logoutRef.current) logoutRef.current();
        }
      }, 1000);
    }, warnDelay);
  }, [clearAllTimers]);

  // ── Activity listeners: only reset timer when warning is NOT showing ───
  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      setSecondsLeft(null);
      showWarningRef.current = false;
      return;
    }

    const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    let throttle = null;

    const onActivity = () => {
      // Always use the REF to check current value — no stale closures
      if (showWarningRef.current) return;
      if (throttle) return;
      throttle = setTimeout(() => { throttle = null; }, 500);
      resetInactivityTimer();
    };

    EVENTS.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }));
    resetInactivityTimer(); // kick off on login

    return () => {
      EVENTS.forEach(ev => window.removeEventListener(ev, onActivity));
      clearAllTimers();
    };
  }, [user, resetInactivityTimer, clearAllTimers]);

  // ── Poll settings from server every 60s + heartbeat every 2 min ───────
  useEffect(() => {
    if (!user) return;

    // Wait for apiRef to be populated (useMemo runs synchronously, so it's ready)
    const poll = async () => {
      if (!apiRef.current) return;
      try {
        const res = await apiRef.current.get("/system-settings/public");
        const newMin = Number(res.data?.session_timeout_minutes);
        if (newMin >= 5 && newMin !== timeoutMinRef.current) {
          setTimeoutMinutes(newMin);
          timeoutMinRef.current = newMin;
          // Only restart if not currently showing warning
          if (!showWarningRef.current) resetInactivityTimer();
        }
      } catch { /* silent */ }
    };

    const heartbeat = async () => {
      if (!apiRef.current) return;
      try { await apiRef.current.post("/auth/heartbeat"); } catch { /* silent */ }
    };

    // Initial load with small delay to ensure apiRef is set
    const initTimer = setTimeout(() => { poll(); heartbeat(); }, 200);
    const settingsInterval = setInterval(poll, 60_000);
    const heartbeatInterval = setInterval(heartbeat, 120_000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(settingsInterval);
      clearInterval(heartbeatInterval);
    };
  }, [user, resetInactivityTimer]);

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
    } catch { /* silent */ }
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
