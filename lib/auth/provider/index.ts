import { isE2ETestMode } from "@/lib/e2e/mode";
import { createReal } from "./real";
import { createE2E } from "./e2e";

export type { AuthProvider } from "./types";

export function createAuthProvider() {
  if (isE2ETestMode()) return createE2E();
  return createReal();
}
