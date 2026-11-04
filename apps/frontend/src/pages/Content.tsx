import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Empty, ErrorBox, Modal, PageHead, Pager, Spinner, StatusBadge } from '../components/ui';
import { api, Component, Entry, Field, Media, Paginated, mediaUrl } from '../lib/api';
import { useFetch } from '../lib/hooks';
import { useProject } from './ProjectLayout';

export function ContentIndex() {
  const { project } = useProject();
  const { data, loading } = useFetch<Component[]>(`/projects/${project.id}/components`);
  if (loading) return <Spinner />;
  return (
    <>
      <PageHead title="Content" note="Escolhe um componente" />
      {!data?.length ? (
        <Empty title="Primeiro, cria um componente" hint="Os conteúdos são criados a partir da estrutura de um componente.">
          <Link to={`/app/p/${project.id}/components/new`} className="btn-primary">Criar componente</Link>
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((c, i) => (
            <Link key={c.id} to={c.id} className={`rounded-2xl border-[1.5px] border-ink shadow-[4px_5px_0_#1A2233] p-5 block hover:-translate-y-1 transition ${i % 3 === 0 ? 'bg-brand text-white' : i % 3 === 1 ? 'bg-white' : 'bg-brand/10'}`}>
              <span className="mono text-[10px] uppercase tracking-wider opacity-60">{c.fields.length} campos</span>
              <h3 className="font-extrabold text-xl mt-1">{c.name}</h3>
              <p className="mono text-xs opacity-70 mt-4">{c._count?.entries ?? 0} conteúdos →</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function FieldInput({ f, value, onChange, media }: { f: Field; value: any; onChange: (v: any) => void; media: Media[] }) {
  const v = value ?? '';
  switch (f.type) {
    case 'textarea': case 'richtext': return <textarea className="input" rows={f.type === 'richtext' ? 6 : 3} value={v} onChange={(e) => onChange(e.target.value)} />;
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
  const entries = useFetch<Paginated<Entry>>(`/components/${cid}/entries?page=${page}&limit=20`);
  const media = useFetch<Paginated<Media>>(`/projects/${project.id}/media?limit=100`);
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
  const thumb = (e: Entry) => { const f = c.fields.find((f) => f.type === 'image'); return f && e.data[f.key] ? mediaUrl(project.slug, e.data[f.key]) : null; };

  return (
    <>
      <PageHead title={c.name} note="Conteúdos">
        <button className="btn-secondary" onClick={() => nav(`/app/p/${project.id}/content`)}>← Componentes</button>
        <button className="btn-primary" onClick={() => open('new')}>+ Novo conteúdo</button>
      </PageHead>

      {!entries.data?.data.length ? <Empty title="Sem conteúdos" hint="Cria o primeiro registo e publica-o para aparecer na API pública." /> : (
        <div className="sketch-card rounded-2xl divide-y divide-ink/10 overflow-hidden">
          {entries.data.data.map((e) => (
            <div key={e.id} className="p-4 flex flex-wrap items-center gap-x-4 gap-y-3">
              {thumb(e) ? <img src={thumb(e)!} className="w-12 h-12 rounded-lg object-cover border border-ink/30" /> : <div className="w-12 h-12 rounded-lg bg-brand/40 border border-ink/30" />}
              <div className="flex-1 min-w-[140px] basis-[160px]">
                <div className="font-bold">{String(title(e))}</div>
                <div className="mono text-xs text-muted">{e.slug}</div>
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
