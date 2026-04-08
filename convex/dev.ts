import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auditedInsert } from "./lib/audit";

export const phase2SmokeCreateIndividual = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
  },
  returns: v.object({
    individualId: v.id("individuals"),
    identifierId: v.optional(v.id("entity_identifiers")),
  }),
  handler: async (ctx, args) => {
      const individual = await auditedInsert(
        ctx,
        "individuals",
        {
          legacyId: crypto.randomUUID(),
          firstName: args.firstName,
          middleName: undefined,
          lastName: args.lastName,
          suffix: undefined,
          dateOfBirth: undefined,
          maritalStatus: undefined,
          citizenship: undefined,
          title: undefined,
          metadata: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      );

      let identifierId;
      if (args.email) {
        const identifier = await auditedInsert(
          ctx,
          "entity_identifiers",
          {
            legacyId: crypto.randomUUID(),
            entity: {
              type: "individual",
              id: individual._id,
            },
            identifierType: "email",
            value: args.email,
            verifiedAt: undefined,
            source: "phase2_smoke_test",
            validDuring: undefined,
          },
        );
        identifierId = identifier._id;
      }

      return {
        individualId: individual._id,
        identifierId,
      };
    },
});

export const getAuditEntriesForRow = query({
  args: {
    rowId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audit_log")
      .withIndex("by_row_id", (q) => q.eq("rowId", args.rowId))
      .collect();
  },
});
