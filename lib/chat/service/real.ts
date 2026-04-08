import {
  streamText,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { gateway } from "@ai-sdk/gateway";
import { claudeCode } from "ai-sdk-provider-claude-code";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { buildChatTools } from "@/lib/chat/tools";
import { persistChatCompletion } from "@/lib/chat/persist";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { env } from "@/env";
import type { ChatService } from "./types";

export function createReal(): ChatService {
  return {
    async streamResponse({
      messages,
      fileId,
      model: requestedModel,
      uploadedFiles,
      chatId,
      user,
      requestUrl,
    }) {
      const useGateway = !!env.AI_GATEWAY_API_KEY;
      const enableLocalDiagnostics =
        !useGateway && process.env.NODE_ENV !== "production";
      const convex = await createAuthenticatedConvexHttpClient();
      const systemPrompt = buildSystemPrompt(
        fileId ?? null,
        uploadedFiles,
        useGateway,
      );

      let model;
      if (useGateway) {
        model = gateway(requestedModel || "anthropic/claude-sonnet-4.6");
      } else {
        // mcp-handler derives Streamable HTTP endpoint as ${basePath}/mcp
        const mcpUrl =
          env.EMPORA_MCP_URL ??
          `${new URL(requestUrl).origin}/api/internal-mcp/mcp`;

        model = claudeCode(mapModelAlias(requestedModel), {
          systemPrompt,
          settingSources: [],
          allowedTools: ["Read", "mcp__empora__*"],
          permissionMode: "acceptEdits",
          stderr: enableLocalDiagnostics
            ? (data: string) => {
                const trimmed = data.trim();
                if (trimmed) {
                  console.error(
                    "[chat/local][claude-code][stderr]",
                    trimmed,
                  );
                }
              }
            : undefined,
          mcpServers: {
            empora: {
              type: "http" as const,
              url: mcpUrl,
            },
          },
        });
      }

      const result = streamText({
        model,
        system: useGateway ? systemPrompt : undefined,
        messages: await convertToModelMessages(messages),
        tools: useGateway ? buildChatTools(user, convex) : undefined,
        stopWhen: stepCountIs(8),
        includeRawChunks: enableLocalDiagnostics,
        onChunk: enableLocalDiagnostics
          ? async ({ chunk }) => {
              const diagnosticChunk = chunk as {
                type: string;
                toolName?: string;
                toolCallId?: string;
                error?: unknown;
                providerExecuted?: boolean;
                providerMetadata?: unknown;
                input?: unknown;
                rawValue?: unknown;
              };

              if (diagnosticChunk.type === "tool-error") {
                console.error("[chat/local][tool-error]", {
                  toolName: diagnosticChunk.toolName,
                  toolCallId: diagnosticChunk.toolCallId,
                  error: serializeUnknownError(diagnosticChunk.error),
                  providerExecuted: diagnosticChunk.providerExecuted,
                  providerMetadata: diagnosticChunk.providerMetadata,
                  input: diagnosticChunk.input,
                });
              }

              if (diagnosticChunk.type === "raw") {
                console.error(
                  "[chat/local][raw-chunk]",
                  diagnosticChunk.rawValue,
                );
              }
            }
          : undefined,
        onError: enableLocalDiagnostics
          ? async ({ error }) => {
              console.error(
                "[chat/local][stream-error]",
                serializeUnknownError(error),
              );
            }
          : undefined,
      });

      return result.toUIMessageStreamResponse({
        originalMessages: messages,
        onFinish: async ({ messages: updatedMessages }) => {
          if (!chatId) return;
          try {
            const usage = await result.usage;
            const modelId =
              requestedModel ||
              (useGateway
                ? "anthropic/claude-sonnet-4.6"
                : `claude-code/${mapModelAlias(requestedModel)}`);
            await persistChatCompletion({
              convex,
              chatId,
              fileId: fileId ?? null,
              model: modelId,
              messages: updatedMessages,
              tokenUsage: usage.inputTokens != null
                ? {
                    inputTokens: usage.inputTokens,
                    outputTokens: usage.outputTokens ?? 0,
                  }
                : null,
            });
          } catch (error) {
            console.error("[api/chat] Failed to persist chat", error);
          }
        },
      });
    },
  };
}

/** Map gateway-style model IDs to Claude Code aliases (sonnet/opus/haiku). */
function mapModelAlias(model?: string): string {
  if (!model) return "sonnet";
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return "opus";
  if (lower.includes("haiku")) return "haiku";
  return "sonnet";
}

function serializeUnknownError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  return error;
}
