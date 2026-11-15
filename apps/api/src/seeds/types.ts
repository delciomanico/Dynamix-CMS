export interface SeedField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

export interface SeedComponent {
  slug: string;
  name: string;
  description?: string;
  fields: SeedField[];
  /** Linhas do seed, pela ordem em que devem aparecer no site. */
  rows: Record<string, unknown>[];
  /** Slug estável de cada linha (defeito: row.slug). */
  slugOf?: (row: Record<string, unknown>, index: number) => string;
}

export interface SiteSeed {
  /** Slug do projeto = {project} na API pública. */
  project: string;
  name: string;
  description?: string;
  components: SeedComponent[];
  /** Dono dedicado do projeto (utilizador normal + workspace próprio). Sem isto, o dono é o ADMIN_EMAIL. */
  owner?: { email: string; name: string };
  /** Pasta (em apps/api/seed-assets) com os ficheiros referenciados por caminho (/images/x.jpg) nas linhas. */
  assetsDir?: string;
}
