import { create } from 'zustand';
import { api } from '../lib/api';

interface Me {
  id: string;
  username: string;
  avatarSeed: string;
  countryCode: string | null;
  bio: string | null;
  xp: number;
  level: number;
  streakDays: number;
  ratings: Record<string, number>;
}

interface AuthState {
  status: 'loading' | 'authenticated' | 'anonymous';
  me: Me | null;
  refresh: () => Promise<void>;
  setMe: (me: Me) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  me: null,
  refresh: async () => {
    try {
      const me = await api.me();
      set({ me, status: 'authenticated' });
    } catch {
      set({ me: null, status: 'anonymous' });
    }
  },
  setMe: (me) => set({ me, status: 'authenticated' }),
  logout: async () => {
    await api.logout().catch(() => void 0);
    set({ me: null, status: 'anonymous' });
  },
}));
