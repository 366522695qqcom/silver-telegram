import { create } from 'zustand';
import type { User, Provider, ApiKey, Stats } from '@/types';
import { authAPI } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
}

interface ProvidersState {
  providers: Provider[];
  apiKeys: ApiKey[];

  setProviders: (providers: Provider[]) => void;
  setApiKeys: (apiKeys: ApiKey[]) => void;
}

interface StatsState {
  stats: Stats;

  setStats: (stats: Stats) => void;
}

const defaultStats: Stats = {
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  avgLatency: 0,
  activeConnections: 0,
};

export const useProvidersStore = create<ProvidersState>((set) => ({
  providers: [],
  apiKeys: [],

  setProviders: (providers) => set({ providers }),
  setApiKeys: (apiKeys) => set({ apiKeys }),
}));

export const useStatsStore = create<StatsState>((set) => ({
  stats: defaultStats,

  setStats: (stats) => set({ stats }),
}));

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  logout: () => {
    authAPI.logout().catch(() => {});
    useProvidersStore.setState({ providers: [], apiKeys: [] });
    useStatsStore.setState({ stats: defaultStats });
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));