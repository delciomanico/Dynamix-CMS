import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { GITHUB, Logo } from './Logo';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="relative z-50 border-b border-black/10">
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-[82px] flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted">
          <Link to="/#how-it-works" className="hover:text-ink transition">How it works</Link>
          <NavLink to="/team" className={({ isActive }) => `hover:text-ink transition ${isActive ? 'text-ink' : ''}`}>Team</NavLink>
          <a href="/docs-api" className="hover:text-ink transition" onClick={(e) => { e.preventDefault(); window.open(API_URL.replace('/api/v1', '/docs'), '_blank'); }}>Documentation</a>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="hover:text-ink transition">GitHub ↗</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:inline-flex px-4 py-2.5 text-sm font-bold hover:text-brandLight transition">Entrar</Link>
          <Link to="/register" className="btn-primary">Criar conta</Link>
          <button className="md:hidden w-10 h-10 flex items-center justify-center" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M4 7 H20 M4 12 H20 M4 17 H20" className="sketch" /></svg>
          </button>
        </div>
      </nav>
      {open && (
        <div className="md:hidden border-t border-black/10 bg-paper">
          <div className="px-6 py-5 flex flex-col gap-5 text-sm font-semibold">
            <Link to="/#how-it-works" onClick={close}>How it works</Link>
            <Link to="/team" onClick={close}>Team</Link>
            <a href={API_URL.replace('/api/v1', '/docs')} target="_blank" rel="noopener noreferrer">Documentation</a>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <Link to="/login" onClick={close} className="border-t border-black/10 pt-4">Entrar</Link>
          </div>
        </div>
      )}
    </header>
  );
}

