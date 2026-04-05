import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ── Bootstrap: load user from stored token ───────────────────
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('spark_token');
      if (!token) { setLoading(false); return; }
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data } = await api.get('/auth/me');
        setUser(data.data);
      } catch {
        localStorage.removeItem('spark_token');
        localStorage.removeItem('spark_refresh');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Register ─────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    _saveSession(data);
    return data;
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    _saveSession(data);
    return data;
  }, []);

  // ── Google OAuth callback handler ─────────────────────────────
  const handleOAuthCallback = useCallback((token, refreshToken) => {
    localStorage.setItem('spark_token', token);
    localStorage.setItem('spark_refresh', refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api.get('/auth/me').then(({ data }) => {
      setUser(data.data);
      router.push('/discover');
    }).catch(() => {
      toast.error('OAuth login failed');
    });
  }, [router]);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('spark_refresh');
      await api.post('/auth/logout', { refreshToken: refresh });
    } catch {}
    localStorage.removeItem('spark_token');
    localStorage.removeItem('spark_refresh');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    router.push('/');
  }, [router]);

  // ── Update user state locally ─────────────────────────────────
  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  // ── Refresh user from server ──────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {}
  }, []);

  // ── Internal: save session ────────────────────────────────────
  const _saveSession = (data) => {
    localStorage.setItem('spark_token', data.token);
    if (data.refreshToken) localStorage.setItem('spark_refresh', data.refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
  };

  const isAuthenticated = !!user && !loading;

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated,
      register, login, logout, updateUser, refreshUser, handleOAuthCallback,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
