import { ConvexHttpClient } from "convex/browser";
import type { NextjsOptions } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { env } from "@/env";
import { getConvexToken } from "@/lib/convex/token";

export function createConvexHttpClient() {
  if (!env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
}

export async function createAuthenticatedConvexHttpClient() {
  const client = createConvexHttpClient();
  const token = await getConvexToken();
  if (token) {
    client.setAuth(token);
  }
  return client;
}

export async function createAuthenticatedConvexNextjsOptions(): Promise<NextjsOptions> {
  const token = await getConvexToken();
  return {
    token: token ?? undefined,
    url: env.NEXT_PUBLIC_CONVEX_URL,
  };
}

export { api };
