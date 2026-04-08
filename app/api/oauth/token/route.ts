import { corsOptions, withCors } from "@/lib/cors";
import {
  findGrantByTokenDigest,
  hashToken,
  issueTokenPair,
  revokeGrant,
  verifyPkce,
} from "@/lib/auth/mcp-oauth";

async function parseBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return req.json();
  }
  // application/x-www-form-urlencoded
  const text = await req.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export async function POST(req: Request) {
  const body = await parseBody(req).catch(
    () => ({}) as Record<string, string>,
  );
  const grantType = body.grant_type;

  if (grantType === "authorization_code") {
    return withCors(await handleAuthorizationCode(body));
  }
  if (grantType === "refresh_token") {
    return withCors(await handleRefreshToken(body));
  }

  return withCors(
    Response.json({ error: "unsupported_grant_type" }, { status: 400 }),
  );
}

async function handleAuthorizationCode(body: Record<string, string>) {
  const code = body.code;
  const codeVerifier = body.code_verifier;
  const redirectUri = body.redirect_uri;

  if (!code) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!codeVerifier) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "code_verifier is required",
      },
      { status: 400 },
    );
  }

  const grant = await findGrantByTokenDigest(hashToken(code));
  if (!grant || grant.grantType !== "authorization_code") {
    return Response.json({ error: "invalid_grant" }, { status: 400 });
  }

  if (new Date(grant.expiresAt) < new Date()) {
    return Response.json({ error: "invalid_grant" }, { status: 400 });
  }

  if (!grant.codeChallengeS256 || !verifyPkce(codeVerifier, grant.codeChallengeS256)) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "PKCE verification failed",
      },
      { status: 400 },
    );
  }

  if (grant.redirectUri !== redirectUri) {
    return Response.json({ error: "invalid_grant" }, { status: 400 });
  }

  await revokeGrant(grant.id);

  const tokens = await issueTokenPair(
    grant.oauthClientId,
    grant.userId,
    grant.userEmail,
  );

  return Response.json(tokens);
}

async function handleRefreshToken(body: Record<string, string>) {
  const refreshToken = body.refresh_token;
  if (!refreshToken) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const grant = await findGrantByTokenDigest(hashToken(refreshToken));
  if (!grant || grant.grantType !== "refresh_token") {
    return Response.json({ error: "invalid_grant" }, { status: 400 });
  }

  if (new Date(grant.expiresAt) < new Date()) {
    return Response.json({ error: "invalid_grant" }, { status: 400 });
  }

  await revokeGrant(grant.id);

  const tokens = await issueTokenPair(
    grant.oauthClientId,
    grant.userId,
    grant.userEmail,
  );

  return Response.json(tokens);
}

export function OPTIONS() {
  return corsOptions();
}
