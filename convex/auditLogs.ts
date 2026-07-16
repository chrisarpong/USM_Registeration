import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const logActivity = mutation({
  args: {
    action: v.string(),
    details: v.string(),
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(userId);
    const adminName = user?.name || user?.email || "Unknown Admin";

    await ctx.db.insert("auditLogs", {
      adminId: userId,
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
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("auditLogs")
      .order("desc")
      .collect();
  },
});
