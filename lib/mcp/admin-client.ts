/**
 * MCP client for connecting to the Empora Admin Rails backend.
 *
 * Dual-mode:
 * - If EMPORA_ADMIN_MCP_URL + EMPORA_ADMIN_MCP_TOKEN are set, calls the Rails
 *   MCP endpoint directly via HTTP (works locally and on Vercel).
 * - Otherwise, falls back to spawning `claude -p` which routes through the
 *   local Claude Code CLI's MCP connection (local dev only).
 */

import { env } from "@/env";
import { spawn } from "node:child_process";

// ─── Direct HTTP mode ────────────────────────────────────────────────────────

async function callViaDirect<T>(
  toolName: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { EMPORA_ADMIN_MCP_URL: mcpUrl, EMPORA_ADMIN_MCP_TOKEN: mcpToken } = env;

  // Rails MCP tool names include _tool suffix (e.g. search_deals_tool)
  const mcpToolName = toolName.endsWith("_tool") ? toolName : `${toolName}_tool`;

  const response = await fetch(mcpUrl!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${mcpToken}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "tools/call",
      params: { name: mcpToolName, arguments: args },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`MCP HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const rpc = await response.json() as {
    result?: { content?: Array<{ type: string; text?: string }> };
    error?: { message: string; code?: number };
  };

  if (rpc.error) {
    throw new Error(`MCP RPC error: ${rpc.error.message}`);
  }

  const content = rpc.result?.content ?? [];
  const textPart = content.find((c) => c.type === "text");
  if (!textPart?.text) {
    throw new Error(`MCP tool ${toolName} returned no text content`);
  }

  return JSON.parse(textPart.text) as T;
}

// ─── Claude Code CLI fallback ────────────────────────────────────────────────

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
}

function extractFirstJson(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON object found");

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  throw new Error("Unbalanced JSON in response");
}

function runClaude(prompt: string, allowedTool: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", [
      "-p",
      "--output-format", "json",
      "--max-turns", "5",
      "--allowedTools", allowedTool,
      "--permission-mode", "acceptEdits",
    ], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));

    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("error", reject);
    child.on("close", (code) => {
      const stdout = Buffer.concat(chunks).toString("utf-8");
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(`claude exited ${code}: ${stderr.slice(0, 500)}`));
      } else {
        resolve(stdout);
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

async function callViaClaude<T>(
  toolName: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Claude CLI fallback is not available in production. " +
      "Set EMPORA_ADMIN_MCP_URL and EMPORA_ADMIN_MCP_TOKEN.",
    );
  }

  const toolFullName = `mcp__claude_ai_Empora_Prod_Admin__${toolName}_tool`;
  const prompt = `Call the ${toolFullName} tool with exactly these arguments: ${JSON.stringify(args)}\n\nReturn ONLY the raw JSON result from the tool call. No explanation, no markdown formatting.`;

  const stdout = await runClaude(prompt, toolFullName);

  const envelope = JSON.parse(stdout) as {
    type: string;
    subtype: string;
    is_error: boolean;
    result?: string;
    errors?: string[];
  };

  if (envelope.is_error || !envelope.result) {
    const errMsg = envelope.errors?.join("; ") ?? "Unknown error";
    throw new Error(`Claude Code error calling ${toolName}: ${errMsg}`);
  }

  const cleaned = stripCodeFences(envelope.result);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall back to extraction
  }

  const trimmed = cleaned.trim();
  if (trimmed.startsWith("[")) {
    const end = trimmed.lastIndexOf("]");
    if (end !== -1) {
      return JSON.parse(trimmed.slice(0, end + 1)) as T;
    }
  }

  const json = extractFirstJson(cleaned);
  return JSON.parse(json) as T;
}

// ─── Public API ──────────────────────────────────────────────────────────────

function hasDirectConfig(): boolean {
  return Boolean(env.EMPORA_ADMIN_MCP_URL && env.EMPORA_ADMIN_MCP_TOKEN);
}

export async function callAdminTool<T = unknown>(
  toolName: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (hasDirectConfig()) {
    return callViaDirect<T>(toolName, args);
  }
  return callViaClaude<T>(toolName, args);
}
