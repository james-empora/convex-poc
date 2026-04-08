import { gateway } from "@ai-sdk/gateway";
import { claudeCode } from "ai-sdk-provider-claude-code";
import { env } from "@/env";

const LOCAL_CLAUDE_CODE_OPTIONS = {
  streamingInput: "always" as const,
};

/**
 * Resolve an AI model for use in generateText/streamText.
 *
 * - When AI_GATEWAY_API_KEY is set (Vercel deployments): returns a gateway
 *   model string like "anthropic/claude-sonnet-4.6" which routes through
 *   Vercel AI Gateway automatically.
 * - When absent (local dev): uses the Claude Code adapter which routes
 *   through the local Claude Code CLI.
 */
export function resolveModel(gatewayModelId = "anthropic/claude-sonnet-4.6") {
  if (env.AI_GATEWAY_API_KEY) {
    return gateway(gatewayModelId);
  }

  // Local - enable streaming input so multimodal file/image parts are
  // forwarded to Claude Code instead of being omitted.
  const lower = gatewayModelId.toLowerCase();
  if (lower.includes("opus")) return claudeCode("opus", LOCAL_CLAUDE_CODE_OPTIONS);
  if (lower.includes("haiku")) return claudeCode("haiku", LOCAL_CLAUDE_CODE_OPTIONS);
  return claudeCode("sonnet", LOCAL_CLAUDE_CODE_OPTIONS);
}

/**
 * Workflows should always use AI Gateway for model calls.
 *
 * Local Claude Code remains fine for interactive chat, but workflow execution
 * needs consistent server-side multimodal behavior and should not rely on the
 * local Claude Code CLI proxy path.
 */
export function resolveWorkflowModel(
  gatewayModelId = "anthropic/claude-sonnet-4.6",
) {
  if (!env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY is required for workflow AI calls. Workflows do not fall back to local Claude Code.",
    );
  }

  return gateway(gatewayModelId);
}
