import { create } from 'zustand';
import type { User, Provider, ApiKey, Stats } from '@/types';

interface AppState {
  user: User | null;
  providers: Provider[];
  apiKeys: ApiKey[];
  stats: Stats;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setProviders: (providers: Provider[]) => void;
  setApiKeys: (apiKeys: ApiKey[]) => void;
  setStats: (stats: Stats) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  providers: [],
  apiKeys: [],
  stats: {
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    avgLatency: 0,
    activeConnections: 0,
  },
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setProviders: (providers) => set({ providers }),
  setApiKeys: (apiKeys) => set({ apiKeys }),
  setStats: (stats) => set({ stats }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  logout: () => {
    localStorage.removeItem('token');
    set({ 
      user: null, 
      isAuthenticated: false, 
      providers: [], 
      apiKeys: [],
      stats: {
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        avgLatency: 0,
        activeConnections: 0,
      }
    });
  },
}));
