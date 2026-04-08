import { corsOptions, withCors } from "@/lib/cors";
import { getBaseUrl } from "@/lib/auth/mcp-oauth";

export function GET(req: Request) {
  const baseUrl = getBaseUrl(req);

  return withCors(
    Response.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
      token_endpoint: `${baseUrl}/api/oauth/token`,
      registration_endpoint: `${baseUrl}/api/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      scopes_supported: ["mcp"],
    }),
  );
}

export function OPTIONS() {
  return corsOptions();
}
