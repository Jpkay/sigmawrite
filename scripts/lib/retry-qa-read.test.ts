import { describe, expect, it, vi } from 'vitest';
import { retryQaRead } from './retry-qa-read';

describe('read-only QA retries', () => {
  it('recovers from a temporary gateway failure without exposing its response body', async () => {
    const success = { status: 200, error: null, data: { answers: 6 } };
    const read = vi.fn().mockResolvedValueOnce({ status: 521, error: '<html>gateway error</html>' }).mockResolvedValue(success);
    const sleep = vi.fn().mockResolvedValue(undefined);
    expect(await retryQaRead(read, sleep)).toBe(success);
    expect(read).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(250);
  });
  it('bounds persistent outages and returns a concise error', async () => {
    const read = vi.fn().mockResolvedValue({ status: 503, error: 'private response body' });
    await expect(retryQaRead(read, async () => {})).rejects.toThrow('QA database read failed after 3 attempts (HTTP 503)');
    expect(read).toHaveBeenCalledTimes(3);
  });
  it('does not retry permission failures or successful empty reads', async () => {
    for (const result of [{ status: 403, error: 'forbidden' }, { status: 200, error: null, data: null }]) {
      const read = vi.fn().mockResolvedValue(result);
      expect(await retryQaRead(read)).toBe(result);
      expect(read).toHaveBeenCalledTimes(1);
    }
  });
});
