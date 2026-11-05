import { slugify } from '../../common/slug';
import type { SeedComponent, SeedField, SiteSeed } from '../types';
import data from './data.json';

type Rows = Record<string, unknown>[];
const rows = data as unknown as Record<string, Rows>;

const f = (key: string, label: string, type = 'text', required = false): SeedField => ({ key, label, type, required });
/** Par de campos PT/EN (o site é bilingue; EN em falta cai para PT no adaptador do site). */
const bi = (key: string, label: string, type = 'text', required = false): SeedField[] => [
  f(`${key}_pt`, `${label} (PT)`, type, required),
  f(`${key}_en`, `${label} (EN)`, type),
];
const byIndex = (prefix: string) => (_: Record<string, unknown>, i: number) => `${prefix}-${String(i + 1).padStart(2, '0')}`;
const fromField = (key: string, prefix: string) => (r: Record<string, unknown>, i: number) =>
  slugify(String(r[key] ?? '')) || byIndex(prefix)(r, i);

const components: SeedComponent[] = [
  {
    slug: 'services', name: 'Serviços', rows: rows.services,
    fields: [
      ...bi('title', 'Título', 'text', true), ...bi('description', 'Descrição', 'textarea'),
      ...bi('tags', 'Etiquetas', 'json'), ...bi('subtechniques', 'Subtécnicas', 'json'),
      f('icon_id', 'Ícone'), f('image', 'Imagem', 'image'),
      ...bi('methodology', 'Metodologia', 'json'), ...bi('norms', 'Normas', 'json'), ...bi('faqs', 'FAQs', 'json'),
    ],
  },
  {
    slug: 'team', name: 'Equipa', rows: rows.team, slugOf: fromField('name_pt', 'membro'),
    fields: [
      ...bi('name', 'Nome', 'text', true), ...bi('role', 'Cargo'), ...bi('bio', 'Biografia', 'textarea'),
      f('initials', 'Iniciais'), f('photo', 'Foto', 'image'), f('linkedin', 'LinkedIn (URL ou #)'),
      f('years_exp', 'Anos de experiência', 'number'),
      ...bi('specialties', 'Especialidades', 'json'), ...bi('education', 'Formação'), ...bi('languages', 'Idiomas', 'json'),
    ],
  },
  {
    slug: 'portfolio', name: 'Portfólio', rows: rows.portfolio,
    fields: [
      ...bi('title', 'Título', 'text', true), ...bi('description', 'Descrição', 'textarea'),
      ...bi('service', 'Serviço'), f('province', 'Província'), f('year', 'Ano / período'), f('image', 'Imagem', 'image'),
      ...bi('client', 'Cliente'), ...bi('area', 'Área'), ...bi('duration', 'Duração'),
      ...bi('challenge', 'Desafio', 'textarea'), ...bi('solution', 'Solução', 'textarea'),
      ...bi('results', 'Resultados', 'json'), f('gallery', 'Galeria', 'json'),
    ],
  },
  {
    slug: 'blog', name: 'Blog', rows: rows.blog,
    fields: [
      ...bi('title', 'Título', 'text', true), ...bi('excerpt', 'Resumo', 'textarea'),
      f('cat_type', 'Tipo de categoria'), ...bi('category', 'Categoria'),
      ...bi('date', 'Data (texto)'), f('date_time', 'Data (ISO)'), f('image', 'Imagem', 'image'),
      ...bi('author', 'Autor'), ...bi('read_time', 'Tempo de leitura'), ...bi('tags', 'Etiquetas', 'json'),
      f('featured', 'Destaque', 'boolean'), ...bi('body', 'Corpo (blocos)', 'json'),
    ],
  },
  {
    slug: 'gallery', name: 'Galeria', rows: rows.gallery, slugOf: byIndex('foto'),
    fields: [
      ...bi('title', 'Título', 'text', true), f('cat', 'Categoria'), f('province', 'Província'),
      f('accent', 'Cor de destaque'), f('bg', 'Fundo'), f('image', 'Imagem', 'image'),
    ],
  },
  {
    slug: 'testimonials', name: 'Testemunhos', rows: rows.testimonials, slugOf: byIndex('testemunho'),
    fields: [...bi('text', 'Texto', 'textarea', true), ...bi('name', 'Nome'), ...bi('meta', 'Cargo / empresa'), f('initials', 'Iniciais')],
  },
  {
    slug: 'jobs', name: 'Vagas', rows: rows.jobs, slugOf: fromField('title_pt', 'vaga'),
    fields: [
      ...bi('title', 'Título', 'text', true), ...bi('dept', 'Departamento'), ...bi('location', 'Local'),
      ...bi('type', 'Tipo de contrato'), ...bi('level', 'Nível'), ...bi('posted', 'Publicada'),
      ...bi('description', 'Descrição', 'textarea'), ...bi('requirements', 'Requisitos', 'json'),
    ],
  },
  {
    // Em campos json, referências a ficheiros da Media Library escrevem-se `media://<id>` (a API pública converte em URL).
    slug: 'settings', name: 'Definições do site', rows: rows.settings,
    description: 'Pares chave → valor (menu, rodapé, estatísticas, contactos, banners…). O slug é a chave.',
    fields: [f('label', 'Descrição', 'text', true), f('value_pt', 'Valor (PT)', 'json', true), f('value_en', 'Valor (EN)', 'json')],
  },
];

export const bchiwaleSeed: SiteSeed = {
  project: 'bchiwale',
  name: 'Bchiwale',
  description: 'Website institucional da Bchiwale (geologia, geofísica, geotecnia, ambiente…).',
  components,
  assetsDir: 'bchiwale',
};
