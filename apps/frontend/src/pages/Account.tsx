import { FormEvent, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBox, PageHead, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useAuth, User } from '../lib/auth';
import { useFetch } from '../lib/hooks';
import { fmtDate } from '../lib/blog';

const Ok = ({ children }: { children: ReactNode }) => <p className="text-sm text-green-800 bg-green-50 border border-green-300 rounded-lg px-3 py-2">{children}</p>;

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="sketch-card rounded-2xl p-6 sm:p-8">
      <h2 className="hand text-3xl font-semibold leading-none">{title}</h2>
      {note && <p className="text-sm text-muted mt-2">{note}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/** Estado partilhado dos formulários: erro, sucesso e “a guardar”. */
function useAction() {
  const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<string | void>) => {
    setErr(''); setOk(''); setBusy(true);
    try { const m = await fn(); if (m) setOk(m); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return { err, ok, busy, run, setErr };
}

export default function Account() {
  const { user, setToken, reload, logout } = useAuth();
  const nav = useNavigate();
  const me = useFetch<User>('/auth/me');
  const m = me.data;
  const min = user?.role === 'ADMIN' ? 12 : 8;
  const onlyGoogle = !!m && !m.hasPassword;

  const [name, setName] = useState<string | null>(null);
  const profile = useAction();
  const [newEmail, setNewEmail] = useState(''); const [emailPw, setEmailPw] = useState('');
  const email = useAction();
  const [cur, setCur] = useState(''); const [next, setNext] = useState(''); const [again, setAgain] = useState('');
  const pw = useAction();
  const sessions = useAction();
  const [del, setDel] = useState('');
  const danger = useAction();

  if (me.loading || !m) return <Spinner />;
  const shownName = name ?? m.name;

  const saveName = (e: FormEvent) => { e.preventDefault(); profile.run(async () => {
    await api('/auth/profile', { method: 'PATCH', body: { name: shownName } });
    await reload(); me.reload(); setName(null); return 'Nome guardado ✓';
  }); };

  const saveEmail = (e: FormEvent) => { e.preventDefault(); email.run(async () => {
    const r = await api<{ token: string }>('/auth/change-email', { body: { newEmail, confirm: emailPw } });
    await setToken(r.token); me.reload(); setNewEmail(''); setEmailPw('');
    return 'Email alterado ✓ As restantes sessões foram terminadas.';
  }); };

  const savePw = (e: FormEvent) => { e.preventDefault(); pw.run(async () => {
    if (next.length < min) throw new Error(`A nova password precisa de pelo menos ${min} caracteres`);
    if (next !== again) throw new Error('A confirmação não coincide com a nova password');
    const r = await api<{ token: string }>('/auth/change-password', { body: { currentPassword: cur, newPassword: next } });
    await setToken(r.token); // as outras sessões deixam de ser válidas; esta continua com o token novo
    setCur(''); setNext(''); setAgain('');
    return 'Password alterada. As restantes sessões foram terminadas.';
  }); };

  const endOthers = () => sessions.run(async () => {
    const r = await api<{ token: string }>('/auth/logout-others', { method: 'POST' });
    await setToken(r.token); return 'Sessão terminada em todos os outros dispositivos ✓';
  });

  const deleteAccount = (e: FormEvent) => { e.preventDefault(); danger.run(async () => {
    if (!confirm('Esta ação é definitiva: apaga a conta, os websites, os blogs, os conteúdos e os ficheiros. Continuar?')) return;
    await api('/auth/account', { method: 'DELETE', body: { confirm: del } });
    logout(); nav('/', { replace: true });
  }); };

  return (
    <>
      <PageHead title="Conta" note="O teu perfil e a segurança da conta" />
      <div className="max-w-2xl space-y-8">
        <Card title="Perfil">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="label !mb-0.5">Email</dt><dd className="break-all">{m.email}</dd></div>
            <div><dt className="label !mb-0.5">Início de sessão</dt><dd>{m.google ? (m.hasPassword ? 'Google e password' : 'Google') : 'Email e password'}</dd></div>
            <div><dt className="label !mb-0.5">Membro desde</dt><dd>{fmtDate(m.createdAt)}</dd></div>
            <div><dt className="label !mb-0.5">Conteúdo</dt><dd>{m.websites ?? 0} website{m.websites === 1 ? '' : 's'} · {m.blogs ?? 0} blog{m.blogs === 1 ? '' : 's'}</dd></div>
          </dl>
          <form onSubmit={saveName} className="space-y-3 pt-2">
            <div><label className="label">Nome</label><input className="input" required minLength={2} maxLength={80} value={shownName} onChange={(e) => setName(e.target.value)} /></div>
            {profile.err && <ErrorBox msg={profile.err} />}{profile.ok && <Ok>{profile.ok}</Ok>}
            <button className="btn-primary" disabled={profile.busy || shownName.trim() === m.name}>{profile.busy ? 'A guardar…' : 'Guardar nome'}</button>
          </form>
        </Card>

        <Card title="Email" note={onlyGoogle && m.google ? 'Esta conta usa o início de sessão Google: o email é o da conta Google e não pode ser alterado aqui.' : 'Ao alterar o email, as outras sessões são terminadas.'}>
          {!(m.google && onlyGoogle) && (
            <form onSubmit={saveEmail} className="space-y-4">
              <div><label className="label">Novo email</label><input className="input" type="email" required autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
              <div><label className="label">Password atual (para confirmar)</label><input className="input" type="password" autoComplete="current-password" required value={emailPw} onChange={(e) => setEmailPw(e.target.value)} /></div>
              {email.err && <ErrorBox msg={email.err} />}{email.ok && <Ok>{email.ok}</Ok>}
              <button className="btn-primary" disabled={email.busy}>{email.busy ? 'A guardar…' : 'Alterar email'}</button>
            </form>
          )}
        </Card>

        <Card title="Password" note={onlyGoogle ? 'Esta conta usa o início de sessão Google e não tem password.' : undefined}>
          {!onlyGoogle && (
            <form onSubmit={savePw} className="space-y-4">
              <div><label className="label">Password atual</label><input className="input" type="password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} /></div>
              <div><label className="label">Nova password (mín. {min})</label><input className="input" type="password" autoComplete="new-password" required minLength={min} value={next} onChange={(e) => setNext(e.target.value)} /></div>
              <div><label className="label">Repetir nova password</label><input className="input" type="password" autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} /></div>
              {pw.err && <ErrorBox msg={pw.err} />}{pw.ok && <Ok>{pw.ok}</Ok>}
              <button className="btn-primary" disabled={pw.busy}>{pw.busy ? 'A guardar…' : 'Alterar password'}</button>
            </form>
          )}
        </Card>

        <Card title="Sessões" note="Termina a sessão em todos os outros dispositivos e navegadores. Esta continua ativa.">
          {sessions.err && <ErrorBox msg={sessions.err} />}{sessions.ok && <Ok>{sessions.ok}</Ok>}
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary" disabled={sessions.busy} onClick={endOthers}>Terminar outras sessões</button>
            <button className="btn-secondary" onClick={() => { logout(); nav('/', { replace: true }); }}>Sair desta sessão</button>
          </div>
        </Card>

        <Card title="Zona de perigo" note="Apagar a conta remove definitivamente os teus websites, blogs, conteúdos e ficheiros. Não é possível desfazer.">
          <form onSubmit={deleteAccount} className="space-y-4">
            <div>
              <label className="label">{onlyGoogle ? 'Escreve o teu email para confirmar' : 'Password (para confirmar)'}</label>
              <input className="input" type={onlyGoogle ? 'email' : 'password'} autoComplete={onlyGoogle ? 'off' : 'current-password'} required value={del} onChange={(e) => setDel(e.target.value)} />
            </div>
            {danger.err && <ErrorBox msg={danger.err} />}
            <button className="btn-danger" disabled={danger.busy || !del}>Apagar a minha conta</button>
          </form>
        </Card>
      </div>
    </>
  );
}
