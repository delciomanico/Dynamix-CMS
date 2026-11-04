import { ReactNode } from 'react';

export const Spinner = () => <div className="hand text-2xl text-muted py-10 text-center">A carregar…</div>;

export function ErrorBox({ msg }: { msg: string }) {
  return <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg px-3 py-2">{msg}</p>;
}

export function Empty({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="border-[1.5px] border-dashed border-ink/40 rounded-2xl py-14 px-6 text-center bg-white/50">
      <p className="hand text-3xl font-semibold">{title}</p>
      {hint && <p className="text-sm text-muted mt-1 mb-5">{hint}</p>}
      {children}
    </div>
  );
}

export function PageHead({ title, note, children }: { title: string; note?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{title}</h1>
        {note && <p className="hand text-xl sm:text-2xl text-muted leading-none mt-1">{note}</p>}
      </div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sketch-card rounded-t-3xl sm:rounded-2xl w-full max-w-xl p-5 sm:p-7 sm:my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted hover:text-ink" aria-label="Fechar">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const StatusBadge = ({ s }: { s: string }) => (
  <span className={`badge ${s === 'PUBLISHED' ? 'bg-brand text-white' : s === 'ARCHIVED' ? 'bg-gray-200' : 'bg-white'}`}>{s.toLowerCase()}</span>
);

export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="mono text-xs bg-ink text-paper rounded-xl p-4 overflow-x-auto leading-relaxed">{code}</pre>
      <button className="absolute top-2 right-2 mono text-[10px] bg-paper/10 hover:bg-brand hover:text-white text-paper rounded px-2 py-1"
        onClick={(e) => { navigator.clipboard?.writeText(code); const b = e.currentTarget; b.textContent = 'copiado ✓'; setTimeout(() => (b.textContent = 'copiar'), 1200); }}>copiar</button>
    </div>
  );
}

export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const go = (p: number) => { onPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mt-5">
      <span className="mono text-xs text-muted">{total} registos · página {page} de {pages}</span>
      <div className="flex gap-2 ml-auto">
        <button className="btn-secondary btn-sm whitespace-nowrap" disabled={page <= 1} onClick={() => go(page - 1)}>← Anterior</button>
        <button className="btn-secondary btn-sm whitespace-nowrap" disabled={page >= pages} onClick={() => go(page + 1)}>Seguinte →</button>
      </div>
    </nav>
  );
}
