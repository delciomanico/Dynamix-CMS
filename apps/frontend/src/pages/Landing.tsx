import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { GITHUB, GoogleIcon } from '../components/Logo';
import { Navbar } from '../components/Navbar';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.75-.24.75-.53v-2.08c-3.05.66-3.69-1.3-3.69-1.3-.5-1.28-1.22-1.62-1.22-1.62-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.56 1.19 3.18.91.1-.7.38-1.19.7-1.46-2.44-.28-5.01-1.22-5.01-5.45 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.04 1.13a10.57 10.57 0 0 1 5.53 0c2.11-1.43 3.03-1.13 3.03-1.13.6 1.51.22 2.63.11 2.91.7.77 1.12 1.75 1.12 2.95 0 4.24-2.57 5.17-5.02 5.45.4.35.75 1.02.75 2.06V22c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z" />
  </svg>
);

function Illustration() {
  return (
    <div id="how-it-works" className="relative min-h-[420px] sm:min-h-[530px] flex items-center justify-center">
      <div className="absolute inset-0 paper-grid rounded-3xl opacity-50" />
      <div className="browser relative z-10 w-full max-w-[540px] bg-white rough-border overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-ink/20">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-brand text-white border border-ink" />
            <span className="w-3 h-3 rounded-full bg-gray-200 border border-ink" />
            <span className="w-3 h-3 rounded-full bg-gray-200 border border-ink" />
          </div>
          <span className="mono text-[10px] sm:text-xs text-muted">dynamix-cms / workspace</span>
          <span className="text-lg">⋯</span>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="mono text-[10px] uppercase tracking-widest text-muted">From static to dynamic</span>
            <span className="hand text-xl font-bold">The magic happens here!</span>
          </div>
          <div className="grid grid-cols-[1fr_35px_1fr] gap-2 items-center">
            <div className="relative border border-ink rounded-xl p-3 sm:p-4">
              <div className="absolute -top-3 left-3 bg-white px-2 mono text-[9px]">YOUR WEBSITE</div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-2 py-2 flex justify-between">
                  <div className="text-[9px] font-bold">MY WEBSITE</div>
                  <div className="flex gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full" /><span className="w-1.5 h-1.5 bg-gray-400 rounded-full" /></div>
                </div>
                <div className="p-3">
                  <div className="h-2 w-4/5 bg-gray-200 rounded mb-2" />
                  <div className="h-2 w-3/5 bg-gray-200 rounded mb-4" />
                  <div className="h-14 bg-brand/40 border border-brandLight/40 rounded-lg mb-3 flex items-center justify-center">
                    <svg viewBox="0 0 60 35" className="w-12 text-ink"><path d="M5 30 L20 12 L30 22 L40 5 L55 30 Z" className="sketch-thin" /></svg>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded mb-2" />
                  <div className="h-2 w-4/5 bg-gray-100 rounded" />
                </div>
              </div>
              <p className="hand text-center text-lg mt-3">Static HTML</p>
            </div>
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 40 30" className="w-full text-brandLight"><path d="M3 15 H33 M25 7 L33 15 L25 23" className="sketch" /></svg>
            </div>
            <div className="relative border border-ink rounded-xl p-3 sm:p-4 bg-brand/10">
              <div className="absolute -top-3 left-3 bg-paper px-2 mono text-[9px]">DYNAMIX-CMS</div>
              <div className="space-y-3 mt-2">
                {[['◈', 'Components', 'Register blocks', true], ['✎', 'Content', 'Manage data', false], ['↗', 'Public API', 'Expose endpoints', false]].map(([i, t, s, y]) => (
                  <div key={t as string} className="flex items-center gap-2">
                    <div className={`w-7 h-7 border border-ink rounded-md flex items-center justify-center text-xs ${y ? 'bg-brand text-white' : 'bg-white'}`}>{i}</div>
                    <div><div className="text-[10px] font-bold">{t}</div><div className="text-[8px] text-muted">{s}</div></div>
                  </div>
                ))}
              </div>
              <p className="hand text-center text-lg mt-4">Make it dynamic!</p>
            </div>
          </div>
          <div className="mt-5 border border-ink rounded-lg p-3 bg-[#EDF1F8]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="mono text-[9px] font-bold bg-brand text-white px-2 py-1 rounded">GET</span>
                <span className="mono text-[9px] sm:text-xs truncate">/api/v1/public/my-site/content/services</span>
              </div>
              <span className="text-[9px] font-bold text-green-700 shrink-0">PUBLIC</span>
            </div>
            <div className="mono text-[9px] text-muted mt-2">{'{"data":[{"title":"Hello World"}],"meta":{...}}'}</div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <svg viewBox="0 0 40 25" className="w-8 text-brandLight"><path d="M3 12 H33 M25 4 L33 12 L25 20" className="sketch" /></svg>
            <div className="border border-ink rounded-lg bg-white px-4 py-2 flex items-center gap-3">
              <div className="w-7 h-7 bg-brand text-white rounded-md flex items-center justify-center">✓</div>
              <div><div className="text-xs font-bold">Dynamic Website</div><div className="text-[9px] text-muted">Same frontend. Fresh content.</div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="float absolute -top-2 left-0 sm:-left-5 z-20 sketch-card rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand text-white rounded-lg flex items-center justify-center border border-ink">✎</div>
          <div><div className="text-xs font-bold">No rebuild needed</div><div className="text-[10px] text-muted">Keep your existing code</div></div>
        </div>
      </div>
      <div className="float-delay absolute bottom-0 right-0 sm:-right-4 z-20 sketch-card rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-ink">↗</div>
          <div><div className="text-xs font-bold">API-powered</div><div className="text-[10px] text-muted">Content on demand</div></div>
        </div>
      </div>
      <div className="absolute top-12 right-0 sm:-right-5 hidden md:block">
        <p className="hand text-2xl font-semibold rotate-6">Simple, right?</p>
        <svg viewBox="0 0 100 50" className="w-24 text-ink"><path d="M90 5 C60 10, 30 20, 10 40 M10 40 L12 25 M10 40 L27 35" className="sketch" /></svg>
      </div>
    </div>
  );
}

export default function Landing() {
  const { hash } = useLocation();
  useEffect(() => { if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }); }, [hash]);
  return (
    <>
      <Navbar />
      <main>
        <section className="relative min-h-[calc(100vh-82px)] flex items-center overflow-hidden">
          <div className="absolute inset-0 paper-grid opacity-60" />
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-3 h-3 rounded-full bg-brand text-white border border-ink" />
                <span className="mono text-xs sm:text-sm uppercase tracking-wider text-muted">A content management platform</span>
              </div>
              <h1 className="hero-title font-extrabold">
                Your static<br />website.<br />
                <span className="yellow-highlight">Now dynamic.</span>
              </h1>
              <div className="mt-5 mb-8 flex items-center gap-3">
                <svg viewBox="0 0 90 28" className="w-20 text-brandLight"><path d="M3 15 C25 3, 48 27, 85 9" className="sketch" /></svg>
                <p className="hand text-3xl font-semibold">Without rebuilding it.</p>
              </div>
              <p className="text-muted text-base sm:text-lg leading-relaxed max-w-lg">
                Give your existing website the power of dynamic content. Register components, manage content, and expose public API endpoints your frontend can consume.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-9">
                <Link to="/register" className="btn-primary !px-6 !py-4 !rounded-xl">Get started <span className="text-xl">↗</span></Link>
                <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-6 !py-4 !rounded-xl"><GithubIcon /> GitHub</a>
              </div>
              <div className="mt-5">
                <a href={`${API_URL}/auth/google`} className="inline-flex items-center gap-3 text-sm font-semibold text-muted hover:text-ink transition">
                  <span className="w-7 h-7 bg-white border border-black/10 rounded-full flex items-center justify-center"><GoogleIcon /></span>
                  Or continue with Google
                </a>
              </div>
              <div className="mt-12 flex items-start gap-4">
                <svg viewBox="0 0 65 55" className="w-14 h-12 text-brandLight shrink-0"><path d="M5 5 C20 15, 45 20, 50 35 M35 28 L50 35 L48 20" className="sketch" /></svg>
                <p className="hand text-2xl font-semibold leading-tight">Keep your frontend.<br />Take control of your content.</p>
              </div>
            </div>
            <Illustration />
          </div>
        </section>
        <section className="border-t border-ink/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="hand text-2xl font-semibold text-muted">Keep the code. Change the content.</p>
            <div className="flex items-center gap-4 mono text-[10px] sm:text-xs text-muted">
              <span>STATIC</span><span className="text-brandLight">→</span><span>CMS</span><span className="text-brandLight">→</span><span>DYNAMIC</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
