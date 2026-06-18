import { mutation } from "./_generated/server";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "users",
      "authSessions",
      "authAccounts",
      "authRefreshTokens",
      "authVerificationCodes",
      "authVerifiers",
      "authRateLimits",
    ];

    for (const table of tables) {
      try {
        const rows = await ctx.db.query(table as any).collect();
        for (const row of rows) {
          await ctx.db.delete(row._id);
        }
      } catch (e) {
        console.log(`Failed or no table ${table}`);
      }
    }
    
    // Check if there are other tables like authPasswords
    try {
        const rows = await ctx.db.query("authPassword" as any).collect();
        for (const row of rows) { await ctx.db.delete(row._id); }
    } catch(e) {}
    try {
        const rows = await ctx.db.query("authAccountCredentials" as any).collect();
        for (const row of rows) { await ctx.db.delete(row._id); }
    } catch(e) {}
    
    // Also delete adminUsers
    try {
        const rows = await ctx.db.query("adminUsers" as any).collect();
        for (const row of rows) { await ctx.db.delete(row._id); }
    } catch(e) {}

    return "All auth tables fully wiped";
  },
});
