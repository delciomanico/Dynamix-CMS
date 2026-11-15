import { Fragment, ReactNode } from 'react';

/**
 * Renderizador de Markdown minimalista e seguro: produz elementos React (nunca HTML em bruto),
 * por isso o texto dos artigos não pode injetar scripts. Suporta títulos (#–###), negrito, itálico,
 * `código`, blocos de código, listas, citações, linhas (---), ligações e imagens.
 */
const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;

function inline(text: string, keyBase = ''): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(!\[[^\]]*\]\([^)\s]+\))|(\[[^\]]+\]\([^)\s]+\))|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)/;
  let rest = text; let i = 0;
  while (rest) {
    const m = re.exec(rest);
    if (!m) { out.push(rest); break; }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const tok = m[0]; const key = `${keyBase}${i++}`;
    if (m[1]) out.push(<code key={key} className="mono text-[0.9em] b-code rounded px-1.5 py-0.5">{tok.slice(1, -1)}</code>);
    else if (m[2]) {
      const [, alt, url] = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(tok)!;
      // Tamanho opcional no texto alternativo: ![legenda|50](url) → 50% da largura (centrada).
      const sz = /^(.*?)\|(\d{1,3})$/.exec(alt);
      const label = sz ? sz[1] : alt;
      const w = sz ? Math.min(100, Math.max(10, Number(sz[2]))) : 100;
      out.push(SAFE_URL.test(url) ? <img key={key} src={url} alt={label} style={{ width: `${w}%` }} className="block max-w-full rounded-xl my-6 mx-auto" /> : label);
    } else if (m[3]) {
      const [, label, url] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)!;
      out.push(SAFE_URL.test(url)
        ? <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="b-accent underline underline-offset-4 hover:opacity-70">{inline(label, key)}</a>
        : label);
    } else if (m[4]) out.push(<strong key={key} className="font-semibold">{inline(tok.slice(2, -2), key)}</strong>);
    else out.push(<em key={key}>{inline(tok.slice(1, -1), key)}</em>);
    rest = rest.slice(m.index + tok.length);
  }
  return out;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0; let k = 0;
  const isBlank = (l: string) => !l.trim();
  const special = (l: string) => /^(#{1,4}\s|>\s?|```|(-{3,}|\*{3,})\s*$|[-*]\s|\d+\.\s)/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }
    const key = `b${k++}`;

    if (line.startsWith('```')) {
      const buf: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={key} className="mono text-sm b-pre rounded-xl p-4 overflow-x-auto leading-relaxed my-6">{buf.join('\n')}</pre>);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length; i++;
      const cls = lvl === 1 ? 'text-3xl sm:text-4xl mt-12 mb-4' : lvl === 2 ? 'text-2xl sm:text-3xl mt-10 mb-3' : 'text-xl sm:text-2xl mt-8 mb-2';
      const Tag = (lvl <= 2 ? 'h2' : lvl === 3 ? 'h3' : 'h4') as 'h2' | 'h3' | 'h4';
      blocks.push(<Tag key={key} className={`${cls} font-semibold tracking-tight b-head b-fg`}>{inline(h[2], key)}</Tag>);
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { i++; blocks.push(<hr key={key} className="my-10 b-line" />); continue; }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={key} className="hand text-2xl sm:text-3xl leading-snug b-quote border-l-2 pl-5 my-8">{inline(buf.join(' '), key)}</blockquote>);
      continue;
    }
    if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const ordered = /^\d+\.\s/.test(line);
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ''));
      const L = ordered ? 'ol' : 'ul';
      blocks.push(<L key={key} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-6 my-5 space-y-1.5 marker:text-[color:var(--b-accent,#4A6FB5)]`}>{items.map((t, j) => <li key={j}>{inline(t, `${key}-${j}`)}</li>)}</L>);
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && !isBlank(lines[i]) && !(buf.length && special(lines[i]))) buf.push(lines[i++]);
    blocks.push(<p key={key} className="my-5">{buf.map((t, j) => <Fragment key={j}>{j > 0 && <br />}{inline(t, `${key}-${j}`)}</Fragment>)}</p>);
  }
  return <div className="text-[1.05rem] sm:text-lg leading-[1.8] b-fg">{blocks}</div>;
}

/** Texto simples a partir de Markdown (descrições SEO, pré-visualizações). */
export const plain = (md: string) => md.replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`~-]+/g, ' ').replace(/\s+/g, ' ').trim();
