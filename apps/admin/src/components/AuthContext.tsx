import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminRole, hasPermission } from '@matina/shared';
import { adminFetch } from '../lib/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  can: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<{ user: AdminUser }>('/admin/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await adminFetch<{ token: string; user: AdminUser }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('matina_admin_token', res.token);
    setUser(res.user);
  };

  const logout = async () => {
    await adminFetch('/admin/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('matina_admin_token');
    setUser(null);
  };

  const can = (permission: string) => (user ? hasPermission(user.role, permission) : false);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
