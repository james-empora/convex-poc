import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { jsonSchema as aiJsonSchema, tool as defineAiTool } from "ai";
import type { ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { createConvexHttpClient } from "@/lib/convex/client";
import type { AppUser } from "@/lib/auth/permissions";
import { listToolDefinitions } from "@/lib/tools/catalog";
import type { ToolDefinition } from "@/lib/tools/define-tool";

type McpAuthInfo = {
  token: string;
  clientId?: string;
  scopes?: string[];
  extra?: Record<string, unknown>;
};

type ToolExecutionContext = {
  convex: ConvexHttpClient;
};

type ToolEntry = {
  definition: ToolDefinition;
  input: z.ZodTypeAny;
  execute: (input: unknown, context: ToolExecutionContext) => Promise<unknown>;
};

const uuid = z.string().uuid();
const passthrough = () => z.object({}).passthrough();
const optionalUuid = uuid.optional();

const TOOL_DEFINITION_BY_NAME = new Map(
  listToolDefinitions().map((definition) => [definition.toolName, definition]),
);

function getDefinition(toolName: string) {
  const definition = TOOL_DEFINITION_BY_NAME.get(toolName);
  if (!definition) {
    throw new Error(`Missing tool definition for ${toolName}`);
  }
  return definition;
}

function createConvexToolEntry(
  definition: ToolDefinition,
  input: z.ZodTypeAny,
  execute: (client: ConvexHttpClient, input: unknown) => Promise<unknown>,
): ToolEntry {
  return {
    definition,
    input,
    execute: async (decodedInput, context) => execute(context.convex, decodedInput),
  };
}

function toolInput(definition: ToolDefinition, fallback: z.ZodTypeAny = passthrough()) {
  return definition.inputSchema ?? fallback;
}

const TOOL_ENTRIES: ToolEntry[] = [
  createConvexToolEntry(getDefinition("registerDocument"), toolInput(getDefinition("registerDocument")), (client, input) =>
    client.mutation(api.documents.registerClientUpload, input as never)),
  createConvexToolEntry(getDefinition("getExtractedText"), z.object({ documentId: uuid }), (client, input) =>
    client.query(api.documents.getExtractedText, input as never)),
  createConvexToolEntry(getDefinition("listFileDocuments"), z.object({ fileId: uuid }), (client, input) =>
    client.query(api.documents.listFileDocuments, input as never)),
  createConvexToolEntry(getDefinition("openFile"), toolInput(getDefinition("openFile")), (client, input) =>
    client.mutation(api.files.openFile, input as never)),
  createConvexToolEntry(getDefinition("listFiles"), passthrough(), (client, input) =>
    client.query(api.files.listFiles, input as never)),
  createConvexToolEntry(getDefinition("getFile"), toolInput(getDefinition("getFile"), z.object({ fileId: uuid })), (client, input) =>
    client.query(api.files.getFile, input as never)),
  createConvexToolEntry(getDefinition("addFileParty"), toolInput(getDefinition("addFileParty")), (client, input) =>
    client.mutation(api.files.addFileParty, input as never)),
  createConvexToolEntry(getDefinition("removeFileParty"), passthrough(), (client, input) =>
    client.mutation(api.files.removeFileParty, input as never)),
  createConvexToolEntry(getDefinition("readEntities"), passthrough(), (client, input) =>
    client.query(api.entities.readEntities, input as never)),
  createConvexToolEntry(getDefinition("searchEntities"), toolInput(getDefinition("searchEntities")), (client, input) =>
    client.query(api.entities.searchEntities, input as never)),
  createConvexToolEntry(getDefinition("createEntity"), toolInput(getDefinition("createEntity")), (client, input) =>
    client.mutation(api.entities.createEntity, input as never)),
  createConvexToolEntry(getDefinition("generateStatement"), z.object({ fileId: uuid }), (client, input) =>
    client.mutation(api.finances.generateStatement, input as never)),
  createConvexToolEntry(getDefinition("getLedgerSummary"), z.object({ ledgerId: optionalUuid, fileId: optionalUuid }).refine((value) => !!value.ledgerId || !!value.fileId), (client, input) =>
    client.query(api.finances.getLedger, input as never)),
  createConvexToolEntry(getDefinition("getLineItems"), z.object({ ledgerId: uuid }), (client, input) =>
    client.query(api.finances.getLineItems, input as never)),
  createConvexToolEntry(getDefinition("getPayments"), z.object({ ledgerId: uuid }), (client, input) =>
    client.query(api.finances.getPayments, input as never)),
  createConvexToolEntry(getDefinition("addLineItem"), passthrough(), (client, input) =>
    client.mutation(api.finances.addLineItem, input as never)),
  createConvexToolEntry(getDefinition("updateLineItem"), passthrough(), (client, input) =>
    client.mutation(api.finances.updateLineItem, input as never)),
  createConvexToolEntry(getDefinition("createProposal"), passthrough(), (client, input) =>
    client.mutation(api.finances.createProposal, input as never)),
  createConvexToolEntry(getDefinition("applyProposal"), z.object({ proposalId: uuid }), (client, input) =>
    client.mutation(api.finances.applyProposal, input as never)),
  createConvexToolEntry(getDefinition("dismissProposal"), z.object({ proposalId: uuid }), (client, input) =>
    client.mutation(api.finances.dismissProposal, input as never)),
  createConvexToolEntry(getDefinition("whatIfAnalysis"), passthrough(), (client, input) =>
    client.query(api.finances.whatIfAnalysis, input as never)),
  createConvexToolEntry(getDefinition("checkDrift"), z.object({ ledgerId: uuid }), (client, input) =>
    client.query(api.finances.checkDrift, input as never)),
  createConvexToolEntry(getDefinition("checkMissingItems"), z.object({ ledgerId: uuid }), (client, input) =>
    client.query(api.finances.checkMissingItems, input as never)),
  createConvexToolEntry(getDefinition("checkFundingReadiness"), z.object({ ledgerId: uuid }), (client, input) =>
    client.query(api.finances.checkFundingReadiness, input as never)),
  createConvexToolEntry(getDefinition("preparePayment"), z.object({ ledgerId: uuid }).extend({ partyId: uuid.optional() }), (client, input) =>
    client.query(api.finances.preparePayment, input as never)),
  createConvexToolEntry(getDefinition("createPayment"), passthrough(), (client, input) =>
    client.mutation(api.finances.createPayment, input as never)),
  createConvexToolEntry(getDefinition("voidPayment"), passthrough(), (client, input) =>
    client.mutation(api.finances.voidPayment, input as never)),
  createConvexToolEntry(getDefinition("getHistory"), z.object({
    rowId: z.string(),
    tableName: z.string().optional(),
    limit: z.number().optional(),
    cursor: z.string().optional(),
  }), (client, input) => client.query(api.audit.getHistory, input as never)),
  createConvexToolEntry(getDefinition("listFindings"), z.object({ fileId: uuid }), (client, input) =>
    client.query(api.findings.listFindings, input as never)),
  createConvexToolEntry(getDefinition("createFinding"), passthrough(), (client, input) =>
    client.mutation(api.findings.createFinding, input as never)),
  createConvexToolEntry(getDefinition("addFindingSource"), passthrough(), (client, input) =>
    client.mutation(api.findings.addFindingSource, input as never)),
  createConvexToolEntry(getDefinition("listSkills"), passthrough(), (client, input) =>
    client.query(api.skills.listSkills, input as never)),
  createConvexToolEntry(getDefinition("getSkill"), z.object({ skillId: uuid }), (client, input) =>
    client.query(api.skills.getSkill, input as never)),
  createConvexToolEntry(getDefinition("createSkill"), passthrough(), (client, input) =>
    client.mutation(api.skills.createSkill, input as never)),
  createConvexToolEntry(getDefinition("updateSkill"), passthrough(), (client, input) =>
    client.mutation(api.skills.updateSkill, input as never)),
  createConvexToolEntry(getDefinition("deleteSkill"), z.object({ skillId: uuid }), (client, input) =>
    client.mutation(api.skills.deleteSkill, input as never)),
  createConvexToolEntry(getDefinition("listActionItems"), z.object({ fileId: uuid.optional() }).passthrough(), (client, input) =>
    client.query(api.actionItems.listItems, input as never)),
  createConvexToolEntry(getDefinition("getActionItem"), z.object({ id: uuid }), (client, input) =>
    client.query(api.actionItems.getItem, input as never)),
  createConvexToolEntry(getDefinition("createActionItem"), passthrough(), (client, input) =>
    client.mutation(api.actionItems.createItem, input as never)),
  createConvexToolEntry(getDefinition("completeActionItem"), z.object({ id: uuid }), (client, input) =>
    client.mutation(api.actionItems.completeItem, input as never)),
  createConvexToolEntry(getDefinition("deleteActionItem"), z.object({ id: uuid }), (client, input) =>
    client.mutation(api.actionItems.deleteItem, input as never)),
  createConvexToolEntry(getDefinition("reassignActionItem"), passthrough(), (client, input) =>
    client.mutation(api.actionItems.reassignItem, input as never)),
  createConvexToolEntry(getDefinition("uncompleteActionItem"), z.object({ id: uuid }), (client, input) =>
    client.mutation(api.actionItems.uncompleteItem, input as never)),
  createConvexToolEntry(getDefinition("reconcileActionItemMap"), passthrough(), (client, input) =>
    client.mutation(api.actionItems.reconcileActionItemMap, input as never)),
];

function decodeToolInput(schema: z.ZodTypeAny, rawInput: unknown) {
  const decoded = schema.safeParse(rawInput);
  if (!decoded.success) {
    throw new Error(decoded.error.issues.map((issue) => issue.message).join(", "));
  }
  return decoded.data;
}

function zodObjectToMcpInputSchema(schema: z.ZodTypeAny) {
  if (schema instanceof z.ZodObject) {
    return schema.shape;
  }

  return passthrough().shape;
}

function zodToAiInputSchema(schema: z.ZodTypeAny) {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;

  if (typeof jsonSchema.type === "string") {
    return jsonSchema as Parameters<typeof aiJsonSchema>[0];
  }

  // Anthropic tool schemas require a top-level object type even when the
  // underlying schema is a union/discriminated union of object shapes.
  return {
    type: "object",
    ...jsonSchema,
  } as Parameters<typeof aiJsonSchema>[0];
}

function createToolClient(authInfo?: McpAuthInfo) {
  const client = createConvexHttpClient();
  if (authInfo?.clientId === "auth0" && authInfo.token) {
    client.setAuth(authInfo.token);
  }
  return client;
}

function createAiTool(entry: ToolEntry, context: ToolExecutionContext): ReturnType<typeof defineAiTool> {
  const makeAiTool = defineAiTool as unknown as (config: unknown) => unknown;

  return makeAiTool({
    description: entry.definition.gatewayDescription,
    inputSchema: aiJsonSchema(zodToAiInputSchema(entry.input)),
    execute: async (rawInput: unknown) => {
      const decoded = decodeToolInput(entry.input, rawInput);

      try {
        return await entry.execute(decoded, context);
      } catch (error) {
        console.error("[tools][ai-execute-error]", {
          toolName: entry.definition.gatewayName,
          input: decoded,
          error: serializeUnknownError(error),
        });
        throw error;
      }
    },
  }) as ReturnType<typeof defineAiTool>;
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

export function buildChatTools(_user: AppUser | null, convex = createConvexHttpClient()) {
  const context: ToolExecutionContext = { convex };

  return Object.fromEntries(
    TOOL_ENTRIES.map((entry) => [entry.definition.gatewayName, createAiTool(entry, context)]),
  );
}

export function registerEmporaTools(server: McpServer) {
  for (const entry of TOOL_ENTRIES) {
    server.registerTool(
      entry.definition.toolName,
      {
        description: entry.definition.gatewayDescription,
        inputSchema: zodObjectToMcpInputSchema(entry.input),
      } as never,
      (async (args: Record<string, unknown>, extra: { authInfo?: McpAuthInfo }) => {
        try {
          const decoded = decodeToolInput(entry.input, args);
          const result = await entry.execute(decoded, {
            convex: createToolClient(extra.authInfo),
          });
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true as const,
          };
        }
      }) as never,
    );
  }
}
