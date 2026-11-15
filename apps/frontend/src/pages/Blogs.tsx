import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/icons';
import { ErrorBox, Modal, PageHead, Spinner } from '../components/ui';
import { api, Project } from '../lib/api';
import { useFetch } from '../lib/hooks';

/** Lista dos blogs do utilizador (projetos do tipo BLOG) + criação de um novo. */
export default function Blogs() {
  const ws = useFetch<{ id: string; name: string }[]>('/workspaces');
  const wid = ws.data?.[0]?.id;
  const projects = useFetch<Project[]>(wid ? `/workspaces/${wid}/projects` : null);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', description: '' });
  const [err, setErr] = useState('');

  const create = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      const p = await api<Project>(`/workspaces/${wid}/projects`, { body: { name: f.name, description: f.description || undefined, kind: 'BLOG' } });
      nav(`/app/blogs/${p.id}`);
    } catch (e) { setErr((e as Error).message); }
  };

  if (ws.loading || projects.loading) return <Spinner />;
  const blogs = (projects.data ?? []).filter((p) => p.kind === 'BLOG');
  return (
    <>
      <PageHead title="Os teus blogs" note="Escreve, estiliza e publica artigos">
        <button className="btn-primary" onClick={() => setOpen(true)}><Icon name="plus" className="w-4 h-4" /> Novo blog</button>
      </PageHead>

      {!blogs.length ? (
        <div className="border border-dashed border-ink/20 rounded-2xl py-16 px-6 text-center bg-white/50">
          <p className="hand text-3xl">Ainda não tens blogs</p>
          <p className="text-sm text-muted mt-1 mb-5">Cria o primeiro e começa a escrever.</p>
          <button className="btn-primary" onClick={() => setOpen(true)}>Criar blog</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {blogs.map((b) => (
            <Link key={b.id} to={`/app/blogs/${b.id}`} className="group sketch-card rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition min-h-[160px]">
              <span className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><Icon name="edit" /></span>
              <h3 className="font-semibold text-xl mt-auto pt-6 break-words">{b.name}</h3>
              <p className="mono text-xs text-muted">/b/{b.slug}</p>
              {b.description && <p className="text-sm text-muted mt-2 line-clamp-2">{b.description}</p>}
            </Link>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Novo blog" onClose={() => setOpen(false)}>
          <form onSubmit={create} className="space-y-4">
            <div><label className="label">Nome do blog</label><input className="input" required minLength={2} autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><label className="label">Descrição (opcional)</label><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            {err && <ErrorBox msg={err} />}
            <button className="btn-primary w-full">Criar blog</button>
          </form>
        </Modal>
      )}
    </>
  );
}
