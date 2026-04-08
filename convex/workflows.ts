import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

function legacy(doc: { legacyId?: string; _id: string }) {
  return doc.legacyId ?? doc._id;
}

export const getWorkflowRun = query({
  args: { workflowRunId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const runs = await ctx.db.query("workflow_runs").collect();
    const run = runs.find((entry) => legacy(entry) === args.workflowRunId);
    if (!run) return null;

    return {
      id: legacy(run),
      workflowType: run.workflowType,
      threadId: run.threadId ? legacy((await ctx.db.get(run.threadId)) ?? { _id: run.threadId }) : null,
      status: run.status,
      input: run.input ?? null,
      errorMessage: run.errorMessage ?? null,
      startedAt: run.startedAt ? new Date(run.startedAt).toISOString() : null,
      completedAt: run.completedAt ? new Date(run.completedAt).toISOString() : null,
      createdAt: new Date(run.createdAt).toISOString(),
    };
  },
});
