import { isDisplayableToolName } from "@/lib/tools/catalog";

/** Recognized tool part shape (covers both ToolUIPart and DynamicToolUIPart). */
export type ToolPartLike = {
  type: string;
  toolCallId: string;
  toolName?: string;
  state: string;
  input?: unknown;
  output?: unknown;
};

/** Check if a UIMessage part represents a displayable tool invocation. */
export function isToolPart(p: { type: string; toolName?: string }): boolean {
  const name = getToolName(p);
  return name !== null && isDisplayableToolName(name);
}

/** Extract the normalized tool name, or null if not a tool part. */
function getToolName(p: { type: string; toolName?: string }): string | null {
  if (p.type === "dynamic-tool" && p.toolName) {
    return p.toolName.replace(/^mcp__[^_]+__/, "");
  }
  if (p.type.startsWith("tool-")) {
    return p.type.replace(/^tool-/, "");
  }
  return null;
}

/**
 * Extract the tool name from a tool part, stripping MCP prefixes.
 * - ToolUIPart:        type="tool-register_document" → "register_document"
 * - DynamicToolUIPart: type="dynamic-tool", toolName="mcp__empora__registerDocument" → "registerDocument"
 */
export function getToolPartName(p: ToolPartLike): string {
  if (p.type === "dynamic-tool" && p.toolName) {
    // Strip MCP server prefix (e.g., "mcp__empora__registerDocument" → "registerDocument")
    return p.toolName.replace(/^mcp__[^_]+__/, "");
  }
  // Static tool: type is "tool-<name>"
  return p.type.replace(/^tool-/, "");
}
