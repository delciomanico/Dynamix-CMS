import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBox, PageHead } from '../components/ui';
import { api } from '../lib/api';
import { useProject } from './ProjectLayout';

export default function Settings() {
  const { project, reload } = useProject();
  const nav = useNavigate();
  const [f, setF] = useState({ name: project.name, description: project.description ?? '', frontendUrl: project.frontendUrl ?? '', origins: project.allowedOrigins.join('\n') });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      await api(`/projects/${project.id}`, { method: 'PATCH', body: { name: f.name, description: f.description, frontendUrl: f.frontendUrl, allowedOrigins: f.origins.split('\n').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean) } });
      setMsg('Guardado ✓'); reload();
    } catch (e) { setErr((e as Error).message); }
  };
  const del = async () => {
    if (prompt(`Escreve "${project.slug}" para eliminar o projeto e todos os dados:`) === project.slug) { await api(`/projects/${project.id}`, { method: 'DELETE' }); nav('/app'); }
  };

  return (
    <div className="max-w-2xl">
      <PageHead title="Settings" note="Configuração do projeto" />
      <form onSubmit={save} className="sketch-card rounded-2xl p-6 space-y-4">
        <div><label className="label">Nome</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">Descrição</label><textarea className="input" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div><label className="label">URL do frontend</label><input className="input" value={f.frontendUrl} onChange={(e) => setF({ ...f, frontendUrl: e.target.value })} /></div>
        <div><label className="label">Domínios autorizados (CORS) — um por linha</label>
          <textarea className="input mono" rows={3} placeholder="https://meusite.com" value={f.origins} onChange={(e) => setF({ ...f, origins: e.target.value })} />
          <p className="text-xs text-muted mt-1">Vazio = a API pública aceita qualquer origem. CORS não substitui autenticação; só conteúdos publicados são expostos.</p></div>
        {err && <ErrorBox msg={err} />}
        <div className="flex items-center gap-4"><button className="btn-primary">Guardar</button>{msg && <span className="text-sm font-bold">{msg}</span>}</div>
      </form>
      <div className="rough-border bg-white p-6 mt-8">
        <h3 className="font-extrabold">Zona de perigo</h3>
        <p className="text-sm text-muted mb-3">Elimina o projeto, componentes, conteúdos e ficheiros.</p>
        <button className="btn-danger" onClick={del}>Eliminar projeto</button>
      </div>
    </div>
  );
}
