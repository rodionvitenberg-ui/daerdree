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

export type TranslationKey = { key: string; ru: string | number | unknown; en: string | number | unknown };
export type TranslationGroup = { name: string; keys: TranslationKey[] };
export type TranslationsResponse = { groups: TranslationGroup[] };

export function getTranslations() {
  return adminFetch<TranslationsResponse>('/api/admin/translations/');
}
export function putTranslations(keys: Record<string, { ru: unknown; en: unknown }>) {
  return adminFetch<TranslationsResponse>('/api/admin/translations/', {
    method: 'PUT',
    body: JSON.stringify({ keys }),
  });
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type AdminCategory = {
  id: number;
  slug: string;
  name_ru: string;
  name_en: string;
  description_ru: string;
  description_en: string;
  icon: string | null;
};

export type AdminTag = {
  id: number;
  slug: string;
  name_ru: string;
  name_en: string;
  icon: string | null;
};

export type AdminExpansion = {
  id?: number;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
};

export type AdminGameImageType = 'cover' | 'background' | 'gallery';

export type AdminGameImage = {
  id: number;
  image: string;
  image_type: AdminGameImageType;
  order: number;
  alt: string;
};

export type AdminGameListItem = {
  id: number;
  title_ru: string;
  title_en: string;
  image: string | null;
  is_active: boolean;
  is_visible_ru: boolean;
  is_visible_en: boolean;
  slug: string;
};

export type AdminGame = {
  id: number;
  slug: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  categories: AdminCategory[];
  tags: AdminTag[];
  min_players: number;
  max_players: number;
  play_time: number;
  difficulty: number;
  designer: string;
  bgg_type: string;
  image: string | null;
  setup_image: string | null;
  images: AdminGameImage[];
  expansions: AdminExpansion[];
  is_active: boolean;
  is_visible_ru: boolean;
  is_visible_en: boolean;
  created_at: string;
};

export type CategoryWrite = {
  name_ru: string;
  name_en: string;
  description_ru?: string;
  description_en?: string;
};

export type TagWrite = {
  name_ru: string;
  name_en: string;
};

export type GameWrite = {
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  min_players: number;
  max_players: number;
  play_time: number;
  difficulty: number;
  designer: string;
  bgg_type: string;
  is_active: boolean;
  is_visible_ru: boolean;
  is_visible_en: boolean;
  categories: number[];
  tags: number[];
  expansions: AdminExpansion[];
};

export function unwrapList<T>(data: T[] | Paginated<T>): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

export function adminNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  try {
    const url = new URL(next, 'http://local.invalid');
    return `${url.pathname}${url.search}`;
  } catch {
    return next.startsWith('/') ? next : null;
  }
}

function errorText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(errorText).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(errorText).filter(Boolean).join(' ');
  }
  return '';
}

export function adminFieldErrors(body: unknown): Record<string, string> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    const text = errorText(value);
    if (text) out[key] = text;
  }
  return out;
}

export async function listCategories() {
  const data = await adminFetch<AdminCategory[] | Paginated<AdminCategory>>('/api/admin/categories/');
  return unwrapList(data);
}

export function createCategory(body: CategoryWrite) {
  return adminFetch<AdminCategory>('/api/admin/categories/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function patchCategory(id: number, body: Partial<CategoryWrite>) {
  return adminFetch<AdminCategory>(`/api/admin/categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteCategory(id: number) {
  return adminFetch<null>(`/api/admin/categories/${id}/`, { method: 'DELETE' });
}

export async function listTags() {
  const data = await adminFetch<AdminTag[] | Paginated<AdminTag>>('/api/admin/tags/');
  return unwrapList(data);
}

export function createTag(body: TagWrite) {
  return adminFetch<AdminTag>('/api/admin/tags/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function patchTag(id: number, body: Partial<TagWrite>) {
  return adminFetch<AdminTag>(`/api/admin/tags/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteTag(id: number) {
  return adminFetch<null>(`/api/admin/tags/${id}/`, { method: 'DELETE' });
}

export function listGames(search = '', url?: string | null) {
  const path = url
    ? adminNextPath(url) || '/api/admin/games/'
    : `/api/admin/games/${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  return adminFetch<Paginated<AdminGameListItem>>(path);
}

export function getGame(id: number) {
  return adminFetch<AdminGame>(`/api/admin/games/${id}/`);
}

export function createGame(body: GameWrite) {
  return adminFetch<AdminGame>('/api/admin/games/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function patchGame(id: number, body: GameWrite) {
  return adminFetch<AdminGame>(`/api/admin/games/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteGame(id: number) {
  return adminFetch<null>(`/api/admin/games/${id}/`, { method: 'DELETE' });
}

function fileBody(file: File) {
  const body = new FormData();
  body.append('file', file);
  return body;
}

export function uploadGameCover(id: number, file: File) {
  return adminFetch<{ image: string | null }>(`/api/admin/games/${id}/image/`, {
    method: 'POST',
    body: fileBody(file),
  });
}

export function deleteGameCover(id: number) {
  return adminFetch<{ image: string | null }>(`/api/admin/games/${id}/image/`, { method: 'DELETE' });
}

export function uploadGameSetupImage(id: number, file: File) {
  return adminFetch<{ setup_image: string | null }>(`/api/admin/games/${id}/setup-image/`, {
    method: 'POST',
    body: fileBody(file),
  });
}

export function deleteGameSetupImage(id: number) {
  return adminFetch<{ setup_image: string | null }>(`/api/admin/games/${id}/setup-image/`, {
    method: 'DELETE',
  });
}

export function listGameGallery(id: number) {
  return adminFetch<AdminGameImage[]>(`/api/admin/games/${id}/gallery/`);
}

export function uploadGameGallery(
  id: number,
  file: File,
  meta: { image_type?: string; order?: number; alt?: string } = {},
) {
  const body = fileBody(file);
  body.append('image_type', meta.image_type || 'gallery');
  body.append('order', String(meta.order ?? 0));
  body.append('alt', meta.alt ?? '');
  return adminFetch<AdminGameImage>(`/api/admin/games/${id}/gallery/`, {
    method: 'POST',
    body,
  });
}

export function patchGameGallery(
  gameId: number,
  imageId: number,
  body: Partial<Pick<AdminGameImage, 'image_type' | 'order' | 'alt'>>,
) {
  return adminFetch<AdminGameImage>(`/api/admin/games/${gameId}/gallery/${imageId}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteGameGallery(gameId: number, imageId: number) {
  return adminFetch<null>(`/api/admin/games/${gameId}/gallery/${imageId}/`, { method: 'DELETE' });
}

export type AdminEvent = {
  id: number;
  title: string;
  description: string;
  title_en: string | null;
  description_en: string | null;
  image: string | null;
  event_date: string;
  is_visible: boolean;
  telegram_id: string | null;
  created_at: string;
};

export type EventWrite = {
  title: string;
  description: string;
  title_en: string;
  description_en: string;
  event_date: string;
  is_visible: boolean;
};

export function listEvents(search = '', url?: string | null) {
  const path = url
    ? adminNextPath(url) || '/api/admin/events/'
    : `/api/admin/events/${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  return adminFetch<Paginated<AdminEvent>>(path);
}

export function getEvent(id: number) {
  return adminFetch<AdminEvent>(`/api/admin/events/${id}/`);
}

export function createEvent(body: FormData) {
  return adminFetch<AdminEvent>('/api/admin/events/', {
    method: 'POST',
    body,
  });
}

export function patchEvent(id: number, body: FormData | EventWrite) {
  return adminFetch<AdminEvent>(`/api/admin/events/${id}/`, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function deleteEvent(id: number) {
  return adminFetch<null>(`/api/admin/events/${id}/`, { method: 'DELETE' });
}
