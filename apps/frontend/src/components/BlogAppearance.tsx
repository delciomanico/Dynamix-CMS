import { useState } from 'react';
import { api } from '../lib/api';
import { BlogTheme, FONTS, FontKey, LAYOUTS, LayoutKey, PALETTES, PaletteKey, resolveTheme } from '../lib/theme';

/** Esquemas minúsculos de cada layout, só para dar uma ideia da organização da página. */
const Sketch = ({ k }: { k: LayoutKey }) => {
  const bar = 'fill-current opacity-25'; const acc = 'fill-current opacity-60';
  return (
    <svg viewBox="0 0 80 52" className="w-full h-auto">
      {k === 'magazine' && <><rect x="22" y="4" width="36" height="5" className={acc} /><rect x="6" y="14" width="34" height="20" className={bar} /><rect x="44" y="16" width="30" height="3" className={acc} /><rect x="44" y="22" width="26" height="2" className={bar} /><rect x="6" y="38" width="20" height="10" className={bar} /><rect x="30" y="38" width="20" height="10" className={bar} /><rect x="54" y="38" width="20" height="10" className={bar} /></>}
      {k === 'portfolio' && <><rect x="6" y="5" width="40" height="8" className={acc} /><rect x="6" y="17" width="68" height="14" className={bar} /><rect x="6" y="34" width="33" height="14" className={bar} /><rect x="41" y="34" width="33" height="14" className={bar} /></>}
      {k === 'minimal' && <><rect x="24" y="6" width="22" height="4" className={acc} /><rect x="24" y="18" width="32" height="2" className={bar} /><rect x="24" y="24" width="30" height="2" className={bar} /><rect x="24" y="30" width="33" height="2" className={bar} /><rect x="24" y="36" width="28" height="2" className={bar} /><rect x="24" y="42" width="31" height="2" className={bar} /></>}
      {k === 'editorial' && <><rect x="6" y="6" width="20" height="40" className={bar} /><rect x="9" y="10" width="14" height="4" className={acc} /><rect x="32" y="8" width="30" height="3" className={acc} /><rect x="32" y="14" width="40" height="2" className={bar} /><rect x="32" y="26" width="30" height="3" className={acc} /><rect x="32" y="32" width="40" height="2" className={bar} /></>}
    </svg>
  );
};

/** Escolha do layout, da paleta e da tipografia do blog público; guarda no projeto. */
export function BlogAppearance({ projectId, slug, initial, onSaved }: { projectId: string; slug: string; initial?: BlogTheme | null; onSaved: () => void }) {
  const eff = resolveTheme(slug, initial); // valores efetivos (inclui os derivados do slug)
  const [t, setT] = useState<Required<BlogTheme>>({ layout: eff.layout, palette: eff.palette, font: eff.font });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const live = resolveTheme(slug, t);

  const save = async () => {
    setMsg(''); setErr('');
    try { await api(`/projects/${projectId}`, { method: 'PATCH', body: { theme: t } }); setMsg('Aparência guardada ✓'); onSaved(); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="sketch-card rounded-2xl p-6 mt-4 space-y-7">
      <div>
        <p className="label">Layout</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LAYOUTS.map((l) => (
            <button key={l.key} type="button" onClick={() => setT({ ...t, layout: l.key })} title={l.hint}
              className={`text-left rounded-xl border p-3 transition ${t.layout === l.key ? 'border-brand ring-2 ring-brand/20 bg-brand/5' : 'border-ink/15 hover:bg-brand/5'}`}>
              <div className="rounded-md p-2 mb-2" style={live.style}><div className="b-shell !min-h-0 rounded-sm p-1 b-accent"><Sketch k={l.key} /></div></div>
              <p className="text-sm font-medium">{l.label}</p><p className="text-[11px] text-muted leading-snug">{l.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Paleta</p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(PALETTES) as PaletteKey[]).map((k) => {
            const p = PALETTES[k];
            return (
              <button key={k} type="button" onClick={() => setT({ ...t, palette: k })} title={p.label} aria-label={p.label}
                className={`flex items-center gap-2 rounded-full border pl-1.5 pr-3 py-1.5 text-sm transition ${t.palette === k ? 'border-brand ring-2 ring-brand/20' : 'border-ink/15 hover:bg-brand/5'}`}>
                <span className="flex">
                  {[p.bg, p.surface, p.accent, p.fg].map((c, i) => <span key={i} className="w-4 h-4 rounded-full border border-black/10 -ml-1 first:ml-0" style={{ background: c }} />)}
                </span>{p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="label">Tipografia</p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(FONTS) as FontKey[]).map((k) => (
            <button key={k} type="button" onClick={() => setT({ ...t, font: k })} style={{ fontFamily: FONTS[k].head }}
              className={`rounded-xl border px-4 py-2 text-lg transition ${t.font === k ? 'border-brand ring-2 ring-brand/20 bg-brand/5' : 'border-ink/15 hover:bg-brand/5'}`}>{FONTS[k].label}</button>
          ))}
        </div>
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex items-center gap-4 flex-wrap">
        <button type="button" onClick={save} className="btn-primary">Guardar aparência</button>
        <a href={`/b/${slug}`} target="_blank" rel="noreferrer" className="btn-secondary">Ver blog ↗</a>
        {msg && <span className="text-sm font-medium">{msg}</span>}
      </div>
    </div>
  );
}
