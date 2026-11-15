import { PostQuery } from '../lib/blog';

export interface FilterState extends Required<Pick<PostQuery, 'sort'>> { q: string; category: string }
export const NO_FILTER: FilterState = { q: '', category: '', sort: 'new' };

/** Pesquisa + categoria + ordenação de um blog público (usa as variáveis de tema do blog). `stack` = versão vertical (painel lateral). */
export function BlogFilters({ value, onChange, categories, stack = false, total }: {
  value: FilterState; onChange: (v: FilterState) => void; categories: string[]; stack?: boolean; total?: number;
}) {
  const active = !!(value.q || value.category || value.sort !== 'new');
  return (
    <div className={stack ? 'space-y-5' : 'space-y-4'}>
      <div className={stack ? 'space-y-3' : 'flex flex-wrap items-center gap-3'}>
        <label className={`relative block ${stack ? '' : 'flex-1 basis-64'}`}>
          <span className="sr-only">Pesquisar artigos</span>
          <input type="search" value={value.q} onChange={(e) => onChange({ ...value, q: e.target.value })} placeholder="Pesquisar artigos…"
            className="w-full b-line border rounded-full bg-transparent px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--b-accent)] placeholder:opacity-50" />
        </label>
        <label className="block">
          <span className="sr-only">Ordenar</span>
          <select value={value.sort} onChange={(e) => onChange({ ...value, sort: e.target.value as FilterState['sort'] })}
            className="w-full b-line border rounded-full bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--b-accent)]">
            <option value="new">Mais recentes</option><option value="old">Mais antigos</option><option value="title">Por título (A–Z)</option>
          </select>
        </label>
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
          {['', ...categories].map((c) => {
            const on = value.category === c;
            return (
              <button key={c || 'all'} type="button" onClick={() => onChange({ ...value, category: c })} aria-pressed={on}
                className={`rounded-full px-3.5 py-1.5 text-sm border transition ${on ? 'b-accent-bg border-transparent' : 'b-line hover:opacity-70'}`}>{c || 'Todas'}</button>
            );
          })}
        </div>
      )}
      {(active || total !== undefined) && (
        <p className="text-sm b-muted">
          {total !== undefined && `${total} artigo${total === 1 ? '' : 's'}`}
          {active && <> · <button type="button" className="underline underline-offset-4 b-link" onClick={() => onChange(NO_FILTER)}>Limpar filtros</button></>}
        </p>
      )}
    </div>
  );
}
