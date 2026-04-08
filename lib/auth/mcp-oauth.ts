import crypto from "node:crypto";
import { api } from "@/convex/_generated/api";
import { createConvexHttpClient } from "@/lib/convex/client";
import { env } from "@/env";

export const AUTH_CODE_TTL = 600;
export const ACCESS_TOKEN_TTL = 3600;
export const REFRESH_TOKEN_TTL = 2_592_000;
export const STATE_TTL = 600;

export const ALLOWED_REDIRECT_HOSTS = [
  "claude.ai",
  "claude.com",
  "localhost",
  "127.0.0.1",
] as const;

export function generateCredentials() {
  return {
    clientId: crypto.randomBytes(16).toString("hex"),
    clientSecret: crypto.randomBytes(32).toString("hex"),
  };
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function verifyPkce(
  codeVerifier: string,
  expectedChallenge: string,
): boolean {
  const computed = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedChallenge));
  } catch {
    return false;
  }
}

function getEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(env.AUTH0_SECRET).digest();
}

export function encryptOAuthState(data: object): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptOAuthState(encoded: string): object | null {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encoded, "base64url");
    const iv = combined.subarray(0, 12);
    const tag = combined.subarray(12, 28);
    const ciphertext = combined.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    return null;
  }
}

export function isValidRedirectUri(uriString: string): boolean {
  try {
    const url = new URL(uriString);
    return ALLOWED_REDIRECT_HOSTS.includes(url.hostname as (typeof ALLOWED_REDIRECT_HOSTS)[number]);
  } catch {
    return false;
  }
}

export async function findClientByClientId(clientId: string) {
  const convex = createConvexHttpClient();
  return await convex.query(api.oauth.getClientByClientId, { clientId });
}

export async function findGrantByTokenDigest(tokenDigest: string) {
  const convex = createConvexHttpClient();
  return await convex.query(api.oauth.getGrantByTokenDigest, { tokenDigest });
}

export async function createClient(attrs: {
  clientId: string;
  clientSecretDigest: string;
  clientName?: string;
  redirectUris: string[];
}) {
  const convex = createConvexHttpClient();
  return await convex.mutation(api.oauth.createClient, attrs);
}

export async function createGrantWithToken(attrs: {
  oauthClientId: string;
  userId: string;
  userEmail: string;
  grantType: "authorization_code" | "access_token" | "refresh_token";
  expiresAt: Date;
  codeChallengeS256?: string;
  redirectUri?: string;
}) {
  const rawToken = generateToken();
  const convex = createConvexHttpClient();

  await convex.mutation(api.oauth.createGrant, {
    ...attrs,
    tokenDigest: hashToken(rawToken),
    expiresAt: attrs.expiresAt.getTime(),
  });

  return rawToken;
}

export async function revokeGrant(id: string) {
  const convex = createConvexHttpClient();
  await convex.mutation(api.oauth.revokeGrant, { grantId: id });
}

export async function issueTokenPair(
  oauthClientId: string,
  userId: string,
  userEmail: string,
) {
  const now = new Date();

  const accessToken = await createGrantWithToken({
    oauthClientId,
    userId,
    userEmail,
    grantType: "access_token",
    expiresAt: new Date(now.getTime() + ACCESS_TOKEN_TTL * 1000),
  });

  const refreshToken = await createGrantWithToken({
    oauthClientId,
    userId,
    userEmail,
    grantType: "refresh_token",
    expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL * 1000),
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL,
    refresh_token: refreshToken,
  };
}

export function getBaseUrl(req: Request): string {
  if (env.APP_BASE_URL) return env.APP_BASE_URL;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
