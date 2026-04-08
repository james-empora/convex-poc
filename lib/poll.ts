/**
 * Maximum duration (ms) for long-running tool calls. Set just under
 * Vercel's 800s Fluid Compute ceiling so we never exceed the platform limit.
 */
export const MAX_TOOL_DURATION_MS = 799_000;

/**
 * Generic polling helper — repeatedly calls `check` until it returns a ready
 * result or the timeout expires. Useful for waiting on async background jobs
 * (document extraction, workflow steps, etc.) inside a single tool call.
 *
 * @returns The result from `check` once ready
 * @throws If timeout expires or `check` throws
 */
export async function pollUntilReady<T>(
  check: () => Promise<
    | { ready: true; result: T }
    | { ready: false }
  >,
  options?: {
    /** Milliseconds between checks (default: 5 000) */
    intervalMs?: number;
    /** Maximum wait before giving up (default: MAX_TOOL_DURATION_MS) */
    timeoutMs?: number;
  },
): Promise<T> {
  const interval = options?.intervalMs ?? 5_000;
  const timeout = options?.timeoutMs ?? MAX_TOOL_DURATION_MS;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const status = await check();
    if (status.ready) return status.result;
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(
    `Timed out after ${Math.round(timeout / 1000)}s waiting for result`,
  );
}
