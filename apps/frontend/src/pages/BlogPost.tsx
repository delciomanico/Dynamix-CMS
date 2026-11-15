import { Link, useParams } from 'react-router-dom';
import { BlogShell, useBlog } from '../components/BlogShell';
import { useSeo } from '../lib/seo';
import { plain } from '../lib/markdown';
import { PostArticle } from '../components/PostArticle';
import { useFetch } from '../lib/hooks';
import { blogBase, fmtDate, postPath, postsPath, PostList, readMinutes } from '../lib/blog';
import type { Post } from '../lib/blog';

const W = 'w-full lg:w-4/5 mx-auto px-5 sm:px-8 lg:px-0';

export default function BlogPost() {
  const { project = '', slug = '' } = useParams();
  const { blog, theme } = useBlog(project);
  const { data, loading, error } = useFetch<{ data: Post }>(postPath(project, slug));
  const all = useFetch<PostList>(postsPath(project, 1, 12));
  const p = data?.data;
  const base = blogBase(project);
  const text = p ? plain(p.body) : '';
  useSeo({
    title: p ? `${p.title} — ${blog?.name ?? 'Blog'}` : 'Artigo', type: 'article', image: p?.cover, path: `/b/${project}/${slug}`,
    description: p ? (p.excerpt || (text.length > 160 ? `${text.slice(0, 159).trimEnd()}…` : text)) : undefined,
    jsonLd: p ? { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt || text.slice(0, 160), image: p.cover, datePublished: p.publishedAt, author: { '@type': 'Person', name: p.author || blog?.name }, publisher: { '@type': 'Organization', name: blog?.name }, mainEntityOfPage: `${window.location.origin}/b/${project}/${slug}` } : undefined,
  });
  const { layout } = theme;
  // Sugestões: outros artigos do mesmo blog, os da mesma categoria primeiro (máx. 3).
  const same = (x: Post) => Number(!!p?.category && x.category === p.category);
  const more = (all.data?.data ?? []).filter((x) => x.slug !== slug).sort((a, b) => same(b) - same(a)).slice(0, 3);

  const back = <Link to={base} className="b-link b-muted text-sm transition">← {blog?.name ?? 'Blog'}</Link>;
  const related = p && more.length > 0 && (
    <section className="mt-24 pt-10 b-line border-t">
      <h2 className="b-head text-3xl font-semibold mb-8">Continua a ler</h2>
      <div className={layout === 'minimal' ? 'space-y-6' : 'grid sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-10'}>
        {more.map((x) => (
          <Link key={x.id} to={`${base}/${x.slug}`} className="group block">
            {x.cover && layout !== 'minimal' && <img src={x.cover} alt="" className="w-full aspect-[16/8] object-cover rounded-sm mb-4" />}
            <p className="mono text-[11px] uppercase tracking-wider b-accent">{[x.category, fmtDate(x.publishedAt)].filter(Boolean).join(' · ')}</p>
            <h3 className="b-head text-xl font-semibold tracking-tight mt-1.5 group-hover:b-accent transition">{x.title}</h3>
            {x.excerpt && layout !== 'minimal' && <p className="b-muted text-sm leading-relaxed mt-2 line-clamp-3">{x.excerpt}</p>}
            <p className="mono text-[11px] b-muted mt-2">{readMinutes(x.body)} min de leitura</p>
          </Link>
        ))}
      </div>
    </section>
  );

  const status = (
    <>
      {loading && <p className="hand text-2xl b-muted py-10">A carregar…</p>}
      {!loading && (error || !p) && <p className="hand text-4xl py-10">Artigo não encontrado.</p>}
    </>
  );

  return (
    <BlogShell theme={theme}>
      {layout === 'editorial' ? (
        <div className={`${W} grid lg:grid-cols-[260px_1fr] gap-10 lg:gap-16 pt-10 lg:pt-16`}>
          <aside className="lg:sticky lg:top-16 self-start">
            {back}
            <p className="b-head text-2xl font-semibold mt-6 leading-tight">{blog?.name}</p>
            {blog?.description && <p className="b-muted text-sm leading-relaxed mt-2">{blog.description}</p>}
          </aside>
          <main className="min-w-0">{status}{p && <PostArticle p={p} layout={layout} />}{related}</main>
        </div>
      ) : layout === 'portfolio' ? (
        <main className={`${W} pt-10`}>
          <div className="flex items-center justify-between">{back}<span className="mono text-xs uppercase tracking-wider b-muted">{blog?.name}</span></div>
          <div className="pt-14">{status}{p && <PostArticle p={p} layout={layout} />}</div>
          {related}
        </main>
      ) : layout === 'minimal' ? (
        <main className="max-w-2xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24">
          {back}<div className="mt-10">{status}{p && <PostArticle p={p} layout={layout} />}</div>{related}
        </main>
      ) : (
        <>
          <div className={`${W} pt-10 pb-6 b-line border-b text-center`}>
            <Link to={base} className="b-head text-2xl font-semibold tracking-tight">{blog?.name}</Link>
          </div>
          <main className={`${W} pt-14`}>{status}{p && <PostArticle p={p} layout={layout} />}{related}</main>
        </>
      )}
    </BlogShell>
  );
}
