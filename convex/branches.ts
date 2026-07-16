import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBranches = query({
  handler: async (ctx) => {
    const branches = await ctx.db.query("branches").collect();
    return branches.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createBranch = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthorized");
    return await ctx.db.insert("branches", {
      name: args.name,
      created_at: new Date().toISOString(),
    });
  },
});
