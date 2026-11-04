import { useEffect, useRef, useState } from 'react';
import { ErrorBox, PageHead, Pager, Spinner } from '../components/ui';
import { AdminOverview, AdminProject, AdminUser, api, BackupStatus, Paginated } from '../lib/api';
import { useFetch } from '../lib/hooks';

const fmtBytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1024).toFixed(1)} KB`);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-PT');

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="sketch-card rounded-2xl p-4">
      <p className="mono text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight mt-1">{value}</p>
      {note && <p className="text-xs text-muted mt-1">{note}</p>}
    </div>
  );
}

function Search({ onChange }: { onChange: (q: string) => void }) {
  const [v, setV] = useState('');
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => { const t = setTimeout(() => cb.current(v), 300); return () => clearTimeout(t); }, [v]);
  return <input className="input max-w-xs" placeholder="Pesquisar…" value={v} onChange={(e) => setV(e.target.value)} />;
}

function UsersTable() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const { data, error } = useFetch<Paginated<AdminUser>>(`/admin/users?page=${page}&limit=10&q=${encodeURIComponent(q)}`);
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-extrabold">Utilizadores</h2>
        <Search onChange={(s) => { setQ(s); setPage(1); }} />
      </div>
      {error && <ErrorBox msg={error} />}
      <div className="sketch-card rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="mono text-[10px] uppercase text-muted text-left"><tr><th className="p-3">Nome</th><th>Email</th><th>Papel</th><th>Login</th><th>Criado</th></tr></thead>
          <tbody className="divide-y divide-ink/10">
            {data?.data.map((u) => (
              <tr key={u.id}>
                <td className="p-3 font-bold">{u.name}</td><td>{u.email}</td>
                <td><span className={`mono text-xs ${u.role === 'ADMIN' ? 'text-brand font-bold' : ''}`}>{u.role}</span></td>
                <td className="text-muted">{u.google ? 'Google' : 'Email'}</td><td className="text-muted">{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pager {...data.meta} onPage={setPage} />}
    </section>
  );
}

function ProjectsTable() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const { data, error } = useFetch<Paginated<AdminProject>>(`/admin/projects?page=${page}&limit=10&q=${encodeURIComponent(q)}`);
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-extrabold">Projetos</h2>
        <Search onChange={(s) => { setQ(s); setPage(1); }} />
      </div>
      {error && <ErrorBox msg={error} />}
      <div className="sketch-card rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="mono text-[10px] uppercase text-muted text-left"><tr><th className="p-3">Projeto</th><th>Slug</th><th>Dono</th><th>Componentes</th><th>Media</th><th>Criado</th></tr></thead>
          <tbody className="divide-y divide-ink/10">
            {data?.data.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-bold">{p.name}</td><td className="mono text-xs">{p.slug}</td><td>{p.owner}</td>
                <td>{p._count.components}</td><td>{p._count.media}</td><td className="text-muted">{fmtDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pager {...data.meta} onPage={setPage} />}
    </section>
  );
}

const fmtSize = (n: number) => (n > 1073741824 ? `${(n / 1073741824).toFixed(2)} GB` : fmtBytes(n));
const fmtDateTime = (d: string) => new Date(d).toLocaleString('pt-PT');

function BackupsPanel() {
  const { data, error, reload } = useFetch<BackupStatus>('/admin/backups');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const running = !!data?.running;

  // enquanto há um backup em curso, atualiza a cada 3 s
  useEffect(() => { if (!running) return; const t = setInterval(reload, 3000); return () => clearInterval(t); }, [running, reload]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true); setMsg('');
    try { await fn(); await reload(); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Spinner />;
  if (!data.enabled) return (
    <section><h2 className="text-xl font-extrabold mb-3">Backups</h2>
      <p className="text-sm text-muted">Serviço de backups não configurado (defina BACKUP_URL e BACKUP_TOKEN na API).</p></section>
  );
  const last = data.lastRun;
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-extrabold">Backups <span className="mono text-xs text-muted font-normal">Postgres + MinIO</span></h2>
        <button className="btn-primary btn-sm" disabled={busy || running} onClick={() => act(() => api('/admin/backups/run', { method: 'POST' }))}>
          {running ? 'A executar…' : 'Fazer backup agora'}
        </button>
      </div>
      {msg && <div className="mb-3"><ErrorBox msg={msg} /></div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Stat label="Último com sucesso" value={data.lastSuccessAt ? fmtDateTime(data.lastSuccessAt) : '—'} note={last && !last.ok ? `Última execução FALHOU: ${last.error}` : undefined} />
        <Stat label="Próximo" value={data.nextRun ? fmtDateTime(data.nextRun) : '—'} note={`Diário às ${data.schedule?.join(', ')} UTC`} />
        <Stat label="Espaço usado" value={fmtSize(data.totalBytes ?? 0)} note={`Retém ${data.retention?.daily}d / ${data.retention?.weekly}sem / ${data.retention?.monthly}m`} />
        <Stat label="Cópia externa" value={data.offsite ? 'Ativa' : 'Desativada'} note={data.offsite ? undefined : 'Recomendado configurar BACKUP_OFFSITE'} />
      </div>
      {last && !last.ok && <div className="mb-4"><ErrorBox msg={`O último backup falhou (${fmtDateTime(last.finishedAt)}): ${last.error}`} /></div>}
      <div className="sketch-card rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="mono text-[10px] uppercase text-muted text-left"><tr><th className="p-3">ID</th><th>Data</th><th>Origem</th><th>Postgres</th><th>MinIO</th><th>Offsite</th><th /></tr></thead>
          <tbody className="divide-y divide-ink/10">
            {!data.backups?.length && <tr><td colSpan={7} className="p-4 text-muted">Ainda sem backups.</td></tr>}
            {data.backups?.map((b) => (
              <tr key={b.id}>
                <td className="p-3 mono text-xs">{b.id}</td><td>{fmtDateTime(b.createdAt)}</td>
                <td title={b.label}>{b.trigger}</td><td>{fmtSize(b.dbBytes)}</td><td>{fmtSize(b.mediaBytes)}</td>
                <td className={b.offsite === 'error' ? 'text-red-700 font-bold' : 'text-muted'}>{b.offsite}</td>
                <td className="pr-3 text-right"><button className="text-xs text-red-700 font-bold" disabled={busy}
                  onClick={() => confirm(`Eliminar o backup ${b.id}?`) && act(() => api(`/admin/backups/${b.id}`, { method: 'DELETE' }))}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-2">Restauro só por linha de comandos, de propósito (operação destrutiva): ver docs/backups.md.</p>
    </section>
  );
}

export default function Admin() {
  const { data, loading, error } = useFetch<AdminOverview>('/admin/overview');
  if (loading) return <Spinner />;
  if (!data) return <ErrorBox msg={error ?? 'Sem dados'} />;
  const { totals: t, entries: e } = data;
  const max = Math.max(1, ...data.signupsLast30d.map((x) => x.count));
  return (
    <div className="space-y-10">
      <PageHead title="Administração" note="Visão geral da plataforma" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Utilizadores" value={t.users} note={`${t.newUsers7d} novos em 7 dias · ${t.admins} admin`} />
        <Stat label="Projetos" value={t.projects} note={`${t.workspaces} workspaces`} />
        <Stat label="Componentes" value={t.components} />
        <Stat label="Conteúdos" value={t.entries} note={`${e.published} publicados · ${e.draft} rascunhos · ${e.archived} arquivados`} />
        <Stat label="Media" value={t.media} note={fmtBytes(t.mediaBytes)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="sketch-card rounded-2xl p-4">
          <h2 className="font-extrabold mb-3">Registos — últimos 30 dias</h2>
          {data.signupsLast30d.length === 0 ? <p className="text-sm text-muted">Sem registos.</p> : (
            <div className="flex items-end gap-1 h-24" role="img" aria-label="Registos por dia">
              {data.signupsLast30d.map((d) => (
                <div key={d.day} title={`${d.day}: ${d.count}`} className="flex-1 bg-brand rounded-t" style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }} />
              ))}
            </div>
          )}
        </section>
        <section className="sketch-card rounded-2xl p-4">
          <h2 className="font-extrabold mb-3">Projetos com mais conteúdo</h2>
          <ol className="space-y-2 text-sm">
            {data.topProjects.map((p) => (
              <li key={p.id} className="flex justify-between"><span><b>{p.name}</b> <span className="mono text-xs text-muted">{p.slug}</span></span><span className="mono">{p.entries}</span></li>
            ))}
          </ol>
        </section>
      </div>

      <BackupsPanel />
      <UsersTable />
      <ProjectsTable />
    </div>
  );
}
