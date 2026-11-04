import { FormEvent, useState } from 'react';
import { ErrorBox, PageHead } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Account() {
  const { user, setToken } = useAuth();
  const min = user?.role === 'ADMIN' ? 12 : 8;
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setOk(false);
    if (next.length < min) return setErr(`A nova password precisa de pelo menos ${min} caracteres`);
    if (next !== again) return setErr('A confirmação não coincide com a nova password');
    setBusy(true);
    try {
      const r = await api<{ token: string }>('/auth/change-password', { body: { currentPassword: cur, newPassword: next } });
      await setToken(r.token); // as outras sessões deixam de ser válidas; esta continua com o token novo
      setCur(''); setNext(''); setAgain(''); setOk(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Conta" note={user?.email} />
      <form onSubmit={submit} className="sketch-card rounded-2xl p-5 max-w-md space-y-4">
        <h2 className="font-extrabold text-lg">Alterar password</h2>
        <div><label className="label">Password atual</label><input className="input" type="password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div><label className="label">Nova password (mín. {min})</label><input className="input" type="password" autoComplete="new-password" required minLength={min} value={next} onChange={(e) => setNext(e.target.value)} /></div>
        <div><label className="label">Repetir nova password</label><input className="input" type="password" autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} /></div>
        {err && <ErrorBox msg={err} />}
        {ok && <p className="text-sm text-green-800 bg-green-50 border border-green-300 rounded-lg px-3 py-2">Password alterada. As restantes sessões foram terminadas.</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'A guardar…' : 'Alterar password'}</button>
      </form>
    </>
  );
}
