import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PostArticle } from '../components/PostArticle';
import { ErrorBox, Spinner, StatusBadge } from '../components/ui';
import { api, Component, Entry, Media, mediaUrl, Project } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useFetch } from '../lib/hooks';
import { resolveTheme } from '../lib/theme';

type Form = { title: string; excerpt: string; category: string; author: string; body: string; cover: string };
const EMPTY: Form = { title: '', excerpt: '', category: '', author: '', body: '', cover: '' };

/** Editor de artigo: barra de estilos (Markdown), pré-visualização fiel à página pública, rascunho/publicar. */
export default function PostEditor() {
  const { pid = '', eid } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const project = useFetch<Project>(`/projects/${pid}`);
  const comps = useFetch<Component[]>(`/projects/${pid}/components`);
  const cid = comps.data?.find((c) => c.slug === 'posts')?.id;
  const [f, setF] = useState<Form>({ ...EMPTY, author: user?.name ?? '' });
  const [entry, setEntry] = useState<Entry | null>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const insertImg = useRef(false);

  useEffect(() => {
    if (!eid) return;
    api<Entry>(`/entries/${eid}`).then((e) => {
      setEntry(e);
      const d = e.data as Partial<Form>;
      setF({ title: d.title ?? '', excerpt: d.excerpt ?? '', category: d.category ?? '', author: d.author ?? '', body: d.body ?? '', cover: d.cover ?? '' });
    }).catch((e) => setErr(e.message));
  }, [eid]);

  if (project.loading || comps.loading) return <Spinner />;
  const p = project.data;
  if (!p || !cid) return <ErrorBox msg={project.error ?? 'Blog não encontrado'} />;
  const set = (k: keyof Form, v: string) => setF((s) => ({ ...s, [k]: v }));
  const back = `/app/blogs/${p.id}`;
  const coverUrl = f.cover ? mediaUrl(p.slug, f.cover) : undefined;
  const preview = { title: f.title, body: f.body, author: f.author, category: f.category, cover: coverUrl, publishedAt: entry?.publishedAt ?? new Date().toISOString() };

  /** Aplica estilo Markdown à seleção: `wrap` envolve o texto; `line` prefixa cada linha. */
  const edit = (kind: 'wrap' | 'line' | 'block', a: string, b = a, ph = 'texto') => {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    let out: string; let from: number; let to: number;
    if (kind === 'wrap') {
      const sel = value.slice(s, e) || ph; out = value.slice(0, s) + a + sel + b + value.slice(e); from = s + a.length; to = from + sel.length;
    } else if (kind === 'line') {
      const ls = value.lastIndexOf('\n', s - 1) + 1; const le = e + (value.indexOf('\n', e) === -1 ? value.length - e : value.indexOf('\n', e) - e);
      const block = value.slice(ls, le) || ph; let n = 0;
      const rep = block.split('\n').map((l) => a.includes('1.') ? `${++n}. ${l}` : a + l).join('\n');
      out = value.slice(0, ls) + rep + value.slice(le); from = ls; to = ls + rep.length;
    } else { out = value.slice(0, s) + a + value.slice(e); from = to = s + a.length; }
    set('body', out);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(from, to); });
  };

  /** Redimensiona a imagem da linha do cursor (ou da seleção): grava a largura em % no texto alternativo. */
  const resizeImg = (pct: number) => {
    const el = ta.current; if (!el) return;
    const v = el.value; const pos = el.selectionStart;
    const re = /!\[([^\]]*)\]\(([^)\s]+)\)/g; let m: RegExpExecArray | null; let hit: RegExpExecArray | null = null;
    while ((m = re.exec(v))) { if (pos >= m.index && pos <= m.index + m[0].length) { hit = m; break; } }
    if (!hit) { // sem cursor dentro de uma imagem: usa a mais próxima antes do cursor
      re.lastIndex = 0; while ((m = re.exec(v))) { if (m.index <= pos) hit = m; }
    }
    if (!hit) { setErr('Coloca o cursor numa imagem para a redimensionar.'); return; }
    setErr('');
    const alt = hit[1].replace(/\|\d+$/, '');
    const rep = `![${alt}${pct < 100 ? `|${pct}` : ''}](${hit[2]})`;
    set('body', v.slice(0, hit.index) + rep + v.slice(hit.index + hit[0].length));
    const at = hit.index + 2;
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(at, at); });
  };

  const upload = async (file: File) => {
    const form = new FormData(); form.append('file', file);
    return api<Media>(`/projects/${pid}/media`, { form });
  };
  const onFile = async (file?: File) => {
    if (!file) return; setErr('');
    try {
      const m = await upload(file);
      if (insertImg.current) edit('block', `![${file.name.replace(/\.\w+$/, '')}](${mediaUrl(p.slug, m.id)})\n`);
      else set('cover', m.id);
    } catch (e) { setErr((e as Error).message); }
  };
  const pick = (forBody: boolean) => { insertImg.current = forBody; fileRef.current?.click(); };

  /** Guarda (cria ou atualiza). Devolve o id do artigo. */
  const persist = async (): Promise<string | null> => {
    if (!f.title.trim() || !f.body.trim()) { setErr('Título e corpo são obrigatórios.'); return null; }
    const data = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
    if (entry) { await api(`/entries/${entry.id}`, { method: 'PATCH', body: { data } }); return entry.id; }
    const created = await api<Entry>(`/components/${cid}/entries`, { body: { data } });
    return created.id;
  };
  const run = async (publish?: boolean) => {
    setBusy(true); setErr(''); setMsg('');
    try {
      const id = await persist(); if (!id) return;
      if (publish !== undefined) await api(`/entries/${id}/${publish ? 'publish' : 'unpublish'}`, { method: 'POST' });
      if (!entry) { nav(`/app/blogs/${p.id}/post/${id}`, { replace: true }); return; }
      setEntry(await api<Entry>(`/entries/${id}`)); setMsg(publish ? 'Publicado ✓' : publish === false ? 'Passou a rascunho ✓' : 'Guardado ✓');
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const del = async () => {
    if (entry && confirm('Eliminar este artigo?')) { await api(`/entries/${entry.id}`, { method: 'DELETE' }); nav(back); }
  };

  const tools: [string, string, () => void][] = [
    ['N', 'Negrito', () => edit('wrap', '**')], ['I', 'Itálico', () => edit('wrap', '*')],
    ['H2', 'Título', () => edit('line', '## ', '', 'Título')], ['H3', 'Subtítulo', () => edit('line', '### ', '', 'Subtítulo')],
    ['•', 'Lista', () => edit('line', '- ', '', 'item')], ['1.', 'Lista numerada', () => edit('line', '1. ', '', 'item')],
    ['❝', 'Citação', () => edit('line', '> ', '', 'citação')], ['</>', 'Código', () => edit('wrap', '`')],
    ['🔗', 'Ligação', () => edit('wrap', '[', '](https://)', 'texto')], ['—', 'Linha', () => edit('block', '\n\n---\n\n')],
    ['🖼', 'Imagem', () => pick(true)],
  ];

  return (
    <>
      <Link to={back} className="mono text-[11px] uppercase tracking-wider text-muted hover:text-ink">← {p.name}</Link>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 mb-6">
        <div className="flex items-center gap-3"><h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{entry ? 'Editar artigo' : 'Novo artigo'}</h1>{entry && <StatusBadge s={entry.status} />}</div>
        <div className="flex flex-wrap items-center gap-2">
          {msg && <span className="text-sm font-medium mr-1">{msg}</span>}
          {entry?.status === 'PUBLISHED' && <a href={`/b/${p.slug}/${entry.slug}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">Ver ↗</a>}
          <button disabled={busy} onClick={() => run()} className="btn-secondary">Guardar</button>
          {entry?.status === 'PUBLISHED'
            ? <button disabled={busy} onClick={() => run(false)} className="btn-secondary">Despublicar</button>
            : <button disabled={busy} onClick={() => run(true)} className="btn-primary">Publicar</button>}
        </div>
      </div>
      {err && <div className="mb-4"><ErrorBox msg={err} /></div>}

      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="min-w-0">
          <input className="w-full bg-transparent text-3xl sm:text-4xl font-semibold tracking-tight outline-none placeholder:text-ink/25 mb-6" placeholder="Título do artigo" value={f.title} onChange={(e) => set('title', e.target.value)} />
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex gap-1 flex-wrap items-center">
              {tools.map(([sym, title, fn]) => <button key={title} type="button" title={title} aria-label={title} onClick={() => { setTab('write'); fn(); }}
                className="mono text-xs min-w-8 h-8 px-2 rounded-lg border border-ink/10 bg-white hover:bg-brand/10 hover:text-brand transition">{sym}</button>)}
              <span className="mx-1 h-5 w-px bg-ink/15" aria-hidden />
              <span className="mono text-[10px] uppercase tracking-wider text-muted mr-0.5" title="Coloca o cursor numa imagem e escolhe a largura">Imagem</span>
              {[25, 50, 75, 100].map((n) => <button key={n} type="button" title={`Imagem a ${n}% da largura`} onClick={() => { setTab('write'); resizeImg(n); }}
                className="mono text-[11px] h-8 px-2 rounded-lg border border-ink/10 bg-white hover:bg-brand/10 hover:text-brand transition">{n}%</button>)}
            </div>
            <div className="flex gap-1">
              {(['write', 'preview'] as const).map((t) => <button key={t} type="button" onClick={() => setTab(t)}
                className={`mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full border border-ink/15 ${tab === t ? 'bg-ink text-white' : 'bg-white'}`}>{t === 'write' ? 'Escrever' : 'Pré-visualizar'}</button>)}
            </div>
          </div>
          {tab === 'write'
            ? <textarea ref={ta} className="input mono !text-[13px] leading-relaxed min-h-[420px] lg:min-h-[520px]" placeholder="Escreve aqui o artigo. Usa a barra acima para estilizar (Markdown)." value={f.body} onChange={(e) => set('body', e.target.value)} />
            : (() => { const th = resolveTheme(p.slug, p.theme); return <div className="b-shell !min-h-0 rounded-2xl p-6 sm:p-10 min-h-[420px] border border-ink/10" style={th.style}><PostArticle p={preview} layout={th.layout} /></div>; })()}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-8">
          <div>
            <label className="label">Capa</label>
            {coverUrl && <img src={coverUrl} alt="" className="w-full aspect-[16/9] object-cover rounded-xl border border-ink/10 mb-2" />}
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-sm" onClick={() => pick(false)}>{coverUrl ? 'Trocar' : 'Carregar imagem'}</button>
              {coverUrl && <button type="button" className="btn-secondary btn-sm" onClick={() => set('cover', '')}>Remover</button>}
            </div>
          </div>
          <div><label className="label">Resumo</label><textarea className="input" rows={4} placeholder="Aparece na lista de artigos" value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} /></div>
          <div><label className="label">Categoria</label><input className="input" value={f.category} onChange={(e) => set('category', e.target.value)} /></div>
          <div><label className="label">Autor</label><input className="input" value={f.author} onChange={(e) => set('author', e.target.value)} /></div>
          {entry && <button type="button" onClick={del} className="btn-danger btn-sm">Eliminar artigo</button>}
        </aside>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
    </>
  );
}
