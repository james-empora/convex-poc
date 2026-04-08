import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth0 } from "@/lib/auth/auth0";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { toAppUser } from "@/lib/auth/permissions";
import type { AuthProvider } from "./types";

export function createReal(): AuthProvider {
  return {
    async handleProxy(request, { isPublic }) {
      const response = await auth0.middleware(request);

      if (isPublic) {
        return response;
      }

      const session = await auth0.getSession(request);
      if (!session) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set(
          "returnTo",
          request.nextUrl.pathname + request.nextUrl.search,
        );
        return NextResponse.redirect(loginUrl);
      }

      const { sub, email } = session.user;
      if (!sub || !email) {
        return NextResponse.redirect(new URL("/auth/logout", request.url));
      }

      try {
        const convex = await createAuthenticatedConvexHttpClient();
        const userDoc = await convex.mutation(api.users.ensureCurrentUser, {});
        const user = userDoc ? toAppUser(userDoc) : null;

        if (!user || !user.active) {
          return NextResponse.redirect(new URL("/auth/logout", request.url));
        }

        response.headers.set("x-user-id", user.id);
        response.headers.set("x-user-type", user.userType);
        response.headers.set("x-user-permissions", user.permissions.join(","));
      } catch (err) {
        console.error("[proxy] Failed to resolve user via Convex:", err);
      }

      return response;
    },

    async getUser() {
      const h = await headers();
      const userId = h.get("x-user-id");
      if (!userId) return null;

      const convex = await createAuthenticatedConvexHttpClient();
      const user = await convex.query(api.users.getByLegacyId, { userId });
      return user ? toAppUser(user) : null;
    },
  };
}
