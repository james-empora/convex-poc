import { z } from "zod";

const uuid = z.string().uuid();
const priorities = ["low", "normal", "high", "urgent"] as const;
const dependencyTypes = ["hard", "soft"] as const;
const actions = ["create", "update", "complete", "delete", "no_change"] as const;

export const ListActionItemsInput = z.object({
  fileId: uuid,
});

export const CreateActionItemInput = z.object({
  fileId: uuid,
  key: z.string(),
  title: z.string(),
  priority: z.enum(priorities).optional(),
  assigneeEntityId: uuid.optional(),
  assigneeEntityType: z.string().optional(),
  assigneeRole: z.string().optional(),
  dueDate: z.string().optional(),
  completionRule: z.unknown().optional(),
  origin: z.enum(["ai", "manual"]).optional(),
});

export const ReassignActionItemInput = z.object({
  id: uuid,
  assigneeEntityId: uuid,
  assigneeEntityType: z.string(),
  assigneeRole: z.string().optional(),
});

export const ReconcileActionItemMapInput = z.object({
  fileId: uuid,
  items: z.array(z.object({
    key: z.string(),
    existingId: uuid.optional(),
    title: z.string(),
    priority: z.enum(priorities),
    assigneeEntityId: uuid.optional(),
    assigneeEntityType: z.string().optional(),
    assigneeRole: z.string().optional(),
    assignmentRationale: z.string().optional(),
    dueDate: z.string().optional(),
    dependsOn: z.array(z.object({
      key: z.string(),
      type: z.enum(dependencyTypes),
    })).optional(),
    completionRule: z.object({
      events: z.array(z.string()),
      conditions: z.array(z.unknown()),
    }).optional(),
    action: z.enum(actions),
    actionReason: z.string().optional(),
  })),
  reasoning: z.string(),
  threadId: z.string().optional(),
});
