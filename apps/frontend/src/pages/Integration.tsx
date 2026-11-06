import { useEffect, useState } from 'react';
import { CodeBlock, Empty, PageHead, Spinner } from '../components/ui';
import { API_URL, Component, publicBase } from '../lib/api';
import { useFetch } from '../lib/hooks';
import { useProject } from './ProjectLayout';

const PREVIEW_LIMIT = 1;

export default function Integration() {
  const { project } = useProject();
  const { data, loading } = useFetch<Component[]>(`/projects/${project.id}/components`);
  const [sel, setSel] = useState('');
  const [tab, setTab] = useState<'js' | 'react' | 'curl'>('js');
  const [preview, setPreview] = useState('');
  const [total, setTotal] = useState<number | null>(null);
  const c = data?.find((x) => x.slug === sel) ?? data?.[0];
  const url = c ? `${publicBase(project.slug)}/content/${c.slug}` : '';

  useEffect(() => {
    if (!url) return;
    setPreview('…');
    fetch(`${url}?limit=${PREVIEW_LIMIT}`).then((r) => r.json()).then((j) => { setTotal(j?.meta?.total ?? null); setPreview(JSON.stringify(j, null, 2)); }).catch(() => setPreview('Erro ao consultar a API'));
  }, [url]);

  if (loading) return <Spinner />;
  if (!c) return <Empty title="Sem componentes" hint="Cria um componente para gerar o guia de integração." />;
  const name = c.name.replace(/\W/g, '');
  const snippets = {
    js: `async function load${name}() {
  const res = await fetch("${url}");
  if (!res.ok) throw new Error("Não foi possível carregar ${c.slug}.");
  const { data } = await res.json();
  return data; // [{ id, slug, ${c.fields.slice(0, 3).map((f) => f.key).join(', ')}, ... }]
}

load${name}().then((items) => {
  const root = document.querySelector("#${c.slug}");
  root.innerHTML = items.map((i) => \`<article>\${i.${c.fields[0]?.key ?? 'slug'}}</article>\`).join("");
});`,
    react: `import { useEffect, useState } from "react";

export function ${name}List() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("${url}")
      .then((r) => r.json())
      .then((j) => setItems(j.data));
  }, []);

  return items.map((i) => <article key={i.id}>{i.${c.fields[0]?.key ?? 'slug'}}</article>);
}`,
    curl: `curl "${url}?page=1&limit=10&sort=-publishedAt"`,
  };

  return (
    <>
      <PageHead title="Integration Guide" note="Liga o teu website existente ao Dynamix-CMS">
        <select className="input sm:!w-auto" value={c.slug} onChange={(e) => setSel(e.target.value)}>{data!.map((x) => <option key={x.id} value={x.slug}>{x.name}</option>)}</select>
      </PageHead>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 min-w-0">
          <section>
            <h2 className="hand text-3xl font-semibold mb-2">Endpoint</h2>
            <div className="rough-border bg-white p-3 flex items-center gap-2"><span className="mono text-[10px] font-bold bg-brand text-white px-2 py-1 rounded">GET</span><span className="mono text-xs break-all">{url}</span></div>
            <p className="text-xs text-muted mt-2">Query: <span className="mono">page, limit (≤100), sort (-publishedAt), q, filter[campo]=valor</span> · Detalhe: <span className="mono">/{c.slug}/{'{slug}'}</span></p>
          </section>
          <section>
            <h2 className="hand text-3xl font-semibold mb-2">Código</h2>
            <div className="flex gap-2 mb-3">{(['js', 'react', 'curl'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`btn-sm btn ${tab === t ? 'bg-brand text-white' : 'bg-white'}`}>{t === 'js' ? 'JavaScript' : t === 'react' ? 'React' : 'cURL'}</button>)}</div>
            <CodeBlock code={snippets[tab]} />
          </section>
          <p className="text-sm text-muted">Só conteúdos <b>publicados</b> aparecem aqui.{import.meta.env.DEV && <> Documentação completa: <a className="underline font-bold text-ink" target="_blank" rel="noreferrer" href={API_URL.replace('/api/v1', '/docs')}>Swagger ↗</a></>}</p>
        </div>
        <section className="min-w-0">
          <h2 className="hand text-3xl font-semibold mb-2">Resposta ao vivo</h2>
          <p className="text-sm text-muted mb-2">Mostra só {PREVIEW_LIMIT === 1 ? "o primeiro registo" : `os primeiros ${PREVIEW_LIMIT} registos`}{total != null && total > PREVIEW_LIMIT ? <> (de {total})</> : null} — <span className="mono">?limit={PREVIEW_LIMIT}</span>. Usa <span className="mono">page</span> e <span className="mono">limit</span> (máx. 100) para paginar.</p>
          <div className="[&_pre]:max-h-[70vh] [&_pre]:overflow-y-auto"><CodeBlock code={preview} /></div>
        </section>
      </div>
    </>
  );
}
