/** Stop scheduling on failure and await in-flight writes before reporting it. */
export async function mapWithConcurrency<T>(values: readonly T[], concurrency: number, worker: (value: T) => Promise<void>) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('Concurrency must be a positive integer');
  let cursor = 0;
  let failed = false;
  let failure: unknown;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (!failed && cursor < values.length) {
      const index = cursor++;
      try {
        await worker(values[index]);
      } catch (error) {
        if (!failed) failure = error;
        failed = true;
      }
    }
  }));
  if (failed) throw failure;
}
