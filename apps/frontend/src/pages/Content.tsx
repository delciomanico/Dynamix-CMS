import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Empty, ErrorBox, Modal, PageHead, Pager, Spinner, StatusBadge } from '../components/ui';
import { api, Component, Entry, Field, Media, Paginated, mediaUrl } from '../lib/api';
import { useFetch } from '../lib/hooks';
import { useProject } from './ProjectLayout';

export function ContentIndex() {
  const { project } = useProject();
  const { data, loading } = useFetch<Component[]>(`/projects/${project.id}/components`);
  const [filter, setFilter] = useState('');
  if (loading) return <Spinner />;
  // "Home · Números" → grupo "Home", título "Números"; sem " · " fica em "Conteúdo"
  const groupOf = (n: string) => (n.includes(' · ') ? n.split(' · ')[0] : 'Conteúdo');
  const shortName = (n: string) => (n.includes(' · ') ? n.split(' · ').slice(1).join(' · ') : n);
  const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const shown = (data ?? []).filter((c) => !filter.trim() || norm(`${c.name} ${c.slug} ${c.description ?? ''}`).includes(norm(filter.trim())));
  const groups = Object.entries(shown.reduce<Record<string, Component[]>>((acc, c) => { (acc[groupOf(c.name)] ??= []).push(c); return acc; }, {}));
  return (
    <>
      <PageHead title="Content" note="Escolhe um componente" />
      {!data?.length ? (
        <Empty title="Primeiro, cria um componente" hint="Os conteúdos são criados a partir da estrutura de um componente.">
          <Link to={`/app/p/${project.id}/components/new`} className="btn-primary">Criar componente</Link>
        </Empty>
      ) : (
        <>
        {data.length > 6 && <input className="input mb-5 max-w-sm" type="search" placeholder="Pesquisar componentes…" value={filter} onChange={(e) => setFilter(e.target.value)} />}
        {!shown.length && <Empty title="Nenhum componente encontrado" hint="Tenta outra pesquisa." />}
        {groups.map(([g, list]) => (
          <section key={g} className="mb-8">
            {groups.length > 1 && <h2 className="mono text-xs uppercase tracking-widest text-muted mb-3">{g} <span className="opacity-60">· {list.length}</span></h2>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {list.map((c, i) => (
                <Link key={c.id} to={c.id} className={`rounded-2xl border-[1.5px] border-ink shadow-[4px_5px_0_#1A2233] p-5 block hover:-translate-y-1 transition ${i % 3 === 0 ? 'bg-brand text-white' : i % 3 === 1 ? 'bg-white' : 'bg-brand/10'}`}>
                  <span className="mono text-[10px] uppercase tracking-wider opacity-60">{c.fields.length} campos</span>
                  <h3 className="font-extrabold text-xl mt-1">{shortName(c.name)}</h3>
                  <p className="mono text-xs opacity-70 mt-4">{c._count?.entries ?? 0} conteúdos →</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
        </>
      )}
    </>
  );
}

function JsonInput({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const [text, setText] = useState(() => (value === undefined ? '' : JSON.stringify(value, null, 2)));
  const [bad, setBad] = useState(false);
  return (
    <>
      <textarea className="input mono text-xs" rows={8} value={text} onChange={(e) => {
        setText(e.target.value);
        if (!e.target.value.trim()) { setBad(false); return onChange(undefined); }
        try { onChange(JSON.parse(e.target.value)); setBad(false); } catch { setBad(true); }
      }} />
      {bad && <p className="text-xs text-red-600 mt-1">JSON inválido — as alterações deste campo não são guardadas até ser corrigido.</p>}
    </>
  );
}

function FieldInput({ f, value, onChange, media }: { f: Field; value: any; onChange: (v: any) => void; media: Media[] }) {
  const v = value ?? '';
  switch (f.type) {
    case 'textarea': case 'richtext': return <textarea className="input" rows={f.type === 'richtext' ? 6 : 3} value={v} onChange={(e) => onChange(e.target.value)} />;
    case 'json': return <JsonInput value={value} onChange={onChange} />;
    case 'number': return <input className="input" type="number" step="any" value={v} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'boolean': return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> Ativo</label>;
    case 'date': return <input className="input" type="date" value={String(v).slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
    case 'url': return <input className="input" type="url" placeholder="https://" value={v} onChange={(e) => onChange(e.target.value)} />;
    case 'email': return <input className="input" type="email" value={v} onChange={(e) => onChange(e.target.value)} />;
    case 'select': return <select className="input" value={v} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>;
    case 'multiselect': return (
      <div className="flex flex-wrap gap-3">{f.options.map((o) => (
        <label key={o} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={(value ?? []).includes(o)}
          onChange={(e) => onChange(e.target.checked ? [...(value ?? []), o] : (value ?? []).filter((x: string) => x !== o))} /> {o}</label>))}</div>);
    case 'image': case 'file': return (
      <select className="input" value={v} onChange={(e) => onChange(e.target.value)}>
        <option value="">— escolher da Media Library —</option>
        {media.filter((m) => f.type === 'file' || m.mimeType.startsWith('image/')).map((m) => <option key={m.id} value={m.id}>{m.filename}</option>)}
      </select>);
    default: return <input className="input" value={v} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function ContentList() {
  const { project } = useProject();
  const { cid } = useParams();
  const nav = useNavigate();
  const comp = useFetch<Component>(`/components/${cid}`);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qd, setQd] = useState(''); // pesquisa com debounce
  const [section, setSection] = useState('');
  useEffect(() => { const t = setTimeout(() => { setQd(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const sections = useFetch<{ section: string; count: number }[]>(`/components/${cid}/sections`);
  const hasSections = (sections.data?.length ?? 0) > 1;
  const entries = useFetch<Paginated<Entry>>(
    `/components/${cid}/entries?page=${page}&limit=${hasSections ? 50 : 20}${qd ? `&q=${encodeURIComponent(qd)}` : ''}${section ? `&section=${encodeURIComponent(section)}` : ''}${hasSections ? '&sort=slug' : ''}`,
  );
  const media = useFetch<Paginated<Media>>(`/projects/${project.id}/media?limit=100`);
  // se apagar o último item de uma página, recua para a última página existente
  useEffect(() => { if (entries.data && !entries.data.data.length && page > 1) setPage(Math.max(1, entries.data.meta.pages)); }, [entries.data, page]);
  const [editing, setEditing] = useState<Entry | 'new' | null>(null);
  const [data, setData] = useState<Record<string, any>>({});
  const [err, setErr] = useState<string[]>([]);

  if (comp.loading || (entries.loading && !entries.data)) return <Spinner />;
  if (!comp.data) return <ErrorBox msg={comp.error ?? 'Componente não encontrado'} />;
  const c = comp.data;

  const open = (e: Entry | 'new') => { setEditing(e); setData(e === 'new' ? {} : e.data); setErr([]); };
  const save = async (ev: FormEvent) => {
    ev.preventDefault(); setErr([]);
    try {
      if (editing === 'new') await api(`/components/${cid}/entries`, { body: { data } });
      else await api(`/entries/${(editing as Entry).id}`, { method: 'PATCH', body: { data } });
      setEditing(null); entries.reload();
    } catch (e: any) { setErr(e.details?.length ? e.details : [e.message]); }
  };
  const act = async (id: string, a: 'publish' | 'unpublish' | 'archive') => { await api(`/entries/${id}/${a}`, { method: 'POST' }); entries.reload(); };
  const del = async (id: string) => { if (confirm('Eliminar este conteúdo?')) { await api(`/entries/${id}`, { method: 'DELETE' }); entries.reload(); } };
  const title = (e: Entry) => e.data[c.fields.find((f) => f.type === 'text')?.key ?? ''] ?? e.slug;
  // 1.º campo de texto longo preenchido (ex.: o texto PT), para reconhecer a entrada sem abrir
  const preview = (e: Entry) => { const f = c.fields.find((f) => (f.type === 'textarea' || f.type === 'richtext') && typeof e.data[f.key] === 'string' && e.data[f.key]); return f ? String(e.data[f.key]).slice(0, 120) : ''; };
  const thumb = (e: Entry) => { const f = c.fields.find((f) => f.type === 'image'); return f && e.data[f.key] ? mediaUrl(project.slug, e.data[f.key]) : null; };

  return (
    <>
      <PageHead title={c.name} note={entries.data ? `${entries.data.meta.total} conteúdos${qd || section ? ' (filtrado)' : ''}` : 'Conteúdos'}>
        <button className="btn-secondary" onClick={() => nav(`/app/p/${project.id}/content`)}>← Componentes</button>
        <button className="btn-primary" onClick={() => open('new')}>+ Novo conteúdo</button>
      </PageHead>

      <input className="input mb-4 max-w-md" type="search" placeholder="Pesquisar por título, chave ou texto…" value={q} onChange={(e) => setQ(e.target.value)} />
      {hasSections && (
        <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filtrar por secção">
          {[{ section: '', count: sections.data!.reduce((n, x) => n + x.count, 0) }, ...sections.data!].map((x) => (
            <button key={x.section || 'all'} type="button" onClick={() => { setSection(x.section); setPage(1); }}
              className={`mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full border-[1.5px] border-ink ${section === x.section ? 'bg-ink text-white' : 'bg-white hover:bg-brand/20'}`}>
              {x.section || 'Todas'} <span className="opacity-60">{x.count}</span>
            </button>
          ))}
        </div>
      )}

      {!entries.data?.data.length ? <Empty title={qd || section ? 'Nada encontrado' : 'Sem conteúdos'} hint={qd || section ? 'Tenta outra pesquisa ou secção.' : 'Cria o primeiro registo e publica-o para aparecer na API pública.'} /> : (
        <div className="sketch-card rounded-2xl divide-y divide-ink/10 overflow-hidden">
          {entries.data.data.map((e) => (
            <div key={e.id} className="p-4 flex flex-wrap items-center gap-x-4 gap-y-3">
              {thumb(e) ? <img src={thumb(e)!} className="w-12 h-12 rounded-lg object-cover border border-ink/30" /> : <div className="w-12 h-12 rounded-lg bg-brand/40 border border-ink/30" />}
              <div className="flex-1 min-w-[140px] basis-[160px]">
                <div className="font-bold">{String(title(e))}</div>
                <div className="mono text-xs text-muted">{e.slug}</div>
                {preview(e) && <div className="text-xs text-muted mt-0.5 line-clamp-1">{preview(e)}</div>}
              </div>
              <StatusBadge s={e.status} />
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {e.status === 'PUBLISHED'
                  ? <button className="btn-secondary btn-sm" onClick={() => act(e.id, 'unpublish')}>Despublicar</button>
                  : <button className="btn-primary btn-sm" onClick={() => act(e.id, 'publish')}>Publicar</button>}
                <button className="btn-secondary btn-sm" onClick={() => open(e)}>Editar</button>
                {e.status !== 'ARCHIVED' && <button className="btn-secondary btn-sm" onClick={() => act(e.id, 'archive')}>Arquivar</button>}
                <button className="btn-danger btn-sm" onClick={() => del(e.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {entries.data && <Pager {...entries.data.meta} onPage={setPage} />}

      {editing && (
        <Modal title={editing === 'new' ? `Novo ${c.name}` : `Editar ${c.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {c.fields.map((f) => (
              <div key={f.key}>
                <label className="label">{f.label}{f.required && ' *'} <span className="normal-case tracking-normal">· {f.type}</span></label>
                <FieldInput f={f} value={data[f.key]} onChange={(v) => setData({ ...data, [f.key]: v })} media={media.data?.data ?? []} />
              </div>
            ))}
            {err.length > 0 && <ErrorBox msg={err.join(' · ')} />}
            <button className="btn-primary w-full">Guardar como rascunho</button>
          </form>
        </Modal>
      )}
    </>
  );
}
