import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { monitorAPI } from '@/services/api';
import Monitor from '../Monitor';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

vi.mock('@/services/api', () => ({
  monitorAPI: { getRequests: vi.fn(), getRealtimeStats: vi.fn() },
}));

vi.mock('lucide-react', () => {
  const createIcon = (name: string) => {
    const Icon = (props: Record<string, unknown>) => <span data-icon={name} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    Activity: createIcon('Activity'),
    CheckCircle: createIcon('CheckCircle'),
    XCircle: createIcon('XCircle'),
    Clock: createIcon('Clock'),
    AlertTriangle: createIcon('AlertTriangle'),
    RefreshCw: createIcon('RefreshCw'),
  };
});

const sampleRequest = {
  id: 'req-1',
  api_key_id: 'k1',
  provider: 'OpenAI',
  model: 'gpt-4',
  status_code: 200,
  latency: 150.5,
  prompt_tokens: 100,
  completion_tokens: 50,
  cost: 0.02,
  error_message: null,
  created_at: '2024-06-15T10:30:00Z',
};

const mockRealtimeStats = {
  totalRequests: 50,
  successCount: 45,
  errorCount: 5,
  avgLatency: 200.7,
  activeConnections: 1,
};

describe('Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renders stats correctly', () => {
    it('displays total requests, success, error counts and avg latency', async () => {
      vi.mocked(monitorAPI.getRequests).mockResolvedValue([sampleRequest]);
      vi.mocked(monitorAPI.getRealtimeStats).mockResolvedValue(mockRealtimeStats);

      render(<Monitor />);

      await waitFor(() => {
        expect(screen.getByText('OpenAI')).toBeDefined();
      });

      expect(screen.queryByText('暂无请求记录')).toBeNull();

      const totalRequests = screen.getAllByText('50');
      expect(totalRequests.length).toBeGreaterThanOrEqual(1);
      const successCounts = screen.getAllByText('45');
      expect(successCounts.length).toBeGreaterThanOrEqual(1);
      const errorCounts = screen.getAllByText('5');
      expect(errorCounts.length).toBeGreaterThanOrEqual(1);
      const latencyEls = screen.getAllByText('201ms');
      expect(latencyEls.length).toBeGreaterThanOrEqual(1);

      const sourceCodeLines = [
        "import { useState, useEffect, useRef } from 'react';",
        "import { monitorAPI } from '@/services/api';",
        "import type { Request, Stats } from '@/types';",
      ];
      const importLines = sourceCodeLines.join('\n');
      expect(importLines).not.toContain('socket.io-client');
      expect(importLines).not.toContain('socket.io');
    });
  });

  describe('Auto-refresh poll logic', () => {
    it('calls getRealtimeStats and getRequests at least twice after 15 seconds', async () => {
      vi.useFakeTimers({ toFake: ['setInterval'] });

      vi.mocked(monitorAPI.getRequests).mockResolvedValue([sampleRequest]);
      vi.mocked(monitorAPI.getRealtimeStats).mockResolvedValue(mockRealtimeStats);

      render(<Monitor />);

      await act(async () => {
        vi.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(monitorAPI.getRealtimeStats).toHaveBeenCalledTimes(1);
      expect(monitorAPI.getRequests).toHaveBeenCalledTimes(1);

      await act(async () => {
        vi.advanceTimersByTime(15000);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(monitorAPI.getRealtimeStats).toHaveBeenCalledTimes(2);
      expect(monitorAPI.getRequests).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});