import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SessionUser } from '../../shared/types';
import { api, onUnauthorized } from './api';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (portal: 'admin' | 'shop', username: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  setUser: (u: SessionUser | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ user: SessionUser | null }>('/api/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return onUnauthorized(() => setUser(null));
  }, []);

  const login = useCallback(async (portal: 'admin' | 'shop', username: string, password: string) => {
    const r = await api.post<{ user: SessionUser }>('/api/auth/login', { portal, username, password });
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
