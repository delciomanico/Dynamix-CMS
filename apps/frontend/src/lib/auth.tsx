import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, token } from './api';

interface User { id: string; email: string; name: string; role: 'USER' | 'ADMIN' }
interface AuthCtx {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  setToken: (t: string) => Promise<void>;
  logout: () => void;
}
const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!token.get());

  const load = useCallback(async () => {
    try { setUser(await api<User>('/auth/me')); } catch { token.clear(); setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (token.get()) load(); }, [load]);

  const finish = (r: { token: string; user: User }) => { token.set(r.token); setUser(r.user); };
  return (
    <Ctx.Provider value={{
      user, loading,
      login: async (email, password) => finish(await api('/auth/login', { body: { email, password } })),
      register: async (name, email, password) => finish(await api('/auth/register', { body: { name, email, password } })),
      setToken: async (t) => { token.set(t); await load(); },
      logout: () => { token.clear(); setUser(null); },
    }}>
      {children}
    </Ctx.Provider>
  );
}
