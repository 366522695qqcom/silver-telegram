import { create } from 'zustand';
import { User, Provider, ApiKey, DashboardStats, Request, AuditLog } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  providers: Provider[];
  selectedProviderId: string | null;
  stats: DashboardStats | null;
  requests: Request[];
  auditLogs: AuditLog[];
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setProviders: (providers: Provider[]) => void;
  setSelectedProviderId: (id: string | null) => void;
  setStats: (stats: DashboardStats | null) => void;
  setRequests: (requests: Request[]) => void;
  setAuditLogs: (logs: AuditLog[]) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  
  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    providers: [],
    selectedProviderId: null,
    stats: null,
    requests: [],
    auditLogs: [],
    
    setUser: (user) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      set({ user });
    },
    
    setToken: (token) => {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
      set({ token });
    },
    
    setProviders: (providers) => set({ providers }),
    setSelectedProviderId: (id) => set({ selectedProviderId: id }),
    setStats: (stats) => set({ stats }),
    setRequests: (requests) => set({ requests }),
    setAuditLogs: (logs) => set({ auditLogs: logs }),
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    },
  };
});
