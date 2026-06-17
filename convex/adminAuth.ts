import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    // For fast implementation of the exact request without Auth setup blockers
    if (args.email.toLowerCase() === 'nadia@usm.com' && args.password === '12345admin') {
      return { success: true, role: 'superadmin', name: 'Nadia', token: 'superadmin_token_xyz' };
    }
    // Add logic for scanners if we create an adminUsers table
    const user = await ctx.db.query("adminUsers").filter(q => q.eq(q.field("email"), args.email)).first();
    if (user && user.password === args.password) {
      return { success: true, role: user.role, name: user.name, token: `token_${user._id}` };
    }
    
    return { success: false, error: "Invalid credentials" };
  },
});
