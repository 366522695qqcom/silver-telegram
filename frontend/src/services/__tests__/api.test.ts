import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authAPI } from '../api';

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('authAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('successful request', () => {
    it('authAPI.me() returns parsed JSON on successful response', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockUser),
      });

      const result = await authAPI.me();

      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          credentials: 'include',
        }),
      );
    });
  });

  describe('request timeout', () => {
    it('throws "请求超时，请检查网络连接" on AbortError', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      mockFetch.mockRejectedValue(abortError);

      await expect(authAPI.me()).rejects.toThrow('请求超时，请检查网络连接');
    });
  });

  describe('401 error response', () => {
    it('throws Error with message from response body on 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'Invalid token' }),
      });

      await expect(authAPI.me()).rejects.toThrow('Invalid token');
    });
  });

  describe('token in header', () => {
    it('includes Authorization header when localStorage has token', async () => {
      localStorageMock.getItem.mockReturnValue('my-jwt-token');
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: '1' }),
      });

      await authAPI.me();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
          }),
        }),
      );
    });
  });
});
