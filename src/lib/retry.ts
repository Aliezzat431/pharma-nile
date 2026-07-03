/**
 * retry.ts
 * --------
 * Provides a generic exponential back-off retry wrapper for async functions.
 * Automatically retries on transient network / Supabase errors and skips
 * retrying on business-logic errors (validation, auth, etc.).
 */

/** Errors that should NEVER be retried — they are deterministic failures. */
const NON_RETRYABLE_MESSAGES = [
  'Validation Error',
  'Unauthorized',
  'permission denied',
  'violates row-level security',
  'already been returned',
  'is not pending',
  'is not shipped',
];

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  return !NON_RETRYABLE_MESSAGES.some((msg) =>
    err.message.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * Retries `fn` up to `maxAttempts` times with exponential back-off.
 *
 * @param fn           — async function to retry
 * @param maxAttempts  — maximum number of total attempts (default: 3)
 * @param baseDelayMs  — initial delay in ms before first retry (default: 500)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isLast = attempt === maxAttempts;
      if (isLast || !isRetryable(err)) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[retry] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms…`,
        err instanceof Error ? err.message : err
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw lastError;
}
