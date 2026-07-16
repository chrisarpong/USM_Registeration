import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logActivity = mutation({
  args: {
    action: v.string(),
    details: v.string(),
    ipAddress: v.string(),
    adminName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {

    const adminName = args.adminName || "Admin";

    await ctx.db.insert("auditLogs", {
      adminId: "admin",
      adminName: adminName as string,
      action: args.action,
      details: args.details,
      ipAddress: args.ipAddress,
      created_at: new Date().toISOString(),
    });
  },
});

export const getLogs = query({
  handler: async (ctx) => {

    return await ctx.db
      .query("auditLogs")
      .order("desc")
      .collect();
  },
});
