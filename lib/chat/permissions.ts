/**
 * In-memory permission request store for Claude Code agent sessions.
 *
 * Uses globalThis to ensure the pending map is shared across all API routes
 * in the same Node.js process (Next.js dev bundles routes as separate modules,
 * so module-scoped state doesn't work).
 */

export interface PermissionResult {
  behavior: 'allow' | 'deny';
  message?: string;
}

interface PendingPermission {
  resolve: (result: PermissionResult) => void;
  toolName: string;
  title?: string;
  createdAt: number;
}

const GLOBAL_KEY = '__empora_pending_permissions__' as const;

function getPending(): Map<string, PendingPermission> {
  const g = globalThis as unknown as Record<string, Map<string, PendingPermission> | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map();
  }
  return g[GLOBAL_KEY]!;
}

/** Create a permission request and return a promise that resolves when the user responds. */
export function createPermissionRequest(
  id: string,
  toolName: string,
  title?: string,
): Promise<PermissionResult> {
  return new Promise((resolve) => {
    getPending().set(id, { resolve, toolName, title, createdAt: Date.now() });
  });
}

/** Resolve a pending permission request. Returns false if the ID doesn't exist. */
export function resolvePermission(
  id: string,
  behavior: 'allow' | 'deny',
  message?: string,
): boolean {
  const pending = getPending();
  const entry = pending.get(id);
  if (!entry) return false;

  entry.resolve(
    behavior === 'allow'
      ? { behavior: 'allow' }
      : { behavior: 'deny', message: message || 'Denied by user' },
  );
  pending.delete(id);
  return true;
}
