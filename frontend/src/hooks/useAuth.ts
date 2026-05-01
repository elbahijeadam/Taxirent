'use client';
import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { getUser, saveAuth, clearAuth, getToken } from '@/lib/auth';
import { authApi } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getUser();
    if (stored && getToken()) {
      setUser(stored);
      authApi.getMe().then((res) => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }).catch(() => {
        clearAuth();
        setUser(null);
      });
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    saveAuth(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    commune?: string;
  }) => {
    const res = await authApi.register(data);
    saveAuth(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    window.location.href = '/';
  }, []);

  return { user, isLoading, login, register, logout };
}
