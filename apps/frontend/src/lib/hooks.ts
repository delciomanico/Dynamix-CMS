import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const reload = useCallback(async () => {
    if (!path) return;
    try { setError(null); setData(await api<T>(path)); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [path]);
  useEffect(() => { setLoading(!!path); reload(); }, [reload, path]);
  return { data, error, loading, reload, setData };
}
