export const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001/api/v1';
const KEY = 'dynamix_token';

export const token = {
  get: () => localStorage.getItem(KEY),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: string[]) { super(message); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const t = token.get();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? (opts.body || opts.form ? 'POST' : 'GET'),
    headers,
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && t) { token.clear(); window.location.href = '/login'; }
    const msg = res.status === 429 ? 'Demasiados pedidos. Aguarde um minuto e tente novamente.'
      : Array.isArray(json?.message) ? json.message.join(', ') : json?.message ?? 'Erro inesperado';
    throw new ApiError(res.status, msg, json?.errors);
  }
  return json as T;
}

export interface Project { id: string; name: string; slug: string; description?: string; frontendUrl?: string; allowedOrigins: string[] }
export interface Field { id?: string; key: string; label: string; type: string; required: boolean; options: string[] }
export interface Component { id: string; name: string; slug: string; description?: string; fields: Field[]; _count?: { entries: number } }
export interface Entry { id: string; slug: string; data: Record<string, any>; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; updatedAt: string; publishedAt?: string }
export interface Media { id: string; filename: string; mimeType: string; size: number; createdAt: string }

export const FIELD_TYPES = ['text', 'textarea', 'richtext', 'number', 'boolean', 'image', 'file', 'url', 'email', 'date', 'select', 'multiselect', 'reference'];
export const publicBase = (slug: string) => `${API_URL}/public/${slug}`;
export const mediaUrl = (slug: string, id: string) => `${publicBase(slug)}/media/${id}`;

export interface Paginated<T> { data: T[]; meta: { total: number; page: number; limit: number; pages: number } }

export interface AdminOverview {
  totals: { users: number; admins: number; newUsers7d: number; workspaces: number; projects: number; components: number; entries: number; media: number; mediaBytes: number };
  entries: { draft: number; published: number; archived: number };
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
  topProjects: { id: string; name: string; slug: string; entries: number }[];
  signupsLast30d: { day: string; count: number }[];
}
export interface AdminUser { id: string; name: string; email: string; role: 'USER' | 'ADMIN'; google: boolean; createdAt: string; _count: { workspaces: number } }
export interface AdminProject { id: string; name: string; slug: string; owner: string; createdAt: string; _count: { components: number; media: number } }

export interface BackupItem { id: string; createdAt: string; trigger: string; label: string; dbBytes: number; mediaBytes: number; offsite: 'ok' | 'error' | 'disabled' | 'pending'; verified: boolean; version: string }
export interface BackupStatus {
  enabled: boolean; running?: boolean; schedule?: string[]; nextRun?: string; offsite?: boolean; totalBytes?: number; lastSuccessAt?: string | null;
  retention?: { daily: number; weekly: number; monthly: number };
  lastRun?: { id: string; ok: boolean; trigger: string; finishedAt: string; error?: string } | null;
  backups?: BackupItem[];
}
