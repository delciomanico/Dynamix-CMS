import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../lib/hooks';
import { BlogInfo, infoPath } from '../lib/blog';
import { resolveTheme, ResolvedTheme } from '../lib/theme';

/** Carrega o blog e o seu tema (cada blog tem cores, tipografia e layout próprios). */
export function useBlog(project: string) {
  const info = useFetch<{ data: BlogInfo }>(infoPath(project));
  const blog = info.data?.data;
  const theme = resolveTheme(project, blog?.theme);
  return { blog, theme, loading: info.loading, error: info.error };
}

/** Moldura do blog: aplica as variáveis do tema e um rodapé discreto. A navegação de cada layout é desenhada pelo próprio layout. */
export function BlogShell({ theme, children }: { theme: ResolvedTheme; children: ReactNode }) {
  return (
    <div className="b-shell" style={theme.style} data-layout={theme.layout}>
      {children}
      <footer className="b-line border-t mt-24">
        <div className="w-full lg:w-4/5 mx-auto px-5 sm:px-8 lg:px-0 py-8 flex flex-wrap items-center justify-between gap-3 text-sm b-muted">
          <Link to="/blog" className="b-link transition">← Todos os blogs</Link>
          <span>Feito com <Link to="/" className="b-link underline underline-offset-4">Dynamix</Link></span>
        </div>
      </footer>
    </div>
  );
}
