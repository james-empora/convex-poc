import { auth0 } from "@/lib/auth/auth0";

export async function getConvexToken() {
  const session = await auth0.getSession();
  return session?.tokenSet.idToken;
}
