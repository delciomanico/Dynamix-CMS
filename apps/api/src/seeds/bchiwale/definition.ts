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
  // ── Um componente por secção do site ───────────────────────────────────────────────
  {
    slug: 'hero-slides', name: 'Home · Banner principal', rows: rows['hero-slides'],
    description: 'Slides do banner da página inicial (por ordem de publicação).',
    fields: [
      f('image', 'Imagem de fundo', 'image'), ...bi('alt', 'Descrição da imagem'),
      ...bi('line1', 'Título — linha 1', 'text', true), ...bi('line2', 'Título — linha 2'),
      ...bi('primary_label', 'Botão principal — texto'), f('primary_href', 'Botão principal — ligação'),
      ...bi('secondary_label', 'Botão secundário — texto'), f('secondary_href', 'Botão secundário — ligação'),
    ],
  },
  {
    slug: 'stats', name: 'Home · Números', rows: rows.stats,
    description: 'Faixa de números (contadores animados).',
    fields: [f('value', 'Valor', 'number', true), f('suffix', 'Sufixo (+, %…)'), ...bi('label', 'Rótulo', 'text', true), ...bi('detail', 'Detalhe')],
  },
  {
    slug: 'timeline', name: 'Sobre · História (linha do tempo)', rows: rows.timeline,
    fields: [f('year', 'Ano', 'text', true), ...bi('text', 'Texto', 'textarea', true), ...bi('badge', 'Selo (ex. ACTIVO)'), f('type', 'Tipo (normal | active)')],
  },
  {
    slug: 'mvv', name: 'Sobre · Missão, Visão e Valores', rows: rows.mvv,
    fields: [...bi('label', 'Rótulo (Missão…)', 'text', true), ...bi('title', 'Título'), ...bi('text', 'Texto', 'textarea'), f('accent', 'Cor de destaque (#hex)')],
  },
  {
    slug: 'org-chart', name: 'Sobre · Organograma', rows: rows['org-chart'],
    description: 'Cada cargo é uma entrada; "Superior" é o slug do cargo acima (vazio = topo). A ordem de publicação é a ordem no organograma.',
    fields: [f('cargo', 'Cargo', 'text', true), f('nome', 'Nome'), f('iniciais', 'Iniciais'), f('photo', 'Foto', 'image'), f('parent', 'Superior (slug)')],
  },
  {
    slug: 'certifications', name: 'Sobre · Certificações', rows: rows.certifications,
    fields: [f('code', 'Código (ISO 9001…)', 'text', true), ...bi('label', 'Descrição'), f('year', 'Ano'), f('logo', 'Logótipo', 'image')],
  },
  {
    slug: 'cert-badges', name: 'Rodapé · Selos de certificação', rows: rows['cert-badges'],
    fields: [f('name', 'Nome do selo', 'text', true)],
  },
  {
    slug: 'footer-links', name: 'Rodapé · Links', rows: rows['footer-links'],
    description: 'Grupo: "servicos" ou "empresa".',
    fields: [f('group', 'Grupo (servicos | empresa)', 'text', true), ...bi('label', 'Texto', 'text', true), f('href', 'Ligação', 'text', true)],
  },
  {
    slug: 'contact-info', name: 'Empresa · Contactos', rows: rows['contact-info'],
    description: 'Uma única entrada: dados usados no rodapé, página de contacto, WhatsApp e CTA.',
    fields: [
      f('phone', 'Telefone'), f('email', 'Email'), f('whatsapp', 'WhatsApp (link wa.me)'), f('address', 'Morada'),
      f('address_short', 'Morada curta'), f('website', 'Website'), f('hours', 'Horário'),
    ],
  },
  {
    slug: 'filters', name: 'Site · Filtros e categorias', rows: rows.filters,
    description: 'Opções dos filtros do site. Grupos: galeria, blog, portfolio-servico, portfolio-provincia, portfolio-periodo, vagas-departamento. O 1.º item de cada grupo é o "Todos".',
    fields: [f('group', 'Grupo', 'text', true), ...bi('label', 'Texto', 'text', true)],
  },
  {
    slug: 'downloads', name: 'Recursos · Downloads', rows: rows.downloads,
    fields: [...bi('title', 'Título', 'text', true), ...bi('desc', 'Descrição', 'textarea'), f('type', 'Tipo (PDF, XLSX…)'), ...bi('cat', 'Categoria'), f('size', 'Tamanho'), f('accent', 'Cor (#hex)')],
  },
  {
    slug: 'tools', name: 'Recursos · Ferramentas', rows: rows.tools,
    fields: [...bi('title', 'Título', 'text', true), ...bi('desc', 'Descrição', 'textarea'), f('icon', 'Ícone'), f('href', 'Ligação')],
  },
  {
    // O slug de cada entrada é a chave usada pelo site (logo, icon, hero-*, director-photo, mega-*, about-video).
    slug: 'site-media', name: 'Site · Imagens e vídeo', rows: rows['site-media'],
    description: 'Logótipo, favicon, fundos dos cabeçalhos das páginas, retrato do DG, imagens dos menus e vídeo da secção Sobre. Não alterar o slug.',
    fields: [f('name', 'Onde é usado', 'text', true), f('file', 'Ficheiro', 'file')],
  },
  {
    // Todos os textos fixos da interface (botões, títulos de secção, rótulos, SEO…). O site lê `key` e monta a árvore de textos.
    slug: 'ui-texts', name: 'Site · Textos da interface', rows: rows['ui-texts'], slugOf: (r) => String(r.slug ?? ''),
    description: 'Textos da interface em PT/EN. A chave (ex. nav.home) é usada pelo site; *palavra* marca destaque em itálico e \\n quebra de linha.',
    fields: [f('key', 'Chave', 'text', true), f('value_pt', 'Texto (PT)', 'textarea', true), f('value_en', 'Texto (EN)', 'textarea')],
  },
];

export const bchiwaleSeed: SiteSeed = {
  project: 'bchiwale',
  name: 'Bchiwale',
  description: 'Website institucional da Bchiwale (geologia, geofísica, geotecnia, ambiente…).',
  components,
  assetsDir: 'bchiwale',
};
