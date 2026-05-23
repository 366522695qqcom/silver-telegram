const RetryService = require('../retry');

function createError(status) {
  const error = new Error('Request failed');
  error.response = { status };
  return error;
}

describe('RetryService', () => {
  describe('first call succeeds', () => {
    it('should return the result on the first attempt without retrying', async () => {
      const retryService = new RetryService({ maxRetries: 3, initialDelay: 10 });
      const fn = jest.fn().mockResolvedValue('ok');

      const result = await retryService.execute(fn);

      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryable status codes', () => {
    it.each([429, 500, 502, 503, 504])(
      'should retry on status %d',
      async (status) => {
        const retryService = new RetryService({
          maxRetries: 3,
          initialDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
        });
        const fn = jest.fn()
          .mockRejectedValueOnce(createError(status))
          .mockResolvedValue('recovered');

        const result = await retryService.execute(fn);

        expect(result).toBe('recovered');
        expect(fn).toHaveBeenCalledTimes(2);
      },
    );
  });

  describe('non-retryable status codes', () => {
    it.each([400, 401, 403])(
      'should immediately throw on status %d without retrying',
      async (status) => {
        const retryService = new RetryService({
          maxRetries: 3,
          initialDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
        });
        const fn = jest.fn().mockRejectedValue(createError(status));

        await expect(retryService.execute(fn)).rejects.toThrow('Request failed');
        expect(fn).toHaveBeenCalledTimes(1);
      },
    );
  });

  describe('exceeds max retries', () => {
    it('should throw the last error after exhausting all retries', async () => {
      const retryService = new RetryService({
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
      });
      const fn = jest.fn().mockRejectedValue(createError(500));

      await expect(retryService.execute(fn)).rejects.toThrow('Request failed');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('exponential backoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should increase delay between retries (1000, 2000, 4000)', async () => {
      const retryService = new RetryService({
        maxRetries: 4,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      });
      const fn = jest.fn()
        .mockRejectedValueOnce(createError(500))
        .mockRejectedValueOnce(createError(500))
        .mockRejectedValueOnce(createError(500))
        .mockResolvedValue('success');

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const promise = retryService.execute(fn);

      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);
      await jest.advanceTimersByTimeAsync(4000);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(4);

      const delays = setTimeoutSpy.mock.calls
        .map((call) => call[1])
        .filter((ms) => typeof ms === 'number' && ms > 0);
      expect(delays).toEqual([1000, 2000, 4000]);

      setTimeoutSpy.mockRestore();
    });
  });
});
