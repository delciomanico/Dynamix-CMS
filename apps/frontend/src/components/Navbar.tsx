import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GITHUB, Logo } from './Logo';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none">
      <div className="relative max-w-6xl mx-auto pointer-events-auto">
      <nav className="h-14 sm:h-16 rounded-full border border-ink/10 bg-white/80 backdrop-blur-md shadow-[0_10px_30px_-12px_rgba(26,34,51,.25)] pl-5 pr-2 sm:pl-7 sm:pr-3 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted">
          <NavLink to="/blog" className={({ isActive }) => `hover:text-ink transition ${isActive ? 'text-ink' : ''}`}>Blog</NavLink>
          <NavLink to="/team" className={({ isActive }) => `hover:text-ink transition ${isActive ? 'text-ink' : ''}`}>Equipa</NavLink>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="hover:text-ink transition">GitHub ↗</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:inline-flex px-4 py-2.5 text-sm font-medium hover:text-brandLight transition">Entrar</Link>
          <Link to="/register" className="btn-primary !rounded-full !py-2 sm:!py-2.5">Criar conta</Link>
          <button className="md:hidden w-10 h-10 flex items-center justify-center" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M4 7 H20 M4 12 H20 M4 17 H20" className="sketch" /></svg>
          </button>
        </div>
      </nav>
      {open && (
        <div className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-3xl border border-ink/10 bg-white/95 backdrop-blur-md shadow-[0_16px_40px_-14px_rgba(26,34,51,.3)]">
          <div className="px-6 py-5 flex flex-col gap-5 text-sm font-semibold">
            <Link to="/blog" onClick={close}>Blog</Link>
            <Link to="/team" onClick={close}>Equipa</Link>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <Link to="/login" onClick={close} className="border-t border-ink/10 pt-4">Entrar</Link>
          </div>
        </div>
      )}
      </div>
    </header>
  );
}

