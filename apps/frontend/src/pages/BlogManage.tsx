import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorBox, Pager, Spinner, StatusBadge } from '../components/ui';
import { api, Component, Entry, Paginated, Project } from '../lib/api';
import { useFetch } from '../lib/hooks';
import { fmtDate } from '../lib/blog';
import { BlogAppearance } from '../components/BlogAppearance';

type Filter = '' | 'DRAFT' | 'PUBLISHED';
const FILTERS: [Filter, string][] = [['', 'Todos'], ['DRAFT', 'Rascunhos'], ['PUBLISHED', 'Publicados']];

/** Painel de um blog: artigos (com estado), publicar/despublicar e definições. */
export default function BlogManage() {
  const { pid = '' } = useParams();
  const nav = useNavigate();
  const project = useFetch<Project>(`/projects/${pid}`);
  const comps = useFetch<Component[]>(`/projects/${pid}/components`);
  const cid = comps.data?.find((c) => c.slug === 'posts')?.id;
  const [filter, setFilter] = useState<Filter>('');
  const [page, setPage] = useState(1);
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { const id = setTimeout(() => { setQ(text); setPage(1); }, 300); return () => clearTimeout(id); }, [text]);
  const entries = useFetch<Paginated<Entry>>(cid ? `/components/${cid}/entries?limit=20&page=${page}${filter ? `&status=${filter}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}` : null);
  const [settings, setSettings] = useState(false);
  const [look, setLook] = useState(false);
  const [f, setF] = useState<{ name: string; description: string } | null>(null);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  if (project.loading || comps.loading) return <Spinner />;
  const p = project.data;
  if (!p || p.kind !== 'BLOG') return <ErrorBox msg={project.error ?? 'Blog não encontrado'} />;
  const url = `${window.location.origin}/b/${p.slug}`;

  const toggle = async (e: Entry) => {
    await api(`/entries/${e.id}/${e.status === 'PUBLISHED' ? 'unpublish' : 'publish'}`, { method: 'POST' });
    entries.reload();
  };
  const save = async (ev: FormEvent) => {
    ev.preventDefault(); setErr(''); setMsg('');
    try { await api(`/projects/${p.id}`, { method: 'PATCH', body: f }); setMsg('Guardado ✓'); project.reload(); } catch (e) { setErr((e as Error).message); }
  };
  const del = async () => {
    if (prompt(`Escreve "${p.slug}" para eliminar o blog e todos os artigos:`) === p.slug) { await api(`/projects/${p.id}`, { method: 'DELETE' }); nav('/app/blogs'); }
  };

  return (
    <>
      <Link to="/app/blogs" className="mono text-[11px] uppercase tracking-wider text-muted hover:text-ink">← Blogs</Link>
      <div className="flex flex-wrap items-end justify-between gap-4 mt-3 mb-8 sm:mb-10">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight break-words">{p.name}</h1>
          <a href={url} target="_blank" rel="noreferrer" className="hand text-2xl text-brandLight hover:text-brand">{url} ↗</a>
        </div>
        <Link to={`/app/blogs/${p.id}/new`} className="btn-primary">+ Novo artigo</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input type="search" className="input !rounded-full !w-auto flex-1 basis-56 max-w-sm" placeholder="Pesquisar artigos…" aria-label="Pesquisar artigos" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-2">
        {FILTERS.map(([v, l]) => (
          <button key={l} onClick={() => { setFilter(v); setPage(1); }}
            className={`mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full border border-ink/15 ${filter === v ? 'bg-ink text-white' : 'bg-white hover:bg-brand/10'}`}>{l}</button>
        ))}
        </div>
      </div>

      {entries.loading && !entries.data ? <Spinner /> : !entries.data?.data.length ? (
        <div className="border border-dashed border-ink/20 rounded-2xl py-14 px-6 text-center bg-white/50">
          <p className="hand text-3xl">{q || filter ? 'Nenhum artigo encontrado' : 'Sem artigos'}</p>
          <p className="text-sm text-muted mt-1 mb-5">{q || filter ? 'Tenta outra pesquisa ou filtro.' : 'Escreve o primeiro artigo deste blog.'}</p>
          {!(q || filter) && <Link to={`/app/blogs/${p.id}/new`} className="btn-primary">Escrever artigo</Link>}
        </div>
      ) : (
        <div className="sketch-card rounded-2xl divide-y divide-ink/10">
          {entries.data.data.map((e) => (
            <div key={e.id} className="p-4 sm:p-5 flex flex-wrap items-center gap-3 sm:gap-5">
              <Link to={`/app/blogs/${p.id}/post/${e.id}`} className="min-w-0 flex-1 basis-60 group">
                <p className="font-semibold group-hover:text-brand transition truncate">{e.data.title || e.slug}</p>
                <p className="mono text-[11px] text-muted mt-0.5">{e.status === 'PUBLISHED' ? `publicado ${fmtDate(e.publishedAt)}` : `editado ${fmtDate(e.updatedAt)}`}</p>
              </Link>
              <StatusBadge s={e.status} />
              <div className="flex gap-2">
                <Link to={`/app/blogs/${p.id}/post/${e.id}`} className="btn-secondary btn-sm">Editar</Link>
                <button onClick={() => toggle(e)} className="btn-secondary btn-sm">{e.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {entries.data && <Pager page={page} pages={entries.data.meta.pages} total={entries.data.meta.total} onPage={setPage} />}

      <div className="mt-14">
        <button className="hand text-2xl text-muted hover:text-ink" onClick={() => setLook(!look)}>{look ? '− Aparência' : '+ Aparência do blog (layout, cores, letra)'}</button>
        {look && <BlogAppearance projectId={p.id} slug={p.slug} initial={p.theme} onSaved={project.reload} />}
      </div>

      <div className="mt-8">
        <button className="hand text-2xl text-muted hover:text-ink" onClick={() => { setSettings(!settings); setF({ name: p.name, description: p.description ?? '' }); }}>
          {settings ? '− Definições' : '+ Definições do blog'}
        </button>
        {settings && f && (
          <form onSubmit={save} className="sketch-card rounded-2xl p-6 space-y-4 mt-4 max-w-2xl">
            <div><label className="label">Nome</label><input className="input" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><label className="label">Descrição</label><textarea className="input" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            {err && <ErrorBox msg={err} />}
            <div className="flex items-center gap-4"><button className="btn-primary">Guardar</button>{msg && <span className="text-sm font-medium">{msg}</span>}
              <button type="button" onClick={del} className="btn-danger ml-auto">Eliminar blog</button></div>
          </form>
        )}
      </div>
    </>
  );
}
