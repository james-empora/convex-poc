import type { NextRequest, NextResponse } from "next/server";
import type { AppUser } from "@/lib/auth/permissions";

export interface AuthProvider {
  /** Handle proxy-level authentication. Sets user headers on protected routes, redirects to login if needed. */
  handleProxy(
    request: NextRequest,
    opts: { isPublic: boolean },
  ): Promise<NextResponse>;

  /** Get the authenticated user from request context. */
  getUser(): Promise<AppUser | null>;
}
