import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Empty, ErrorBox, PageHead, Spinner } from '../components/ui';
import { api, Component, Field, FIELD_TYPES } from '../lib/api';
import { useFetch } from '../lib/hooks';
import { useProject } from './ProjectLayout';

export function ComponentList() {
  const { project } = useProject();
  const { data, loading, reload } = useFetch<Component[]>(`/projects/${project.id}/components`);
  if (loading) return <Spinner />;
  const del = async (c: Component) => {
    if (confirm(`Eliminar "${c.name}" e todos os seus conteúdos?`)) { await api(`/components/${c.id}`, { method: 'DELETE' }); reload(); }
  };
  return (
    <>
      <PageHead title="Components" note="Estruturas de conteúdo do teu website">
        <Link to="new" className="btn-primary">+ Novo componente</Link>
      </PageHead>
      {!data?.length ? (
        <Empty title="Sem componentes" hint="Um componente define os campos de um tipo de conteúdo (ex: Hero, Services).">
          <Link to="new" className="btn-primary">Criar componente</Link>
        </Empty>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {data.map((c) => (
            <div key={c.id} className="sketch-card rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-lg">{c.name}</h3>
                  <p className="mono text-xs text-muted">{c.slug} · {c._count?.entries ?? 0} conteúdos</p>
                </div>
                <div className="flex gap-2">
                  <Link to={c.id} className="btn-secondary btn-sm">Editar</Link>
                  <button onClick={() => del(c)} className="btn-danger btn-sm">×</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {c.fields.map((f) => <span key={f.key} className="badge bg-paper">{f.key}: {f.type}{f.required && '*'}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const blank = (): Field => ({ key: '', label: '', type: 'text', required: false, options: [] });
const toKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export function ComponentBuilder() {
  const { project } = useProject();
  const { cid } = useParams();
  const nav = useNavigate();
  const editing = !!cid;
  const existing = useFetch<Component>(editing ? `/components/${cid}` : null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Field[]>([{ key: 'title', label: 'Title', type: 'text', required: true, options: [] }]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing.data) { setName(existing.data.name); setDescription(existing.data.description ?? ''); setFields(existing.data.fields); }
  }, [existing.data]);

  const upd = (i: number, patch: Partial<Field>) => setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= fields.length) return;
    const c = [...fields]; [c[i], c[j]] = [c[j], c[i]]; setFields(c);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const payload = {
      name, description: description || undefined,
      fields: fields.map((f) => ({ key: f.key, label: f.label, type: f.type, required: f.required, options: f.options })),
    };
    try {
      if (editing) await api(`/components/${cid}`, { method: 'PATCH', body: payload });
      else await api(`/projects/${project.id}/components`, { body: payload });
      nav(`/app/p/${project.id}/components`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  if (editing && existing.loading) return <Spinner />;
  return (
    <form onSubmit={save} className="max-w-3xl">
      <PageHead title={editing ? `Editar ${name}` : 'Novo componente'} note="Define os campos que o teu frontend vai consumir" />
      <div className="sketch-card rounded-2xl p-6 space-y-4 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Nome</label><input className="input" required minLength={2} placeholder="Services" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">Descrição</label><input className="input" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
      </div>

      <h2 className="hand text-3xl font-semibold mb-3">Campos</h2>
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className="rough-border bg-white p-4">
            <div className="grid grid-cols-1 min-[460px]:grid-cols-2 lg:grid-cols-[1fr_1fr_140px_auto] gap-3 items-end">
              <div><label className="label">Label</label>
                <input className="input" required value={f.label} onChange={(e) => upd(i, { label: e.target.value, ...(!editing || !f.id ? { key: toKey(e.target.value) } : {}) })} /></div>
              <div><label className="label">Key (API)</label>
                <input className="input mono" required pattern="[a-z][a-z0-9_]*" value={f.key} onChange={(e) => upd(i, { key: e.target.value })} /></div>
              <div><label className="label">Tipo</label>
                <select className="input" value={f.type} onChange={(e) => upd(i, { type: e.target.value })}>{FIELD_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="flex flex-wrap items-center gap-1 min-[460px]:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-1.5 text-xs font-bold mr-2"><input type="checkbox" checked={f.required} onChange={(e) => upd(i, { required: e.target.checked })} /> obrig.</label>
                <button type="button" className="btn-secondary btn-sm" onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="btn-secondary btn-sm" onClick={() => move(i, 1)}>↓</button>
                <button type="button" className="btn-danger btn-sm" onClick={() => setFields(fields.filter((_, j) => j !== i))}>×</button>
              </div>
            </div>
            {(f.type === 'select' || f.type === 'multiselect') && (
              <div className="mt-3"><label className="label">Opções (separadas por vírgula)</label>
                <input className="input" value={f.options.join(', ')} onChange={(e) => upd(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} /></div>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary mt-4" onClick={() => setFields([...fields, blank()])}>+ Adicionar campo</button>

      {err && <div className="mt-5"><ErrorBox msg={err} /></div>}
      <div className="flex gap-3 mt-8">
        <button className="btn-primary" disabled={busy || !fields.length}>{busy ? 'A guardar…' : 'Guardar componente'}</button>
        <Link to={`/app/p/${project.id}/components`} className="btn-secondary">Cancelar</Link>
      </div>
    </form>
  );
}
