import { corsOptions, withCors } from "@/lib/cors";
import {
  createClient,
  generateCredentials,
  hashToken,
  isValidRedirectUri,
} from "@/lib/auth/mcp-oauth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return withCors(
      Response.json({ error: "invalid_request" }, { status: 400 }),
    );
  }

  const clientName = body.client_name || "MCP Client";
  const redirectUris: string[] = Array.isArray(body.redirect_uris)
    ? body.redirect_uris
    : [];

  if (redirectUris.length === 0 || !redirectUris.every(isValidRedirectUri)) {
    return withCors(
      Response.json({ error: "invalid_redirect_uri" }, { status: 400 }),
    );
  }

  const { clientId, clientSecret } = generateCredentials();

  await createClient({
    clientId,
    clientSecretDigest: hashToken(clientSecret),
    clientName,
    redirectUris,
  });

  return withCors(
    Response.json(
      {
        client_id: clientId,
        client_secret: clientSecret,
        client_name: clientName,
        redirect_uris: redirectUris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "client_secret_post",
      },
      { status: 201 },
    ),
  );
}

export function OPTIONS() {
  return corsOptions();
}
