import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("sigaf_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef(null);
  // Ref to the api instance so closeOtherSessions/logout can use it after init
  const apiRef = useRef(null);

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

  // Uses apiRef (set below) so it always has the correct Authorization header
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

    // Store ref so closeOtherSessions and others can use it without circular deps
    apiRef.current = instance;
    return instance;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, loginForce, logout, closeOtherSessions, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
