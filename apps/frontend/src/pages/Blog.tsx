import { Link, useParams } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { BlogFilters, FilterState, NO_FILTER } from '../components/BlogFilters';
import { BlogShell, useBlog } from '../components/BlogShell';
import { useSeo } from '../lib/seo';
import { useFetch } from '../lib/hooks';
import { blogBase, BlogInfo, fmtDate, postsPath, Post, PostList, readMinutes } from '../lib/blog';
import type { ResolvedTheme } from '../lib/theme';

const W = 'w-full lg:w-4/5 mx-auto px-5 sm:px-8 lg:px-0';
const meta = (p: Post) => [p.category, fmtDate(p.publishedAt)].filter(Boolean).join(' · ');
const Cover = ({ p, ratio = 'aspect-[16/9]', letter }: { p: Post; ratio?: string; letter?: string }) =>
  p.cover ? <img src={p.cover} alt="" className={`w-full ${ratio} object-cover`} />
    : <div className={`w-full ${ratio} b-surface flex items-center justify-center b-head text-6xl b-accent opacity-70`}>{letter ?? p.title.slice(0, 1)}</div>;

type LP = { base: string; blog: BlogInfo; posts: Post[]; filters: ReactNode; sideFilters: ReactNode };

/** Revista: cabeçalho central, artigo em destaque e grelha. */
function Magazine({ base, blog, posts, filters }: LP) {
  const [first, ...rest] = posts;
  return (
    <>
      <header className={`${W} pt-14 pb-10 text-center`}>
        <p className="mono text-[11px] uppercase tracking-[.3em] b-muted">{posts.length} artigos</p>
        <h1 className="b-head text-5xl sm:text-7xl font-semibold tracking-tight mt-3 break-words">{blog.name}</h1>
        {blog.description && <p className="b-muted text-lg mt-4 max-w-2xl mx-auto">{blog.description}</p>}
        <div className="b-line border-t border-b mt-10 py-3 mono text-[11px] uppercase tracking-[.25em] b-muted">Últimos artigos</div>
      </header>
      <main className={`${W}`}>
        <div className="mb-12">{filters}</div>
        {first && (
          <Link to={`${base}/${first.slug}`} className="group grid md:grid-cols-2 gap-8 items-center mb-16">
            <div className="overflow-hidden rounded-sm"><div className="group-hover:scale-[1.03] transition duration-500"><Cover p={first} ratio="aspect-[4/3]" /></div></div>
            <div>
              <p className="mono text-[11px] uppercase tracking-wider b-accent">{meta(first)}</p>
              <h2 className="b-head text-3xl sm:text-5xl font-semibold tracking-tight mt-3 leading-[1.05]">{first.title}</h2>
              {first.excerpt && <p className="b-muted text-lg leading-relaxed mt-4">{first.excerpt}</p>}
              <p className="b-accent mt-5 font-medium">Ler artigo → <span className="b-muted text-sm">{readMinutes(first.body)} min</span></p>
            </div>
          </Link>
        )}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-14">
          {rest.map((p) => (
            <Link key={p.id} to={`${base}/${p.slug}`} className="group block">
              <div className="overflow-hidden rounded-sm mb-4"><div className="group-hover:scale-[1.03] transition duration-500"><Cover p={p} /></div></div>
              <p className="mono text-[11px] uppercase tracking-wider b-accent">{meta(p)}</p>
              <h3 className="b-head text-2xl font-semibold tracking-tight mt-1.5 leading-tight">{p.title}</h3>
              {p.excerpt && <p className="b-muted mt-2 line-clamp-2">{p.excerpt}</p>}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

/** Portefólio: apresentação à esquerda e mosaico numerado de “trabalhos”. */
function Portfolio({ base, blog, posts, filters }: LP) {
  const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];
  return (
    <>
      <div className={`${W} pt-8 flex items-center justify-between mono text-xs uppercase tracking-wider b-muted`}>
        <span>{blog.name}</span><span>© {new Date().getFullYear()}</span>
      </div>
      <header className={`${W} pt-20 sm:pt-32 pb-16`}>
        <h1 className="b-head text-6xl sm:text-8xl lg:text-9xl font-semibold tracking-tighter leading-[.9] break-words">{blog.name}<span className="b-accent">.</span></h1>
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end mt-10">
          {blog.description && <p className="text-xl sm:text-2xl max-w-xl leading-snug b-muted">{blog.description}</p>}
          {!!cats.length && <div className="flex flex-wrap gap-2">{cats.map((c) => <span key={c} className="b-line border rounded-full px-4 py-1.5 text-sm">{c}</span>)}</div>}
        </div>
      </header>
      <div className={`${W} mb-10`}>{filters}</div>
      <main className={`${W} grid sm:grid-cols-2 gap-6`}>
        {posts.map((p, i) => (
          <Link key={p.id} to={`${base}/${p.slug}`} className={`group block ${i % 3 === 0 ? 'sm:col-span-2' : ''}`}>
            <div className="relative overflow-hidden rounded-2xl">
              <div className="group-hover:scale-[1.04] transition duration-700"><Cover p={p} ratio={i % 3 === 0 ? 'aspect-[21/9]' : 'aspect-[4/3]'} letter={String(i + 1).padStart(2, '0')} /></div>
              <span className="absolute top-4 left-4 mono text-xs b-accent-bg rounded-full px-3 py-1">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="flex items-baseline justify-between gap-4 mt-4">
              <h2 className="b-head text-2xl sm:text-3xl font-semibold tracking-tight group-hover:b-accent transition">{p.title}</h2>
              <span className="mono text-xs b-muted shrink-0">{p.category}</span>
            </div>
          </Link>
        ))}
      </main>
    </>
  );
}

/** Minimalista: coluna estreita, lista de títulos e datas. */
function Minimal({ base, blog, posts, filters }: LP) {
  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-8 pt-24 sm:pt-32">
      <h1 className="b-head text-3xl sm:text-4xl font-semibold tracking-tight">{blog.name}</h1>
      {blog.description && <p className="b-muted text-lg leading-relaxed mt-3">{blog.description}</p>}
      <div className="mt-12">{filters}</div>
      <ul className="mt-10">
        {posts.map((p) => (
          <li key={p.id} className="b-line border-t first:border-t-0">
            <Link to={`${base}/${p.slug}`} className="group grid sm:grid-cols-[7rem_1fr] gap-1 sm:gap-6 py-6">
              <span className="mono text-xs b-muted pt-1.5">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}</span>
              <span>
                <span className="b-head text-xl font-semibold group-hover:b-accent transition">{p.title}</span>
                {p.excerpt && <span className="block b-muted mt-1 line-clamp-2">{p.excerpt}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

/** Editorial: painel lateral fixo com a identidade e feed de artigos. */
function Editorial({ base, blog, posts, sideFilters }: LP) {
  return (
    <div className={`${W} grid lg:grid-cols-[320px_1fr] gap-10 lg:gap-16 pt-12 lg:pt-0`}>
      <aside className="lg:sticky lg:top-0 lg:h-screen lg:py-16 flex flex-col">
        <div className="b-accent-bg w-14 h-14 rounded-full flex items-center justify-center b-head text-2xl font-semibold">{blog.name.slice(0, 1)}</div>
        <h1 className="b-head text-4xl font-semibold tracking-tight mt-6 leading-tight break-words">{blog.name}</h1>
        {blog.description && <p className="b-muted leading-relaxed mt-3">{blog.description}</p>}
        <div className="mt-8">{sideFilters}</div>
        <p className="mono text-[11px] uppercase tracking-wider b-muted mt-auto pt-8">{posts.length} artigos</p>
      </aside>
      <main className="lg:py-16 space-y-12">
        {posts.map((p) => (
          <Link key={p.id} to={`${base}/${p.slug}`} className="group grid sm:grid-cols-[1fr_220px] gap-6 items-start b-line border-b pb-12 last:border-0">
            <div>
              <p className="mono text-[11px] uppercase tracking-wider b-accent">{meta(p)}</p>
              <h2 className="b-head text-2xl sm:text-4xl font-semibold tracking-tight mt-2 leading-tight group-hover:b-accent transition">{p.title}</h2>
              {p.excerpt && <p className="b-muted text-lg leading-relaxed mt-3">{p.excerpt}</p>}
              <p className="mono text-xs b-muted mt-4">{readMinutes(p.body)} min de leitura</p>
            </div>
            {p.cover && <img src={p.cover} alt="" className="w-full aspect-square object-cover rounded-xl order-first sm:order-none" />}
          </Link>
        ))}
      </main>
    </div>
  );
}

const LAYOUTS: Record<ResolvedTheme['layout'], (p: LP) => JSX.Element> = { magazine: Magazine, portfolio: Portfolio, minimal: Minimal, editorial: Editorial };

/** Lista pública de um blog em /b/:project — cada blog usa o seu layout, paleta e tipografia. */
export default function Blog() {
  const project = useParams().project ?? '';
  const [page, setPage] = useState(1);
  const [f, setF] = useState<FilterState>(NO_FILTER);
  const [q, setQ] = useState('');
  useEffect(() => { const id = setTimeout(() => setQ(f.q), 300); return () => clearTimeout(id); }, [f.q]); // pesquisa com atraso
  useEffect(() => setPage(1), [q, f.category, f.sort]);
  const { blog, theme, loading: li, error: ie } = useBlog(project);
  const { data, loading, error } = useFetch<PostList>(postsPath(project, page, 12, { q, category: f.category, sort: f.sort }));
  const everything = useFetch<PostList>(postsPath(project, 1, 100)); // para listar as categorias
  const categories = [...new Set((everything.data?.data ?? []).map((p) => p.category).filter(Boolean))].sort() as string[];
  const posts = data?.data ?? [];
  const Layout = LAYOUTS[theme.layout];
  useSeo({ title: blog?.name ?? 'Blog', description: blog?.description || (blog ? `Artigos do blog ${blog.name}.` : undefined), image: posts.find((p) => p.cover)?.cover, path: `/b/${project}`, jsonLd: blog ? { '@context': 'https://schema.org', '@type': 'Blog', name: blog.name, description: blog.description, url: `${window.location.origin}/b/${project}` } : undefined });
  const filtering = !!(q || f.category);
  const bar = (stack: boolean) => <BlogFilters value={f} onChange={setF} categories={categories} stack={stack} total={filtering ? data?.meta.total : undefined} />;
  const hasAny = (everything.data?.meta.total ?? 0) > 0;

  return (
    <BlogShell theme={theme}>
      {(li || (loading && !data)) && <p className="hand text-2xl b-muted text-center pt-32">A carregar…</p>}
      {!li && !loading && (ie || !blog) && <p className="hand text-4xl text-center pt-32">Blog não encontrado.</p>}
      {blog && !error && !loading && !hasAny && !posts.length && <p className="hand text-4xl text-center pt-32">Ainda não há artigos.</p>}
      {blog && (hasAny || posts.length > 0) && (
        <>
          <Layout base={blogBase(project)} blog={blog} posts={posts} filters={bar(false)} sideFilters={bar(true)} />
          {!posts.length && !loading && (
            <div className={`${W} text-center py-16`}>
              <p className="b-head text-3xl">Nenhum artigo encontrado.</p>
              <button className="underline underline-offset-4 b-link mt-3" onClick={() => setF(NO_FILTER)}>Limpar filtros</button>
            </div>
          )}
        </>
      )}
      {data && data.meta.pages > 1 && (
        <div className={`${W} flex items-center justify-between mt-12`}>
          <button className="b-line border rounded-full px-4 py-2 text-sm disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Anterior</button>
          <span className="mono text-xs b-muted">{page} / {data.meta.pages}</span>
          <button className="b-line border rounded-full px-4 py-2 text-sm disabled:opacity-40" disabled={page >= data.meta.pages} onClick={() => setPage(page + 1)}>Seguinte →</button>
        </div>
      )}
    </BlogShell>
  );
}
