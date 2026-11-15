import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useSeo } from '../lib/seo';
import { GITHUB } from '../components/Logo';
import { Member, team } from '../lib/team';


function Card({ m }: { m: Member }) {
  return (
    <article className="sketch-card rounded-2xl p-6">
      {m.photo && <img src={m.photo} alt={m.name} className="w-24 h-24 rounded-2xl object-cover mb-5" />}
      <h3 className="text-xl font-semibold tracking-tight">{m.name}</h3>
      <p className="mono text-[11px] uppercase tracking-wider text-brandLight mt-1">{m.role}</p>
      <p className="text-sm text-muted leading-relaxed mt-3">{m.bio}</p>
      {(m.github || m.linkedin) && (
        <div className="flex gap-4 mt-5 text-sm font-medium">
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
    <article className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-stretch">
      <div className="sketch-card rounded-3xl p-6 sm:p-10 relative overflow-hidden flex flex-col min-w-0">
        <div className="relative flex items-start gap-6 flex-wrap">
          {m.photo && <img src={m.photo} alt={m.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover shrink-0" />}
          <div className="pt-2">
            <p className="hand text-3xl font-semibold text-brandLight leading-none">Olá, eu sou</p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.02] mt-1 break-words">{m.name}</h2>
            <p className="mono text-xs uppercase tracking-wider text-muted mt-3">{m.role}</p>
          </div>
        </div>
        <p className="relative text-lg text-muted leading-relaxed mt-8">{m.bio}</p>
        {m.stack && (
          <div className="relative flex flex-wrap gap-2 mt-6">
            {m.stack.map((t) => <span key={t} className="mono text-xs text-muted bg-brand/5 rounded-full px-3 py-1.5">{t}</span>)}
          </div>
        )}
        <div className="relative flex flex-wrap gap-4 mt-auto pt-10">
          {m.github && <a className="btn-primary" href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
          {m.linkedin && <a className="btn-secondary" href={m.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>}
          <Link to="/register" className="btn-secondary">Experimentar o produto</Link>
        </div>
      </div>

      <div className="relative flex items-center">
        <div className="w-full bg-white rough-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink/20">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-brand border border-ink/15" />
              <span className="w-3 h-3 rounded-full bg-gray-200 border border-ink/15" />
              <span className="w-3 h-3 rounded-full bg-gray-200 border border-ink/15" />
            </div>
            <span className="mono text-[10px] sm:text-xs text-muted">dynamix-cms / team</span>
            <span className="text-lg">⋯</span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 min-w-0 mb-4">
              <span className="mono text-[10px] font-medium bg-brand/10 text-brand px-2 py-1 rounded">GET</span>
              <span className="mono text-[11px] sm:text-xs truncate">/api/v1/public/dynamix/content/team/{m.github ?? 'dev'}</span>
              <span className="ml-auto text-[10px] font-medium text-green-700 shrink-0">200 OK</span>
            </div>
            <pre className="mono text-xs sm:text-[13px] leading-relaxed bg-paper text-ink/80 rounded-xl p-5 overflow-x-auto">{json}</pre>
            <p className="hand text-2xl text-muted text-center mt-5">Até esta página podia vir do CMS.</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Team() {
  useSeo({ title: 'Equipa', description: 'As pessoas por trás do Dynamix-CMS: um projeto independente que dá conteúdo dinâmico a qualquer website estático.', path: '/team' });
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden min-h-[60vh] flex items-center">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-cover bg-center home-zoom" style={{ backgroundImage: "url('/home-bg.svg')" }} />
            <div className="absolute inset-0 bg-gradient-to-r from-paper/85 via-paper/45 to-transparent" />
          </div>
          <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-24">
            <h1 className="hero-title font-semibold max-w-4xl">
              {team.length > 1 ? 'As pessoas' : 'O desenvolvedor'} <br className="hidden sm:block" />por trás do <span className="yellow-highlight">Dynamix.</span>
            </h1>
            <p className="hand text-4xl sm:text-5xl font-semibold text-brandLight mt-6 leading-none">Mantém o teu frontend. Controla o teu conteúdo.</p>
            <p className="hand text-2xl sm:text-3xl text-muted leading-snug max-w-xl mt-5">
              Um projeto independente, focado em dar a qualquer website estático uma camada de conteúdo dinâmico — sem reconstruir nada.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16">
          {team.length === 1 ? <Feature m={team[0]} /> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((m, i) => <Card key={i} m={m} />)}
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
