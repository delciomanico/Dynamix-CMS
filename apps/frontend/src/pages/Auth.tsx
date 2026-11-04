import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleIcon, Logo } from '../components/Logo';
import { API_URL } from '../lib/api';
import { useAuth } from '../lib/auth';

function Shell({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen paper-grid flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-5 sm:px-8 h-[82px] flex items-center"><Logo /></div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="sketch-card rounded-2xl p-7 sm:p-9 w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="hand text-2xl text-muted mb-6">{note}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  if (user) return <Navigate to="/app" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password); else await register(f.name, f.email, f.password);
      nav('/app', { replace: true });
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Shell title={isLogin ? 'Entrar' : 'Criar conta'} note={isLogin ? 'Bem-vindo de volta!' : 'Começa em 1 minuto.'}>
      <form onSubmit={submit} className="space-y-4">
        {!isLogin && <div><label className="label">Nome</label><input className="input" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>}
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        {err && <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg px-3 py-2">{err}</p>}
        <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? 'A processar…' : isLogin ? 'Entrar' : 'Criar conta'}</button>
      </form>
      <a href={`${API_URL}/auth/google`} className="btn-secondary w-full mt-4"><GoogleIcon /> Continuar com Google</a>
      <p className="text-sm text-muted mt-6 text-center">
        {isLogin ? <>Sem conta? <Link to="/register" className="font-bold text-ink underline">Criar conta</Link></> : <>Já tens conta? <Link to="/login" className="font-bold text-ink underline">Entrar</Link></>}
      </p>
    </Shell>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;

export function AuthCallback() {
  const [params] = useSearchParams();
  const { setToken } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    const t = params.get('token');
    if (t) setToken(t).then(() => nav('/app', { replace: true })); else nav('/login', { replace: true });
  }, []);
  return <div className="min-h-screen flex items-center justify-center hand text-3xl">A entrar…</div>;
}
