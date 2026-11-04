import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/icons';
import { ErrorBox, Modal, Spinner } from '../components/ui';
import { api, Project } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useFetch } from '../lib/hooks';

const tones = ['bg-brand text-white', 'bg-white', 'bg-brand/10'];

export default function Projects() {
  const { user } = useAuth();
  const ws = useFetch<{ id: string; name: string }[]>('/workspaces');
  const wid = ws.data?.[0]?.id;
  const projects = useFetch<Project[]>(wid ? `/workspaces/${wid}/projects` : null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', frontendUrl: '', description: '' });
  const [err, setErr] = useState('');

  const create = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      await api(`/workspaces/${wid}/projects`, { body: { name: f.name, description: f.description || undefined, frontendUrl: f.frontendUrl || undefined } });
      setOpen(false); setF({ name: '', frontendUrl: '', description: '' }); projects.reload();
    } catch (e) { setErr((e as Error).message); }
  };

  if (ws.loading || projects.loading) return <Spinner />;
  const list = projects.data ?? [];
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border-[1.5px] border-ink bg-white shadow-[4px_5px_0_#1A2233] p-6 sm:p-8 mb-10">
        <div className="absolute inset-0 paper-grid opacity-60" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="hand text-3xl text-brandLight leading-none">Olá, {user!.name.split(' ')[0]}!</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Os teus websites</h1>
            <p className="text-sm text-muted mt-2">{list.length ? `${list.length} projeto${list.length > 1 ? 's' : ''} em ${ws.data?.[0]?.name}` : 'Cria o primeiro projeto para começar.'}</p>
          </div>
          <button className="btn-primary !px-5 !py-3" onClick={() => setOpen(true)}><Icon name="plus" className="w-4 h-4" /> Novo projeto</button>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <button onClick={() => setOpen(true)} className="min-h-[170px] rounded-2xl border-[1.5px] border-dashed border-ink/50 flex flex-col items-center justify-center gap-2 text-muted hover:text-ink hover:border-ink hover:bg-brand/5 transition">
          <span className="w-12 h-12 rounded-full border-[1.5px] border-current flex items-center justify-center"><Icon name="plus" className="w-6 h-6" /></span>
          <span className="hand text-2xl font-semibold">Novo website</span>
        </button>
        {list.map((p, i) => {
          const dark = i % 3 === 0;
          return (
            <Link key={p.id} to={`/app/p/${p.id}`}
              className={`group min-h-[170px] rounded-2xl border-[1.5px] border-ink shadow-[4px_5px_0_#1A2233] p-5 flex flex-col hover:-translate-y-1 transition ${tones[i % 3]}`}>
              <div className="flex items-start justify-between">
                <span className={`w-11 h-11 rounded-xl border-[1.5px] border-ink flex items-center justify-center ${dark ? 'bg-white text-brand' : 'bg-brand text-white'}`}><Icon name="box" /></span>
                <Icon name="arrow" className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition" />
              </div>
              <h3 className="font-extrabold text-xl mt-auto pt-6 break-words">{p.name}</h3>
              <p className={`mono text-xs ${dark ? 'text-white/70' : 'text-muted'}`}>/{p.slug}</p>
              {p.description && <p className={`text-sm mt-2 line-clamp-2 ${dark ? 'text-white/75' : 'text-muted'}`}>{p.description}</p>}
            </Link>
          );
        })}
      </div>

      {open && (
        <Modal title="Novo projeto" onClose={() => setOpen(false)}>
          <form onSubmit={create} className="space-y-4">
            <div><label className="label">Nome do website</label><input className="input" required minLength={2} autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><label className="label">URL do frontend (opcional)</label><input className="input" placeholder="https://meusite.com" value={f.frontendUrl} onChange={(e) => setF({ ...f, frontendUrl: e.target.value })} /></div>
            <div><label className="label">Descrição (opcional)</label><textarea className="input" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            {err && <ErrorBox msg={err} />}
            <button className="btn-primary w-full">Criar projeto</button>
          </form>
        </Modal>
      )}
    </>
  );
}
