import { createMcpHandler } from "mcp-handler";
import { registerEmporaTools } from "@/lib/tools/mcp";
import { MAX_TOOL_DURATION_MS } from "@/lib/poll";

const isDev = process.env.NODE_ENV === "development";

const handler = isDev
  ? createMcpHandler(
      registerEmporaTools,
      {
        serverInfo: {
          name: "empora-mcp-internal",
          version: "0.1.0",
        },
      },
      {
        basePath: "/api/internal-mcp",
        maxDuration: Math.ceil(MAX_TOOL_DURATION_MS / 1000),
        verboseLogs: true,
        onEvent: (event) => {
          if (event.type === "ERROR") {
            console.error("[internal-mcp][error]", event);
            return;
          }

          if (event.type === "REQUEST_COMPLETED" && event.status === "error") {
            console.error("[internal-mcp][request-error]", event);
          }
        },
      },
    )
  : () => new Response("Not Found", { status: 404 });

export { handler as GET, handler as POST, handler as DELETE };
