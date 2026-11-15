import { Paginated } from './api';
import type { BlogTheme } from './theme';

export const POSTS = 'posts';

/** A API pública devolve os campos do componente ao nível do próprio objeto. */
export interface Post {
  id: string; slug: string; publishedAt?: string;
  title: string; excerpt?: string; body: string; author?: string; category?: string; cover?: string;
}
export type PostList = Paginated<Post>;
export interface BlogInfo { name: string; slug: string; description?: string; kind: string; theme?: BlogTheme | null }

export const infoPath = (project: string) => `/public/${project}`;
export interface PostQuery { q?: string; category?: string; sort?: 'new' | 'old' | 'title' }
export const postsPath = (project: string, page = 1, limit = 9, o: PostQuery = {}) => {
  const s = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (o.q?.trim()) s.set('q', o.q.trim());
  if (o.category) s.set('filter[category]', o.category);
  s.set('sort', o.sort === 'old' ? 'publishedAt' : o.sort === 'title' ? 'slug' : '-publishedAt');
  return `/public/${project}/content/${POSTS}?${s}`;
};
export const postPath = (project: string, slug: string) => `/public/${project}/content/${POSTS}/${encodeURIComponent(slug)}`;
/** Base pública de um blog: /b/:projeto. (/blog é o diretório de todos os blogs.) */
export const blogBase = (project: string) => `/b/${project}`;

export interface BlogCard { name: string; slug: string; description?: string; theme?: BlogTheme | null; posts: number; lastPublishedAt?: string; lastTitle?: string; cover?: string }
export type BlogDirectory = Paginated<BlogCard>;
export const blogsPath = (page = 1, limit = 12, q = '') => `/blogs?page=${page}&limit=${limit}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`;

export const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
export const readMinutes = (t: string) => Math.max(1, Math.round(t.trim().split(/\s+/).length / 200));
