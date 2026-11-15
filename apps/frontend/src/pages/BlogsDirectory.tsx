import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { useSeo } from '../lib/seo';
import { useFetch } from '../lib/hooks';
import { blogBase, BlogDirectory, blogsPath, fmtDate } from '../lib/blog';

/** /blog — diretório público com os blogs existentes na plataforma. */
export default function BlogsDirectory() {
  useSeo({ title: 'Blogs', description: 'Descobre os blogs criados com o Dynamix-CMS e lê os artigos mais recentes da comunidade.', path: '/blog' });
  const [page, setPage] = useState(1);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { const id = setTimeout(() => { setQ(text); setPage(1); }, 300); return () => clearTimeout(id); }, [text]);
  const { data, loading, error } = useFetch<BlogDirectory>(blogsPath(page, 12, q));
  const blogs = data?.data ?? [];

  return (
    <>
      <Navbar />
      <main>
        <section className="w-full lg:w-4/5 mx-auto px-5 sm:px-8 lg:px-0 pt-16 sm:pt-24 pb-12">
          <h1 className="hero-title font-semibold">Blogs</h1>
          <p className="hand text-3xl sm:text-4xl text-brandLight mt-4">Descobre o que a comunidade está a escrever.</p>
        </section>

        <section className="w-full lg:w-4/5 mx-auto px-5 sm:px-8 lg:px-0 pb-24">
          <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Pesquisar blogs…" aria-label="Pesquisar blogs"
            className="input !rounded-full !px-5 max-w-md mb-10" />
          {loading && !data && <p className="hand text-2xl text-muted py-10">A carregar…</p>}
          {!loading && q && !blogs.length && <p className="hand text-3xl py-8">Nenhum blog encontrado para “{q}”.</p>}
          {!loading && !q && (error || !blogs.length) && (
            <div className="py-12">
              <p className="hand text-3xl">Ainda não há blogs publicados.</p>
              <p className="text-sm text-muted mt-2">Cria o teu e publica o primeiro artigo.</p>
              <Link to="/register" className="btn-primary mt-5 inline-flex">Criar conta</Link>
            </div>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
            {blogs.map((b) => (
              <Link key={b.slug} to={blogBase(b.slug)} className="group block">
                {b.cover
                  ? <img src={b.cover} alt="" className="w-full aspect-[16/9] object-cover rounded-2xl mb-5" />
                  : <div className="w-full aspect-[16/9] rounded-2xl mb-5 bg-brand/10 flex items-center justify-center hand text-5xl text-brand/40">{b.name.slice(0, 1)}</div>}
                <p className="mono text-[11px] uppercase tracking-wider text-muted">{b.posts} artigo{b.posts === 1 ? '' : 's'}{b.lastPublishedAt ? ` · ${fmtDate(b.lastPublishedAt)}` : ''}</p>
                <h2 className="text-2xl font-semibold tracking-tight mt-1.5 group-hover:text-brand transition break-words">{b.name}</h2>
                {b.description && <p className="text-muted leading-relaxed mt-2 line-clamp-2">{b.description}</p>}
                {b.lastTitle && <p className="hand text-xl text-brandLight mt-3 line-clamp-1">Último: {b.lastTitle}</p>}
              </Link>
            ))}
          </div>

          {data && data.meta.pages > 1 && (
            <div className="flex items-center justify-between mt-10">
              <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Anterior</button>
              <span className="mono text-xs text-muted">{page} / {data.meta.pages}</span>
              <button className="btn-secondary btn-sm" disabled={page >= data.meta.pages} onClick={() => setPage(page + 1)}>Seguinte →</button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
