import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("sigaf_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Use a ref to hold the logout fn so the interceptor can always call the latest version
  const logoutRef = useRef(null);

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

  const logout = () => {
    localStorage.removeItem("sigaf_token");
    setToken(null);
    setUser(null);
  };

  // Keep ref in sync so interceptor always has latest logout
  logoutRef.current = logout;

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API });

    // Request interceptor: attach token
    instance.interceptors.request.use(config => {
      const t = localStorage.getItem("sigaf_token");
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });

    // Response interceptor: handle auth errors globally
    // This prevents any component from crashing with unhandled 401/403
    instance.interceptors.response.use(
      response => response,
      error => {
        const status = error?.response?.status;
        // 401 = token expired/invalid → force logout and redirect
        if (status === 401) {
          localStorage.removeItem("sigaf_token");
          if (logoutRef.current) logoutRef.current();
          // Let the error propagate so the calling component can handle it if needed
        }
        // For all other errors (403, 500, etc.), just propagate — don't crash globally
        return Promise.reject(error);
      }
    );

    return instance;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
