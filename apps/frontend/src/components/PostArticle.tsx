import { Markdown } from '../lib/markdown';
import { fmtDate, readMinutes } from '../lib/blog';

export interface PostView { title: string; body: string; author?: string; category?: string; cover?: string; publishedAt?: string }

/** Vista de leitura de um artigo — usada na página pública (por layout) e na pré-visualização do editor. */
export function PostArticle({ p, layout = 'magazine' }: { p: PostView; layout?: string }) {
  const meta = [p.category, fmtDate(p.publishedAt), p.body ? `${readMinutes(p.body)} min` : ''].filter(Boolean).join(' · ');
  const center = layout === 'magazine';
  return (
    <article>
      <header className={center ? 'text-center' : ''}>
        <p className="mono text-[11px] uppercase tracking-wider b-accent">{meta}</p>
        <h1 className={`b-head font-semibold tracking-tight leading-[1.05] mt-3 break-words b-fg ${layout === 'portfolio' ? 'text-4xl sm:text-7xl' : layout === 'minimal' ? 'text-3xl sm:text-4xl' : 'text-3xl sm:text-6xl'}`}>{p.title || 'Sem título'}</h1>
        {p.author && <p className="b-muted mt-4">por <span className="b-fg font-medium">{p.author}</span></p>}
      </header>
      {p.cover && <img src={p.cover} alt="" className={`w-full object-cover mt-10 ${layout === 'minimal' ? 'rounded-md' : layout === 'portfolio' ? 'rounded-2xl' : 'rounded-sm'}`} />}
      <div className={`mt-10 ${center ? 'max-w-3xl mx-auto' : ''}`}><Markdown text={p.body} /></div>
    </article>
  );
}
