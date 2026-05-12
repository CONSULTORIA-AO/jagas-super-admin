import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
  id: number;
  nome: string;
  email: string;
  perfil: string;
}

interface AdminSession {
  token: string | null;
  admin: AdminUser | null;
  pendingEmail: string | null;
  step: 'login' | '2fa' | 'done';
}

interface AdminAuthStore {
  session: AdminSession;
  setSession: (data: Partial<AdminSession>) => void;
  clearSession: () => void;
}

const initialState: AdminSession = {
  token: null,
  admin: null,
  pendingEmail: null,
  step: 'login',
};

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      session: initialState,

      setSession: (data) => {
        const current = get().session;

        set({
          session: {
            ...current,
            ...data,
          },
        });
      },

      clearSession: () =>
        set({
          session: initialState,
        }),
    }),
    {
      name: 'admin-auth',
    }
  )
);
