import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { GITHUB, GoogleIcon } from '../components/Logo';
import { Navbar } from '../components/Navbar';
import { useSeo } from '../lib/seo';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.75-.24.75-.53v-2.08c-3.05.66-3.69-1.3-3.69-1.3-.5-1.28-1.22-1.62-1.22-1.62-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.56 1.19 3.18.91.1-.7.38-1.19.7-1.46-2.44-.28-5.01-1.22-5.01-5.45 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.04 1.13a10.57 10.57 0 0 1 5.53 0c2.11-1.43 3.03-1.13 3.03-1.13.6 1.51.22 2.63.11 2.91.7.77 1.12 1.75 1.12 2.95 0 4.24-2.57 5.17-5.02 5.45.4.35.75 1.02.75 2.06V22c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z" />
  </svg>
);

export default function Landing() {
  const { hash } = useLocation();
  useSeo({ title: 'Torna os websites estáticos dinâmicos', description: 'Dá ao teu website estático o poder do conteúdo dinâmico, sem o reconstruir. Componentes, blogs e uma API pública.', path: '/' });
  useEffect(() => { if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }); }, [hash]);
  return (
    <div className="relative min-h-screen lg:h-screen lg:flex lg:flex-col overflow-hidden">
      {/* Hero em ecrã inteiro: imagem de fundo com zoom lento (substitui por qualquer imagem em /public/home-bg.*) */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-cover bg-center home-zoom" style={{ backgroundImage: "url('/home-bg.svg')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-paper/85 via-paper/45 to-transparent" />
      </div>
      <Navbar />
      <main className="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
        <section className="relative min-h-[calc(100vh-82px)] lg:min-h-0 lg:flex-1 flex items-center overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-[3vh] lg:h-full grid lg:grid-cols-[1fr_1.35fr] gap-10 lg:gap-8 items-center w-full">
            <div className="relative z-10">
              <h1 className="hero-title font-semibold">
                O teu website<br />estático.<br />
                <span className="yellow-highlight">Agora dinâmico.</span>
              </h1>
              <div className="mt-4 lg:mt-[2vh] flex items-center gap-3">
                <svg viewBox="0 0 90 28" className="w-20 text-brandLight shrink-0"><path d="M3 15 C25 3, 48 27, 85 9" className="sketch" /></svg>
                <p className="hand text-4xl sm:text-5xl font-semibold text-brandLight leading-none">Sem o reconstruir.</p>
              </div>
              <p className="hand text-2xl sm:text-3xl text-muted leading-snug max-w-md mt-5 lg:mt-[3vh]">
                Regista componentes, gere conteúdos e usa-os no teu site através da API.
              </p>
              <div className="flex flex-wrap items-center gap-x-7 gap-y-4 mt-8 lg:mt-[4vh]">
                <Link to="/register" className="btn-primary !px-7 !py-4 !rounded-xl">Começar <span className="text-xl">↗</span></Link>
                <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="hand text-2xl font-semibold text-muted hover:text-ink transition inline-flex items-center gap-2"><GithubIcon /> GitHub</a>
                <a href={`${API_URL}/auth/google`} className="hand text-2xl font-semibold text-muted hover:text-ink transition inline-flex items-center gap-2"><GoogleIcon /> Google</a>
              </div>
            </div>
            <div className="relative z-10 flex items-center justify-center lg:h-full lg:min-h-0">
              <img src="/website.svg" alt="Animação: de website estático a dinâmico" className="w-full h-auto lg:h-full object-contain" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
