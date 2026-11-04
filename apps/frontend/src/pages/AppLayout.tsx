import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useMatch } from 'react-router-dom';
import { Icon } from '../components/icons';
import { Logo } from '../components/Logo';
import { Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';

export function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

const sections: [string, string, string][] = [
  ['', 'Overview', 'home'], ['components', 'Components', 'box'], ['content', 'Content', 'edit'],
  ['media', 'Media', 'image'], ['integration', 'Integration', 'plug'], ['settings', 'Settings', 'gear'],
];

const item = (active: boolean) =>
  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition border-[1.5px] ${
    active ? 'bg-brand text-white border-ink shadow-[2px_3px_0_#1A2233]' : 'border-transparent text-muted hover:text-ink hover:bg-brand/10'}`;

function SidebarBody({ pid }: { pid?: string }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-col h-full">
      <div className="px-2 pt-1 pb-6"><Logo to="/app" /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <p className="mono text-[10px] uppercase tracking-widest text-muted px-3.5 mb-2">Workspace</p>
        <NavLink to="/app" end className={({ isActive }) => item(isActive)}><Icon name="folder" /> Projetos</NavLink>
        {pid && (
          <>
            <p className="mono text-[10px] uppercase tracking-widest text-muted px-3.5 pt-6 mb-2">Projeto</p>
            {sections.map(([to, label, icon]) => (
              <NavLink key={to} to={`/app/p/${pid}/${to}`} end={to === ''} className={({ isActive }) => item(isActive)}>
                <Icon name={icon} /> {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="mt-4 rough-border bg-white p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand text-white font-extrabold flex items-center justify-center shrink-0">
          {user!.name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold truncate">{user!.name}</div>
          <div className="text-[11px] text-muted truncate">{user!.email}</div>
        </div>
        <button onClick={logout} title="Sair" aria-label="Sair" className="p-2 rounded-lg hover:bg-brand/10"><Icon name="logout" /></button>
      </div>
    </div>
  );
}

function AppShell() {
  const pid = useMatch('/app/p/:pid/*')?.params.pid;
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const bottom = sections.filter(([to]) => to !== 'settings');
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[270px_1fr]">
      <aside className="hidden lg:block sticky top-0 h-screen border-r border-ink/10 bg-white/60 p-4">
        <SidebarBody pid={pid} />
      </aside>

      <header className="lg:hidden sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-ink/10">
        <div className="px-4 h-14 flex items-center justify-between">
          <Logo to="/app" />
          <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-brand/10"><Icon name="menu" className="w-6 h-6" /></button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="relative w-[82%] max-w-xs bg-paper p-4 border-r-[1.5px] border-ink">
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="absolute top-4 right-3 p-2"><Icon name="close" /></button>
            <SidebarBody pid={pid} />
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 sm:px-8 py-6 lg:py-10 pb-28 lg:pb-12">
        <div className="max-w-5xl mx-auto"><Outlet /></div>
      </main>

      {pid && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t-[1.5px] border-ink grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {bottom.map(([to, label, icon]) => (
            <NavLink key={to} to={`/app/p/${pid}/${to}`} end={to === ''}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${isActive ? 'text-brand' : 'text-muted'}`}>
              {({ isActive }) => (<>
                <span className={`px-3 py-1 rounded-full ${isActive ? 'bg-brand text-white' : ''}`}><Icon name={icon} className="w-5 h-5" /></span>
                {label}
              </>)}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
