import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/icons';
import { Spinner } from '../components/ui';
import { useFetch } from '../lib/hooks';
import { useProject } from './ProjectLayout';


const DEVICES: [string, string, string][] = [['Desktop', '100%', 'desktop'], ['Tablet', '768px', 'tablet'], ['Telemóvel', '390px', 'mobile']];

function SitePreview({ url }: { url: string }) {
  const [dev, setDev] = useState('100%');
  const [nonce, setNonce] = useState(0);
  const [loaded, setLoaded] = useState(false);
  return (
    <section className="sketch-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="mono text-[11px] uppercase tracking-wider text-muted">Site online</p>
          <h2 className="hand text-3xl font-semibold leading-tight">Preview do site</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border-[1.5px] border-ink overflow-hidden">
            {DEVICES.map(([l, w]) => (
              <button key={l} type="button" onClick={() => setDev(w)}
                className={`px-3 py-1.5 mono text-[11px] uppercase tracking-wider ${dev === w ? 'bg-brand text-white' : 'bg-white hover:bg-brand/10'}`}>{l}</button>
            ))}
          </div>
          <button type="button" onClick={() => { setLoaded(false); setNonce((n) => n + 1); }} className="btn-secondary btn-sm">Recarregar</button>
          <a href={url} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">Abrir ↗</a>
        </div>
      </div>
      <div className="rounded-xl border-[1.5px] border-ink bg-white p-2 sm:p-3">
        <div className="flex items-center gap-1.5 px-1 pb-2">
          <i className="w-2.5 h-2.5 rounded-full bg-ink/20" /><i className="w-2.5 h-2.5 rounded-full bg-ink/20" /><i className="w-2.5 h-2.5 rounded-full bg-ink/20" />
          <span className="mono text-[11px] text-muted truncate ml-2">{url}</span>
        </div>
        <div className="bg-paper rounded-lg overflow-auto flex justify-center relative" style={{ height: '70vh', minHeight: 420 }}>
          {!loaded && <div className="absolute inset-0 flex items-center justify-center mono text-xs text-muted">a carregar…</div>}
          <iframe key={nonce} src={url} title="Preview do site" onLoad={() => setLoaded(true)}
            className="h-full bg-white border-0 transition-all" style={{ width: dev, maxWidth: '100%' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </div>
      </div>
      <p className="mono text-[11px] text-muted mt-2">Se a pré-visualização ficar em branco, o site bloqueia ser mostrado dentro de outra página (X-Frame-Options/CSP) — usa «Abrir».</p>
    </section>
  );
}

export default function Overview() {
  const { project } = useProject();
  const { data: s } = useFetch<Record<string, number>>(`/projects/${project.id}/stats`);
  if (!s) return <Spinner />;
  const total = Math.max(s.entries, 1);
  const stats: [string, number, string, string][] = [
    ['Componentes', s.components, 'box', 'components'], ['Conteúdos', s.entries, 'edit', 'content'],
    ['Media', s.media, 'image', 'media'],
  ];
  const steps: [string, string, string, string, string][] = [
    ['1', 'Cria um componente', 'Define os campos que o teu website espera receber.', 'components/new', 'box'],
    ['2', 'Regista conteúdos', 'Preenche os dados e publica-os.', 'content', 'edit'],
    ['3', 'Integra no teu site', 'Copia o endpoint e o snippet de código.', 'integration', 'plug'],
  ];
  return (
    <div className="space-y-10">
      {project.frontendUrl && <SitePreview url={project.frontendUrl} />}

      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="sketch-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="mono text-[11px] uppercase tracking-wider text-muted">Estado dos conteúdos</p>
              <p className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-1">{s.published}<span className="text-xl text-muted font-bold"> / {s.entries} publicados</span></p>
            </div>
            <span className="hand text-2xl text-brandLight hidden sm:block">live on the API</span>
          </div>
          <div className="mt-5 h-4 rounded-full border-[1.5px] border-ink overflow-hidden flex bg-paper">
            <div className="bg-brand" style={{ width: `${(s.published / total) * 100}%` }} />
            <div className="bg-brandLight/50" style={{ width: `${(s.draft / total) * 100}%` }} />
            <div className="bg-ink/20" style={{ width: `${(s.archived / total) * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 mono text-[11px] text-muted">
            <span><i className="inline-block w-2.5 h-2.5 bg-brand rounded-sm mr-1.5" />publicados {s.published}</span>
            <span><i className="inline-block w-2.5 h-2.5 bg-brandLight/50 rounded-sm mr-1.5" />rascunhos {s.draft}</span>
            <span><i className="inline-block w-2.5 h-2.5 bg-ink/20 rounded-sm mr-1.5" />arquivados {s.archived}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
          {stats.map(([l, v, icon, to], i) => (
            <Link key={l} to={`/app/p/${project.id}/${to}`}
              className={`rounded-2xl border-[1.5px] border-ink p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 hover:-translate-y-0.5 transition ${i === 0 ? 'bg-brand/10' : 'bg-white'}`}>
              <span className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center shrink-0"><Icon name={icon} className="w-5 h-5" /></span>
              <span className="lg:flex-1"><span className="block text-2xl font-extrabold leading-none">{v}</span><span className="mono text-[10px] uppercase tracking-wider text-muted">{l}</span></span>
              <Icon name="arrow" className="w-4 h-4 text-muted hidden lg:block" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="hand text-3xl font-semibold mb-4">Primeiros passos</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map(([n, t, d, to, icon], i) => (
            <Link key={n} to={`/app/p/${project.id}/${to}`}
              className={`rough-border p-5 hover:-translate-y-1 transition block relative overflow-hidden ${i === 1 ? 'bg-brand text-white' : 'bg-white'}`}>
              <span className={`absolute -right-2 -top-4 text-8xl font-extrabold ${i === 1 ? 'text-white/10' : 'text-brand/10'}`}>{n}</span>
              <span className={`relative w-10 h-10 rounded-xl border-[1.5px] border-ink flex items-center justify-center mb-4 ${i === 1 ? 'bg-white text-brand' : 'bg-brand text-white'}`}><Icon name={icon} /></span>
              <div className="relative font-extrabold">{t}</div>
              <div className={`relative text-sm mt-1 ${i === 1 ? 'text-white/75' : 'text-muted'}`}>{d}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
