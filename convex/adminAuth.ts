import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    // Use an environment variable for the admin password, falling back to the hardcoded one 
    // ONLY as a temporary measure until the env var is set in the Convex dashboard.
    const adminPassword = process.env.ADMIN_PASSWORD || '12345admin';
    if (args.email.toLowerCase() === 'nadia@usm.com' && args.password === adminPassword) {
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
