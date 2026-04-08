import { corsOptions, withCors } from "@/lib/cors";
import { getBaseUrl } from "@/lib/auth/mcp-oauth";

export function GET(req: Request) {
  const baseUrl = getBaseUrl(req);

  return withCors(
    Response.json({
      resource: `${baseUrl}/api/`,
      authorization_servers: [baseUrl],
      scopes_supported: ["mcp"],
      bearer_methods_supported: ["header"],
    }),
  );
}

export function OPTIONS() {
  return corsOptions();
}
