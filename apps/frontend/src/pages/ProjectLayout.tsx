import { Link, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { Icon } from '../components/icons';
import { ErrorBox, Spinner } from '../components/ui';
import { API_URL, Project } from '../lib/api';
import { useFetch } from '../lib/hooks';

export const useProject = () => useOutletContext<{ project: Project; reload: () => void }>();

export default function ProjectLayout() {
  const { pid } = useParams();
  const { data: project, error, loading, reload } = useFetch<Project>(`/projects/${pid}`);
  if (loading) return <Spinner />;
  if (error || !project) return <ErrorBox msg={error ?? 'Projeto não encontrado'} />;
  const base = `${API_URL}/public/${project.slug}`;
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-white text-ink border border-ink/10 shadow-soft p-6 sm:p-9 mb-10">
        <svg className="absolute -right-6 -top-6 w-44 h-44 text-brand/5" viewBox="0 0 24 24"><path d="M12 3 L21 8 V16 L12 21 L3 16 V8 Z M3 8 L12 13 L21 8 M12 13 V21" className="sketch" /></svg>
        <Link to="/app" className="relative mono text-[11px] uppercase tracking-wider text-muted hover:text-ink">← Projetos</Link>
        <h1 className="relative text-2xl sm:text-4xl font-semibold tracking-tight mt-2 break-words">{project.name}</h1>
        {project.description && <p className="relative text-muted text-sm sm:text-base mt-1 max-w-xl">{project.description}</p>}
        <div className="relative mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-paper border border-ink/10 rounded-xl px-3 py-2 min-w-0">
            <Icon name="globe" className="w-4 h-4 shrink-0" />
            <span className="mono text-[11px] sm:text-xs truncate">{base}</span>
            <button className="shrink-0 p-1 rounded hover:bg-brand/10" aria-label="Copiar endpoint" onClick={() => navigator.clipboard?.writeText(base)}><Icon name="copy" className="w-4 h-4" /></button>
          </div>
          {project.frontendUrl && <a href={project.frontendUrl} target="_blank" rel="noreferrer" className="mono text-[11px] text-brand hover:text-ink underline underline-offset-4 truncate">{project.frontendUrl} ↗</a>}
        </div>
      </div>
      <Outlet context={{ project, reload }} />
    </>
  );
}
