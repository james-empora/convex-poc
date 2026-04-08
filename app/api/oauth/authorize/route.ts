import { env } from "@/env";
import {
  encryptOAuthState,
  findClientByClientId,
  getBaseUrl,
} from "@/lib/auth/mcp-oauth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const responseType = url.searchParams.get("response_type");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope");

  if (responseType !== "code") {
    return Response.json(
      { error: "unsupported_response_type" },
      { status: 400 },
    );
  }

  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "PKCE with S256 is required",
      },
      { status: 400 },
    );
  }

  if (!clientId || !redirectUri) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const client = await findClientByClientId(clientId);
  if (!client) {
    return Response.json({ error: "invalid_client" }, { status: 400 });
  }

  if (!client.redirectUris.includes(redirectUri)) {
    return Response.json({ error: "invalid_redirect_uri" }, { status: 400 });
  }

  const encryptedState = encryptOAuthState({
    client_id: clientId,
    redirect_uri: redirectUri,
    original_state: state,
    code_challenge: codeChallenge,
    scope,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const baseUrl = getBaseUrl(req);
  const auth0Params = new URLSearchParams({
    response_type: "code",
    client_id: env.AUTH0_CLIENT_ID,
    redirect_uri: `${baseUrl}/api/oauth/callback`,
    scope: "openid profile email",
    state: encryptedState,
  });

  return Response.redirect(
    `https://${env.AUTH0_DOMAIN}/authorize?${auth0Params}`,
    302,
  );
}
