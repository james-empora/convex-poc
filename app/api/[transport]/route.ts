import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { registerEmporaTools } from "@/lib/tools/mcp";
import { verifyOAuthToken } from "@/lib/auth/mcp-auth";
import { MAX_TOOL_DURATION_MS } from "@/lib/poll";

const handler = createMcpHandler(
  registerEmporaTools,
  {
    serverInfo: {
      name: "empora-mcp",
      version: "0.1.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: Math.ceil(MAX_TOOL_DURATION_MS / 1000),
  },
);

const authHandler = withMcpAuth(handler, verifyOAuthToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
