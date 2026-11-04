import { useEffect, useRef, useState } from 'react';
import { Empty, ErrorBox, PageHead, Pager, Spinner } from '../components/ui';
import { api, Media, Paginated, mediaUrl } from '../lib/api';
import { useFetch } from '../lib/hooks';
import { useProject } from './ProjectLayout';

export default function MediaLibrary() {
  const { project } = useProject();
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useFetch<Paginated<Media>>(`/projects/${project.id}/media?page=${page}&limit=20`);
  useEffect(() => { if (data && !data.data.length && page > 1) setPage(Math.max(1, data.meta.pages)); }, [data, page]);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setErr('');
    try {
      for (const file of Array.from(files)) { const form = new FormData(); form.append('file', file); await api(`/projects/${project.id}/media`, { form }); }
      reload();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  const del = async (m: Media) => { if (confirm(`Eliminar ${m.filename}?`)) { await api(`/media/${m.id}`, { method: 'DELETE' }); reload(); } };

  if (loading && !data) return <Spinner />;
  return (
    <>
      <PageHead title="Media Library" note="Imagens e ficheiros — guardados em MinIO">
        <input ref={input} type="file" multiple hidden accept="image/*,application/pdf,text/plain" onChange={(e) => upload(e.target.files)} />
        <button className="btn-primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'A enviar…' : '+ Upload'}</button>
      </PageHead>
      {err && <div className="mb-4"><ErrorBox msg={err} /></div>}
      {!data?.data.length ? <Empty title="Biblioteca vazia" hint="Faz upload de imagens (máx. 10 MB) para usar nos conteúdos." /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {data.data.map((m) => (
            <div key={m.id} className="sketch-card rounded-xl overflow-hidden">
              <div className="aspect-square bg-paper paper-grid flex items-center justify-center">
                {m.mimeType.startsWith('image/') ? <img src={mediaUrl(project.slug, m.id)} alt={m.filename} className="w-full h-full object-cover" /> : <span className="mono text-xs">{m.mimeType.split('/')[1]}</span>}
              </div>
              <div className="p-3">
                <div className="text-xs font-bold truncate" title={m.filename}>{m.filename}</div>
                <div className="mono text-[10px] text-muted">{(m.size / 1024).toFixed(1)} KB</div>
                <button onClick={() => del(m)} className="text-xs text-red-700 font-bold mt-2">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {data && <Pager {...data.meta} onPage={setPage} />}
    </>
  );
}
