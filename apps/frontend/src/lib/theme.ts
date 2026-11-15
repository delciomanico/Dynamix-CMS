import type { CSSProperties } from 'react';

/** Aparência pública de um blog: layout + paleta + tipografia. Sem configuração, deriva-se do slug (cada blog parece distinto). */
export type LayoutKey = 'magazine' | 'portfolio' | 'minimal' | 'editorial';
export type PaletteKey = 'oceano' | 'floresta' | 'por-do-sol' | 'noir' | 'rosa' | 'papel' | 'lavanda' | 'grafite';
export type FontKey = 'sans' | 'serif' | 'hand' | 'mono';
export interface BlogTheme { layout?: LayoutKey; palette?: PaletteKey; font?: FontKey }

export const LAYOUTS: { key: LayoutKey; label: string; hint: string }[] = [
  { key: 'magazine', label: 'Revista', hint: 'Destaque grande e grelha de artigos' },
  { key: 'portfolio', label: 'Portefólio', hint: 'Mosaico de capas numeradas' },
  { key: 'minimal', label: 'Minimalista', hint: 'Lista limpa, muito espaço em branco' },
  { key: 'editorial', label: 'Editorial', hint: 'Painel lateral fixo e feed' },
];

interface Palette { label: string; bg: string; fg: string; accent: string; surface: string; on: string }
export const PALETTES: Record<PaletteKey, Palette> = {
  oceano:       { label: 'Oceano',      bg: '#F4F8FC', fg: '#0F2A44', accent: '#1B6FD8', surface: '#E1ECF8', on: '#fff' },
  floresta:     { label: 'Floresta',    bg: '#F3F6F1', fg: '#16301F', accent: '#2F7D4A', surface: '#DFEADA', on: '#fff' },
  'por-do-sol': { label: 'Pôr do sol',  bg: '#FFF6EE', fg: '#3B1E12', accent: '#E0612A', surface: '#FBE3CF', on: '#fff' },
  noir:         { label: 'Noir',        bg: '#0E0E10', fg: '#EDEDED', accent: '#F5C542', surface: '#1C1C21', on: '#0E0E10' },
  rosa:         { label: 'Rosa',        bg: '#FFF4F7', fg: '#3A1624', accent: '#D63C6E', surface: '#FADCE6', on: '#fff' },
  papel:        { label: 'Papel',       bg: '#FAF6EC', fg: '#2B2620', accent: '#8A5A2B', surface: '#EEE5CF', on: '#fff' },
  lavanda:      { label: 'Lavanda',     bg: '#F6F3FC', fg: '#251C3D', accent: '#6D4AE0', surface: '#E5DDF8', on: '#fff' },
  grafite:      { label: 'Grafite',     bg: '#F2F2F2', fg: '#1E1E1E', accent: '#1E1E1E', surface: '#E2E2E2', on: '#fff' },
};

export const FONTS: Record<FontKey, { label: string; head: string; body: string }> = {
  sans:  { label: 'Sem serifa',  head: '"DM Sans", sans-serif',  body: '"DM Sans", sans-serif' },
  serif: { label: 'Com serifa',  head: 'Fraunces, Georgia, serif', body: 'Newsreader, Georgia, serif' },
  hand:  { label: 'Manuscrita',  head: 'Caveat, cursive',        body: '"DM Sans", sans-serif' },
  mono:  { label: 'Monoespaçada', head: '"DM Mono", monospace',  body: '"DM Mono", monospace' },
};

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const KEYS = <T extends string>(o: Record<T, unknown> | { key: T }[]) => (Array.isArray(o) ? o.map((x) => x.key) : Object.keys(o)) as T[];

export interface ResolvedTheme { layout: LayoutKey; palette: PaletteKey; font: FontKey; dark: boolean; style: CSSProperties }

export function resolveTheme(slug: string, t?: BlogTheme | null): ResolvedTheme {
  const h = hash(slug);
  const layout = t?.layout && LAYOUTS.some((l) => l.key === t.layout) ? t.layout : KEYS<LayoutKey>(LAYOUTS)[h % 4];
  const palette = t?.palette && PALETTES[t.palette] ? t.palette : KEYS<PaletteKey>(PALETTES)[(h >>> 3) % 8];
  const font = t?.font && FONTS[t.font] ? t.font : KEYS<FontKey>(FONTS)[(h >>> 6) % 3]; // por defeito evita a monoespaçada
  const p = PALETTES[palette]; const f = FONTS[font];
  const style = { '--b-bg': p.bg, '--b-fg': p.fg, '--b-accent': p.accent, '--b-surface': p.surface, '--b-on': p.on, '--b-head': f.head, '--b-body': f.body } as CSSProperties;
  return { layout, palette, font, dark: palette === 'noir', style };
}
