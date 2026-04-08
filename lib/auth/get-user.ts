import { headers } from "next/headers";
import { toAppUser, type AppUser } from "@/lib/auth/permissions";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";

export async function getUser(): Promise<AppUser | null> {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) return null;

  const convex = await createAuthenticatedConvexHttpClient();
  const user = await convex.query(api.users.getByLegacyId, { userId });
  return user ? toAppUser(user) : null;
}

export async function requireUser(): Promise<AppUser> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}
