import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useStore } from '@/store';
import { providersAPI, apiKeysAPI, monitorAPI } from '@/services/api';
import Home from '../Home';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

vi.mock('@/services/api', () => ({
  providersAPI: { getAll: vi.fn() },
  apiKeysAPI: { getAll: vi.fn() },
  monitorAPI: { getStats: vi.fn(), getRealtimeStats: vi.fn(), getDaily: vi.fn() },
}));

vi.mock('@/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('lucide-react', () => {
  const createIcon = (name: string) => {
    const Icon = (props: Record<string, unknown>) => <span data-icon={name} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    Activity: createIcon('Activity'),
    Server: createIcon('Server'),
    Key: createIcon('Key'),
    Clock: createIcon('Clock'),
    TrendingUp: createIcon('TrendingUp'),
    Zap: createIcon('Zap'),
    RefreshCw: createIcon('RefreshCw'),
    FlaskConical: createIcon('FlaskConical'),
  };
});

const mockSetProviders = vi.fn();
const mockSetApiKeys = vi.fn();

function setupStore(providers: unknown[] = [], apiKeys: unknown[] = []) {
  vi.mocked(useStore).mockReturnValue({
    providers,
    apiKeys,
    setProviders: mockSetProviders,
    setApiKeys: mockSetApiKeys,
  } as unknown as ReturnType<typeof useStore>);
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('test-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    setupStore([], []);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Renders real data from API', () => {
    it('displays stats values from monitorAPI.getStats and monitorAPI.getRealtimeStats', async () => {
      vi.mocked(monitorAPI.getStats).mockResolvedValue({
        total_requests: 100,
        today_requests: 15,
        success_rate: 95.5,
        avg_latency_ms: 1250,
        top_providers: [{ provider: 'OpenAI', count: 60 }],
        top_models: [{ model: 'gpt-4', count: 40 }],
        provider_stats: [{ provider: 'OpenAI', count: 60, avg_latency_ms: 200, total_cost: 0.5 }],
      });
      vi.mocked(monitorAPI.getRealtimeStats).mockResolvedValue({
        totalRequests: 100,
        successCount: 95,
        errorCount: 5,
        avgLatency: 1250,
        activeConnections: 1,
      });
      vi.mocked(monitorAPI.getDaily).mockResolvedValue([
        { date: '2024-01-01', label: 'Mon', count: 10, success_count: 9 },
        { date: '2024-01-02', label: 'Tue', count: 15, success_count: 14 },
        { date: '2024-01-03', label: 'Wed', count: 12, success_count: 12 },
        { date: '2024-01-04', label: 'Thu', count: 8, success_count: 7 },
        { date: '2024-01-05', label: 'Fri', count: 20, success_count: 19 },
        { date: '2024-01-06', label: 'Sat', count: 5, success_count: 5 },
        { date: '2024-01-07', label: 'Sun', count: 3, success_count: 2 },
      ]);
      vi.mocked(providersAPI.getAll).mockResolvedValue([{ id: '1', provider_name: 'OpenAI', provider_type: 'openai', base_url: 'https://api.openai.com', enabled: 1, created_at: '2024-01-01' }]);
      vi.mocked(apiKeysAPI.getAll).mockResolvedValue([{ id: '1', name: 'Key 1', key: 'sk-test', user_id: 'u1', enabled: 1, created_at: '2024-01-01', expires_at: null }]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeDefined();
      });

      expect(screen.getByText('95.5%')).toBeDefined();
      const latencyElements = screen.getAllByText('1250ms');
      expect(latencyElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('暂无请求数据')).toBeNull();
    });
  });

  describe('Shows empty state when no data', () => {
    it('renders 0 values and shows empty chart placeholder', async () => {
      vi.mocked(monitorAPI.getStats).mockResolvedValue({
        total_requests: 0,
        today_requests: 0,
        success_rate: 0,
        avg_latency_ms: 0,
        top_providers: [],
        top_models: [],
        provider_stats: [],
      });
      vi.mocked(monitorAPI.getRealtimeStats).mockResolvedValue({
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        avgLatency: 0,
        activeConnections: 0,
      });
      vi.mocked(monitorAPI.getDaily).mockResolvedValue([]);
      vi.mocked(providersAPI.getAll).mockResolvedValue([]);
      vi.mocked(apiKeysAPI.getAll).mockResolvedValue([]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('暂无请求数据')).toBeDefined();
      });

      expect(screen.getByText('0ms')).toBeDefined();
    });
  });

  describe('Uses reactive store values', () => {
    it('renders provider count and API key count from useStore', async () => {
      setupStore([{ id: '1' }], [{ id: 'k1' }]);

      vi.mocked(monitorAPI.getStats).mockResolvedValue({
        total_requests: 0,
        today_requests: 0,
        success_rate: 0,
        avg_latency_ms: 0,
        top_providers: [],
        top_models: [],
        provider_stats: [],
      });
      vi.mocked(monitorAPI.getRealtimeStats).mockResolvedValue({
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        avgLatency: 0,
        activeConnections: 0,
      });
      vi.mocked(monitorAPI.getDaily).mockResolvedValue([]);
      vi.mocked(providersAPI.getAll).mockResolvedValue([]);
      vi.mocked(apiKeysAPI.getAll).mockResolvedValue([]);

      render(<Home />);

      await waitFor(() => {
        const elements = screen.getAllByText('1');
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Auto-refresh poll logic', () => {
    it('auto-refreshes every 10 seconds', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });

      vi.mocked(monitorAPI.getStats).mockResolvedValue({
        total_requests: 0,
        today_requests: 0,
        success_rate: 0,
        avg_latency_ms: 0,
        top_providers: [],
        top_models: [],
        provider_stats: [],
      });
      vi.mocked(monitorAPI.getRealtimeStats).mockResolvedValue({
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        avgLatency: 0,
        activeConnections: 0,
      });
      vi.mocked(monitorAPI.getDaily).mockResolvedValue([]);
      vi.mocked(providersAPI.getAll).mockResolvedValue([]);
      vi.mocked(apiKeysAPI.getAll).mockResolvedValue([]);

      render(<Home />);

      await act(async () => {
        vi.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(monitorAPI.getStats).toHaveBeenCalledTimes(1);

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(monitorAPI.getStats).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('clears interval on unmount', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });

      vi.mocked(monitorAPI.getStats).mockResolvedValue({
        total_requests: 0,
        today_requests: 0,
        success_rate: 0,
        avg_latency_ms: 0,
        top_providers: [],
        top_models: [],
        provider_stats: [],
      });
      vi.mocked(monitorAPI.getRealtimeStats).mockResolvedValue({
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        avgLatency: 0,
        activeConnections: 0,
      });
      vi.mocked(monitorAPI.getDaily).mockResolvedValue([]);
      vi.mocked(providersAPI.getAll).mockResolvedValue([]);
      vi.mocked(apiKeysAPI.getAll).mockResolvedValue([]);

      const { unmount } = render(<Home />);

      await waitFor(() => expect(monitorAPI.getStats).toHaveBeenCalled());

      const initialCallCount = vi.mocked(monitorAPI.getStats).mock.calls.length;

      unmount();

      await act(async () => {
        vi.advanceTimersByTime(20000);
      });

      expect(monitorAPI.getStats).toHaveBeenCalledTimes(initialCallCount);

      vi.useRealTimers();
    });
  });
});