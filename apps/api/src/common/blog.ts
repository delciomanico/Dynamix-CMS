/** Estrutura do componente de artigos de um blog (criado automaticamente com o projeto BLOG). */
export const BLOG_COMPONENT = 'posts';
export const BLOG_FIELDS = [
  { key: 'title', label: 'Título', type: 'text', required: true, options: [] as string[] },
  { key: 'excerpt', label: 'Resumo', type: 'textarea', required: false, options: [] as string[] },
  { key: 'body', label: 'Corpo (Markdown)', type: 'richtext', required: true, options: [] as string[] },
  { key: 'author', label: 'Autor', type: 'text', required: false, options: [] as string[] },
  { key: 'category', label: 'Categoria', type: 'text', required: false, options: [] as string[] },
  { key: 'cover', label: 'Capa', type: 'image', required: false, options: [] as string[] },
];

/** Opções de aparência de um blog (o frontend define os visuais; aqui só se valida). */
export const BLOG_LAYOUTS = ['magazine', 'portfolio', 'minimal', 'editorial'] as const;
export const BLOG_PALETTES = ['oceano', 'floresta', 'por-do-sol', 'noir', 'rosa', 'papel', 'lavanda', 'grafite'] as const;
export const BLOG_FONTS = ['sans', 'serif', 'hand', 'mono'] as const;
export interface BlogTheme { layout?: string; palette?: string; font?: string }

/** Mantém só chaves conhecidas com valores permitidos (ignora o resto). */
export function normalizeTheme(input: unknown): BlogTheme {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const pick = (v: unknown, allowed: readonly string[]) => (typeof v === 'string' && allowed.includes(v) ? v : undefined);
  return Object.fromEntries(Object.entries({
    layout: pick(o.layout, BLOG_LAYOUTS), palette: pick(o.palette, BLOG_PALETTES), font: pick(o.font, BLOG_FONTS),
  }).filter(([, v]) => v)) as BlogTheme;
}
