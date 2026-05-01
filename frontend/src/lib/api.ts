import axios from 'axios';
import { getToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    commune?: string;
  }) => api.post('/auth/register', data),
  login:       (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe:       () => api.get('/auth/me'),
  verifyEmail: (code: string) => api.post('/auth/verify-email', { code }),
  verifyPhone: (code: string) => api.post('/auth/verify-phone', { code }),
  resendOtp:   (type: 'email' | 'phone') => api.post('/auth/resend-otp', { type }),
};

// Users
export const userApi = {
  updateProfile:  (data: Record<string, unknown>) => api.put('/users/profile', data),
  getDocuments:   () => api.get('/users/documents'),
  uploadDocument: (file: File, type: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    return api.post('/users/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getReservations: () => api.get('/users/reservations'),
};

// Cities
export const citiesApi = {
  search: (q: string) => api.get('/cities/search', { params: { q } }),
};

// Cars
export const carApi = {
  list:            (params?: Record<string, string>) => api.get('/cars', { params }),
  get:             (id: string) => api.get(`/cars/${id}`),
  getAvailability: (id: string) => api.get(`/cars/${id}/availability`),
};

// Reservations
export const reservationApi = {
  create:         (data: Record<string, unknown>) => api.post('/reservations', data),
  get:            (id: string) => api.get(`/reservations/${id}`),
  cancel:         (id: string) => api.patch(`/reservations/${id}/cancel`),
  getContractUrl: (id: string) => {
    const token = getToken();
    return `${API_URL}/api/reservations/${id}/contract${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};

// Admin
export const adminApi = {
  getStats:               () => api.get('/admin/stats'),
  listUsers:              (params?: Record<string, string | number>) => api.get('/admin/users', { params }),
  getUserDetails:         (id: string) => api.get(`/admin/users/${id}`),
  updateUserStatus:       (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status }),
  listReservations:       (params?: Record<string, string | number>) => api.get('/admin/reservations', { params }),
  updateReservationStatus:(id: string, status: string, admin_note?: string) =>
    api.patch(`/admin/reservations/${id}/status`, { status, admin_note }),
  getPendingDocuments:    (params?: Record<string, string | number>) => api.get('/admin/documents/pending', { params }),
  getDocumentVerification:(id: string) => api.get(`/admin/documents/${id}/verification`),
  updateDocumentStatus:   (id: string, status: string) =>
    api.patch(`/admin/documents/${id}/status`, { status }),
  resetDatabase: () => api.post('/admin/dev/reset-db'),
};

// Payments
export const paymentApi = {
  createIntent: (data: { reservation_id: string; payment_type: string }) =>
    api.post('/payments/create-intent', data),
  getHistory: () => api.get('/payments/history'),
};
