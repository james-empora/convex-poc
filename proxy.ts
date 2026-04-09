import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth/auth0";
import { api } from "@/convex/_generated/api";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { toAppUser } from "@/lib/auth/permissions";

/** Paths that handle their own auth or must be publicly accessible. */
const PUBLIC_PREFIXES = [
  "/auth/",              // Auth0 SDK login/logout/callback
  "/.well-known/",       // OAuth & MCP discovery metadata
  "/api/oauth/",         // Our OAuth authorization server
  "/api/mcp",            // MCP Streamable HTTP (bearer token auth)
  "/api/sse",            // MCP SSE transport (bearer token auth)
  "/api/internal-mcp",   // Internal MCP for Claude Code (Auth0 JWT auth)
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set(
    "returnTo",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(loginUrl);
}

function isConvexAuthFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('"code":"Unauthenticated"')
    || error.message.includes("Could not verify OIDC token claim")
    || error.message.includes("token hasn't expired")
  );
}

export async function proxy(request: NextRequest) {
  const response = await auth0.middleware(request);

  if (isPublic(request.nextUrl.pathname)) {
    return response;
  }

  const session = await auth0.getSession(request);
  if (!session) {
    return buildLoginRedirect(request);
  }

  // Resolve Auth0 session to local user record (creates on first login)
  const { sub, email } = session.user;
  if (!sub || !email) {
    return NextResponse.redirect(new URL("/auth/logout", request.url));
  }

  try {
    const convex = await createAuthenticatedConvexHttpClient();
    const userDoc = await convex.mutation(api.users.ensureCurrentUser, {});
    const user = userDoc ? toAppUser(userDoc) : null;

    if (!user) {
      // User exists but is deactivated, or couldn't be resolved
      return NextResponse.redirect(new URL("/auth/logout", request.url));
    }

    // Pass user info downstream via headers (readable in server components)
    response.headers.set("x-user-id", user.id);
    response.headers.set("x-user-type", user.userType);
    response.headers.set("x-user-permissions", user.permissions.join(","));

    // Route external users away from internal admin routes
    const pathname = request.nextUrl.pathname;
    const ADMIN_PREFIXES = ["/coordinator", "/portfolio", "/file-board"];
    if (
      user.userType === "external" &&
      ADMIN_PREFIXES.some((p) => pathname.startsWith(p))
    ) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  } catch (err) {
    if (isConvexAuthFailure(err)) {
      return buildLoginRedirect(request);
    }

    console.error("[proxy] Failed to resolve user via Convex:", err);
    // Let the request through without user headers so the app still loads
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
