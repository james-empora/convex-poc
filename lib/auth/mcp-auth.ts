import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { findGrantByTokenDigest, hashToken } from "@/lib/auth/mcp-oauth";
import { env } from "@/env";

const auth0Issuer = `https://${env.AUTH0_DOMAIN}/`;
const auth0JWKS = createRemoteJWKSet(
  new URL(`${auth0Issuer}.well-known/jwks.json`),
);

/**
 * Verify a bearer token against our OAuth grants table first,
 * falling back to Auth0 JWT verification. This allows both
 * external MCP clients (custom OAuth flow) and internal callers
 * (chat route forwarding the user's Auth0 access token) to
 * authenticate against the same MCP server.
 */
export async function verifyOAuthToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  // 1. Try custom OAuth grants table (external MCP clients)
  const grant = await findGrantByTokenDigest(hashToken(bearerToken));
  if (grant && grant.grantType === "access_token" && new Date(grant.expiresAt) >= new Date()) {
    return {
      token: bearerToken,
      clientId: grant.oauthClientId,
      scopes: ["mcp"],
      extra: {
        sub: grant.userId,
        email: grant.userEmail,
      },
    };
  }

  // 2. Try Auth0 JWT (internal chat route)
  return verifyAuth0Token(bearerToken);
}

/**
 * Verify an Auth0 access token (JWT) directly.
 * Used by the internal MCP endpoint to authenticate requests
 * from the chat route without triggering the OAuth discovery flow.
 */
export async function verifyAuth0Token(
  bearerToken: string,
): Promise<AuthInfo | undefined> {
  try {
    const { payload } = await jwtVerify(bearerToken, auth0JWKS, {
      issuer: auth0Issuer,
      audience: env.AUTH0_AUDIENCE,
    });

    return {
      token: bearerToken,
      clientId: "auth0",
      scopes: ["mcp"],
      extra: {
        sub: payload.sub,
        email: payload[`${env.AUTH0_AUDIENCE}/email`] ?? payload.email,
      },
    };
  } catch {
    return undefined;
  }
}
