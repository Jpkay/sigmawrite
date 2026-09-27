/** Bounded retries for read-only QA database observations. Never wrap mutations. */
export async function retryQaRead<T extends { status: number; error: unknown }>(
  read: () => PromiseLike<T>,
  sleep: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const result = await read();
    const transient = result.status === 0 || result.status === 408 || result.status === 429
      || (result.status >= 500 && result.status <= 599);
    if (!result.error || !transient) return result;
    if (attempt === 2) throw new Error(`QA database read failed after 3 attempts (HTTP ${result.status})`);
    await sleep(250 * 2 ** attempt);
  }
}
