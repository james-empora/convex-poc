"use client";

import { useUser } from "@auth0/nextjs-auth0";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import { env } from "@/env";

const convexUrl = env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

function useAuth0ForConvex() {
  const { user, isLoading } = useUser();

  return {
    isLoading,
    isAuthenticated: !!user,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const response = await fetch("/api/auth/convex-token", {
        method: "GET",
        cache: "no-store",
        headers: forceRefreshToken ? { "x-convex-force-refresh": "1" } : undefined,
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as { token?: string };
      return payload.token ?? null;
    },
  };
}

export function ConvexAuthProvider({ children }: { children: React.ReactNode }) {
  if (!convexClient) {
    return children;
  }

  return (
    <ConvexProviderWithAuth client={convexClient} useAuth={useAuth0ForConvex}>
      {children}
    </ConvexProviderWithAuth>
  );
}
