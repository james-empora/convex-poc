import { env } from "@/env";
import {
  AUTH_CODE_TTL,
  STATE_TTL,
  createGrantWithToken,
  decryptOAuthState,
  findClientByClientId,
  getBaseUrl,
} from "@/lib/auth/mcp-oauth";

interface OAuthState {
  client_id: string;
  redirect_uri: string;
  original_state: string | null;
  code_challenge: string;
  scope: string | null;
  timestamp: number;
}

function redirectWithError(oauthState: OAuthState, error: string): Response {
  const url = new URL(oauthState.redirect_uri);
  url.searchParams.set("error", error);
  if (oauthState.original_state) {
    url.searchParams.set("state", oauthState.original_state);
  }
  return Response.redirect(url.toString(), 302);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stateParam = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (!stateParam) {
    return new Response("Missing state parameter", { status: 400 });
  }

  const oauthState = decryptOAuthState(stateParam) as OAuthState | null;
  if (!oauthState) {
    return new Response("Invalid or expired OAuth state", { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - oauthState.timestamp > STATE_TTL) {
    return new Response("OAuth state expired", { status: 400 });
  }

  if (error) {
    return redirectWithError(oauthState, error);
  }

  if (!code) {
    return redirectWithError(oauthState, "server_error");
  }

  // Exchange Auth0's authorization code for tokens
  const baseUrl = getBaseUrl(req);
  const auth0Response = await fetch(
    `https://${env.AUTH0_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: env.AUTH0_CLIENT_ID,
        client_secret: env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: `${baseUrl}/api/oauth/callback`,
      }),
    },
  );

  if (!auth0Response.ok) {
    return redirectWithError(oauthState, "server_error");
  }

  const auth0Tokens = await auth0Response.json();

  // Extract email from id_token (trusted — received from Auth0 over HTTPS)
  let email: string | null = null;
  let sub: string | null = null;
  if (auth0Tokens.id_token) {
    try {
      const payload = JSON.parse(
        Buffer.from(auth0Tokens.id_token.split(".")[1], "base64url").toString(),
      );
      email = payload.email ?? null;
      sub = payload.sub ?? null;
    } catch {
      // fall through to userinfo
    }
  }

  // Fallback to userinfo endpoint
  if (!email && auth0Tokens.access_token) {
    const userInfoRes = await fetch(
      `https://${env.AUTH0_DOMAIN}/userinfo`,
      { headers: { Authorization: `Bearer ${auth0Tokens.access_token}` } },
    );
    if (userInfoRes.ok) {
      const userInfo = await userInfoRes.json();
      email = userInfo.email ?? null;
      sub = userInfo.sub ?? null;
    }
  }

  if (!email || !sub) {
    return redirectWithError(oauthState, "access_denied");
  }

  // Find the OAuth client and create an authorization code grant
  const client = await findClientByClientId(oauthState.client_id);
  if (!client) {
    return redirectWithError(oauthState, "invalid_client");
  }

  const authCode = await createGrantWithToken({
    oauthClientId: client.id,
    userId: sub,
    userEmail: email,
    grantType: "authorization_code",
    codeChallengeS256: oauthState.code_challenge,
    redirectUri: oauthState.redirect_uri,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL * 1000),
  });

  // Redirect back to the MCP client with the authorization code
  const callbackUrl = new URL(oauthState.redirect_uri);
  callbackUrl.searchParams.set("code", authCode);
  if (oauthState.original_state) {
    callbackUrl.searchParams.set("state", oauthState.original_state);
  }

  return Response.redirect(callbackUrl.toString(), 302);
}
