import { User } from '@/types';

export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};

export const saveAuth = (token: string, user: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isLoggedIn = (): boolean => !!getToken();

export const isVerified = (): boolean => {
  const user = getUser();
  return !!(user?.email_verified && user?.phone_verified);
};

export const formatPrice = (n: number | string): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n));

export const formatDate = (d: string): string =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
