import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { GITHUB } from '../components/Logo';
import { Member, team } from '../lib/team';

const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const tilt = ['-rotate-1', 'rotate-1', 'rotate-[.6deg]', '-rotate-[.6deg]'];

function Card({ m, i }: { m: Member; i: number }) {
  return (
    <article className={`sketch-card rounded-2xl p-6 ${tilt[i % 4]} hover:rotate-0 hover:-translate-y-1 transition`}>
      <div className="w-24 h-24 rounded-2xl border-[1.5px] border-ink overflow-hidden bg-brand/15 flex items-center justify-center mb-5 paper-grid">
        {m.photo
          ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
          : <span className="text-3xl font-extrabold text-brand tracking-tight">{initials(m.name)}</span>}
      </div>
      <h3 className="text-xl font-extrabold tracking-tight">{m.name}</h3>
      <p className="mono text-[11px] uppercase tracking-wider text-brandLight mt-1">{m.role}</p>
      <p className="text-sm text-muted leading-relaxed mt-3">{m.bio}</p>
      {(m.github || m.linkedin) && (
        <div className="flex gap-4 mt-5 text-sm font-bold">
          {m.github && <a className="hover:text-brandLight transition" href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
          {m.linkedin && <a className="hover:text-brandLight transition" href={m.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>}
        </div>
      )}
    </article>
  );
}


function Feature({ m }: { m: Member }) {
  const json = JSON.stringify(
    { id: m.github ?? m.name.toLowerCase().replace(/\s+/g, '-'), name: m.name, role: m.role, stack: m.stack ?? [], status: 'published', open_source: true },
    null, 2,
  );
  return (
    <article className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-stretch">
      <div className="sketch-card rounded-3xl p-8 sm:p-10 relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 paper-grid opacity-50" />
        <div className="relative flex items-start gap-6 flex-wrap">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-[1.5px] border-ink overflow-hidden bg-brand flex items-center justify-center shrink-0 -rotate-3 shadow-[5px_6px_0_#1A2233]">
            {m.photo
              ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
              : <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">{initials(m.name)}</span>}
          </div>
          <div className="pt-2">
            <p className="hand text-3xl font-semibold text-brandLight leading-none">Hi, I'm</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.02] mt-1">{m.name}</h2>
            <p className="mono text-xs uppercase tracking-wider text-muted mt-3">{m.role}</p>
          </div>
        </div>
        <p className="relative text-lg text-muted leading-relaxed mt-8">{m.bio}</p>
        {m.stack && (
          <div className="relative flex flex-wrap gap-2 mt-6">
            {m.stack.map((t) => <span key={t} className="mono text-xs font-medium bg-white border-[1.5px] border-ink rounded-lg px-3 py-1.5">{t}</span>)}
          </div>
        )}
        <div className="relative flex flex-wrap gap-4 mt-auto pt-10">
          {m.github && <a className="btn-primary" href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
          {m.linkedin && <a className="btn-secondary" href={m.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>}
          <Link to="/register" className="btn-secondary">Experimentar o produto</Link>
        </div>
      </div>

      <div className="relative flex items-center">
        <div className="browser w-full bg-white rough-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink/20">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-brand border border-ink" />
              <span className="w-3 h-3 rounded-full bg-gray-200 border border-ink" />
              <span className="w-3 h-3 rounded-full bg-gray-200 border border-ink" />
            </div>
            <span className="mono text-[10px] sm:text-xs text-muted">dynamix-cms / team</span>
            <span className="text-lg">⋯</span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 min-w-0 mb-4">
              <span className="mono text-[10px] font-bold bg-brand text-white px-2 py-1 rounded">GET</span>
              <span className="mono text-[11px] sm:text-xs truncate">/api/v1/public/dynamix/content/team/{m.github ?? 'dev'}</span>
              <span className="ml-auto text-[10px] font-bold text-green-700 shrink-0">200 OK</span>
            </div>
            <pre className="mono text-xs sm:text-[13px] leading-relaxed bg-ink text-paper rounded-xl p-5 overflow-x-auto">{json}</pre>
            <p className="hand text-2xl font-semibold text-center mt-5">Even this page could come from the CMS.</p>
          </div>
        </div>
        <div className="float absolute -top-3 right-2 sm:-right-3 z-20 sketch-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand text-white rounded-lg flex items-center justify-center border border-ink">✎</div>
            <div><div className="text-xs font-bold">Open source</div><div className="text-[10px] text-muted">Built in public</div></div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Team() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-ink/10">
          <div className="absolute inset-0 paper-grid opacity-60" />
          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-3 h-3 rounded-full bg-brand border border-ink" />
              <span className="mono text-xs sm:text-sm uppercase tracking-wider text-muted">{team.length > 1 ? 'The team' : 'The developer'}</span>
            </div>
            <h1 className="hero-title font-extrabold max-w-4xl">
              {team.length > 1 ? 'The people' : 'The developer'} <br className="hidden sm:block" />behind <span className="yellow-highlight">Dynamix.</span>
            </h1>
            <p className="hand text-3xl font-semibold mt-6">Keep your frontend. Take control of your content.</p>
            <p className="text-muted text-base sm:text-lg leading-relaxed max-w-xl mt-4">
              Um projeto independente, focado em dar a qualquer website estático uma camada de conteúdo dinâmico — sem reconstruir nada.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16">
          {team.length === 1 ? <Feature m={team[0]} /> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((m, i) => <Card key={i} m={m} i={i} />)}
            </div>
          )}
        </section>

        <section className="border-t border-ink/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="hand text-3xl font-semibold">Quer contribuir?</p>
              <p className="text-sm text-muted">O projeto é open source — abre uma issue ou um pull request.</p>
            </div>
            <div className="flex gap-4">
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn-secondary">GitHub ↗</a>
              <Link to="/register" className="btn-primary">Criar conta</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
