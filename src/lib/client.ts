'use client';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('phanda_token');
}

export function setToken(token: string) {
  localStorage.setItem('phanda_token', token);
}

export function setUser(data: object) {
  localStorage.setItem('phanda_user', JSON.stringify(data));
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('phanda_user');
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem('phanda_token');
  localStorage.removeItem('phanda_user');
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  // Token expired or invalid — clear and redirect to login
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') window.location.href = '/phone';
  }
  return res;
}
