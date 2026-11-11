import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SessionUser } from '../shared/types';
import { authService, onDbChange } from '../services';

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
    const check = () =>
      authService
        .getCurrentUser()
        .then(setUser)
        .catch(() => setUser(null));
    check().finally(() => setLoading(false));
    // Sign-outs, password resets and shop deactivation take effect immediately (also from other tabs).
    return onDbChange(check);
  }, []);

  const login = useCallback(async (portal: 'admin' | 'shop', username: string, password: string) => {
    const u = await authService.login(portal, username, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
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
