const DJANGO_INTERNAL = process.env.DJANGO_INTERNAL_URL || 'http://127.0.0.1:8000';

function csrfFromDocument(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export class AdminApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(typeof body === 'object' && body && 'detail' in body ? String((body as { detail: string }).detail) : `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function adminFetch<T>(path: string, init: RequestInit = {}, cookieHeader?: string): Promise<T> {
  const isServer = typeof window === 'undefined';
  const base = isServer ? DJANGO_INTERNAL : '';
  const headers = new Headers(init.headers);
  if (cookieHeader) headers.set('cookie', cookieHeader);
  if (!headers.has('content-type') && init.body && !(init.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }
  if (init.method && init.method !== 'GET' && init.method !== 'HEAD') {
    const csrf = csrfFromDocument();
    if (csrf) headers.set('X-CSRFToken', csrf);
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new AdminApiError(res.status, data);
  return data as T;
}

export type StaffUser = { id: number; username: string; is_staff: boolean };

export function adminLogin(username: string, password: string) {
  return adminFetch<StaffUser>('/api/admin/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function adminLogout() {
  return adminFetch<{ detail: string }>('/api/admin/logout/', { method: 'POST' });
}

export function adminMe(cookieHeader?: string) {
  return adminFetch<StaffUser>('/api/admin/me/', {}, cookieHeader);
}

export function adminCsrf() {
  return adminFetch<{ detail: string }>('/api/admin/csrf/');
}
