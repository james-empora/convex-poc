const MODEL_ID = "anthropic/claude-sonnet-4.6";

async function loadSkillAndWorkflowRun(threadId: string) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  return await convex.query(api.skills.getRunContextByThread, { threadId });
}

async function markWorkflowRunning(workflowRunId: string) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  await convex.mutation(api.skills.markRunRunning, { workflowRunId });
}

async function executeSkillPrompt(
  promptTemplate: string,
  fileId: string,
  resourceType?: string | null,
  resourceId?: string | null,
  customPrompt?: string | null,
) {
  "use step";
  const { generateText, stepCountIs } = await import("ai");
  const { resolveWorkflowModel } = await import("@/lib/ai/model");
  const { buildSystemPrompt } = await import("@/lib/chat/system-prompt");
  const { buildFinancialSystemPrompt } = await import("@/lib/chat/financial-system-prompt");
  const { buildChatTools } = await import("@/lib/tools/registry");
  const { createConvexHttpClient } = await import("@/lib/convex/client");

  const resource =
    resourceType && resourceId
      ? { type: resourceType as "file" | "ledger" | "entity", id: resourceId }
      : undefined;

  const systemPrompt =
    resource?.type === "ledger"
      ? buildFinancialSystemPrompt(fileId, resource, undefined, true)
      : buildSystemPrompt(fileId, undefined, true);

  const finalPrompt = customPrompt
    ? `${promptTemplate}\n\n---\n\nAdditional context:\n${customPrompt}`
    : promptTemplate;

  const tools = buildChatTools(null, createConvexHttpClient());

  const result = await generateText({
    model: resolveWorkflowModel(MODEL_ID),
    system: systemPrompt,
    prompt: finalPrompt,
    tools,
    stopWhen: stepCountIs(15),
  });

  const totalUsage = result.steps.reduce(
    (acc, step) => ({
      inputTokens: acc.inputTokens + (step.usage.inputTokens ?? 0),
      outputTokens: acc.outputTokens + (step.usage.outputTokens ?? 0),
    }),
    { inputTokens: 0, outputTokens: 0 },
  );

  return {
    text: result.text,
    modelId: MODEL_ID,
    tokenUsage: totalUsage,
  };
}

async function saveSkillResults(
  threadId: string,
  promptTemplate: string,
  aiText: string,
  modelId: string,
  tokenUsage: { inputTokens: number; outputTokens: number },
  workflowRunId: string,
  skillLabel: string,
) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  await convex.mutation(api.skills.completeRun, {
    threadId,
    promptTemplate,
    aiText,
    modelId,
    tokenUsage,
    workflowRunId,
    skillLabel,
  });
}

async function markWorkflowFailed(workflowRunId: string, errorMessage: string) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  await convex.mutation(api.skills.failRun, { workflowRunId, errorMessage });
}

export async function runSkillWorkflow(threadId: string) {
  "use workflow";

  const {
    workflowRunId,
    skillLabel,
    promptTemplate,
    fileId,
    resourceType,
    resourceId,
    customPrompt,
  } = await loadSkillAndWorkflowRun(threadId);

  await markWorkflowRunning(workflowRunId);

  try {
    const { text, modelId, tokenUsage } = await executeSkillPrompt(
      promptTemplate,
      fileId,
      resourceType,
      resourceId,
      customPrompt,
    );

    const savedPrompt = customPrompt
      ? `${promptTemplate}\n\n---\n\nAdditional context:\n${customPrompt}`
      : promptTemplate;

    await saveSkillResults(
      threadId,
      savedPrompt,
      text,
      modelId,
      tokenUsage,
      workflowRunId,
      skillLabel,
    );

    return { threadId, workflowRunId, skillLabel };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown skill execution error";
    await markWorkflowFailed(workflowRunId, message);
    throw error;
  }
}
