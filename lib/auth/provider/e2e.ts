import { NextResponse } from "next/server";
import { getE2EUser } from "@/lib/e2e/fixtures";
import type { AuthProvider } from "./types";

export function createE2E(): AuthProvider {
  return {
    async handleProxy(request, { isPublic }) {
      if (
        !isPublic &&
        request.cookies.get("empora-e2e-auth")?.value === "required"
      ) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set(
          "returnTo",
          request.nextUrl.pathname + request.nextUrl.search,
        );
        return NextResponse.redirect(loginUrl);
      }

      const response = NextResponse.next();
      const user = getE2EUser();
      response.headers.set("x-user-id", user.id);
      response.headers.set("x-user-type", user.userType);
      response.headers.set("x-user-permissions", user.permissions.join(","));
      return response;
    },

    async getUser() {
      return getE2EUser();
    },
  };
}
