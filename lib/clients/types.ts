/**
 * Client Strategy Pattern — 3 modes:
 *
 * - 'local'  — Uses local/self-hosted services (e.g., local Claude Code instance).
 *              Only Anthropic fully supports this out of the gate.
 * - 'fake'   — Canned responses for development. No external calls, no costs.
 *              Every client has a fake implementation.
 * - 'real'   — Production API calls. Requires API keys in environment.
 */

export type ClientStrategy = 'real' | 'fake' | 'local' | 'claudecode';

export function resolveStrategy(
  envValue: ClientStrategy | undefined,
  override?: ClientStrategy,
): ClientStrategy {
  return override ?? envValue ?? 'fake';
}

/** Log a fake client call so devs know what "would have" been sent */
export function fakeLog(service: string, method: string, args?: unknown) {
  console.log(`[client:fake] ${service}.${method}`, args ?? '');
}

/** Log a local client call */
export function localLog(service: string, method: string, args?: unknown) {
  console.log(`[client:local] ${service}.${method}`, args ?? '');
}
