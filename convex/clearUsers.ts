import { mutation } from "./_generated/server";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all users to reset the auth state
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    
    // Also delete all authAccounts to fully clear credentials
    const accounts = await ctx.db.query("authAccounts").collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // Also delete all authSessions
    const sessions = await ctx.db.query("authSessions").collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    
    return "All admin accounts cleared! You can now sign up.";
  },
});
