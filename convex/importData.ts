import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const importAll = mutation({
  args: {
    events: v.any(),
    branches: v.any(),
    attendanceLogs: v.any(),
  },
  handler: async (ctx, args) => {
    const eventIdMap = new Map<string, string>();
    
    const removeNulls = (obj: any) => {
      const cleaned = { ...obj };
      Object.keys(cleaned).forEach(key => cleaned[key] === null && delete cleaned[key]);
      return cleaned;
    };

    // 1. Insert Events
    for (const event of args.events) {
      const { id, ...eventData } = event;
      const newEventId = await ctx.db.insert("events", removeNulls(eventData));
      eventIdMap.set(id, newEventId);
    }

    // 2. Insert Branches
    for (const branch of args.branches) {
      const { id, ...branchData } = branch;
      await ctx.db.insert("branches", removeNulls(branchData));
    }

    // 3. Insert Attendance Logs
    for (const log of args.attendanceLogs) {
      const { id, event_id, ...logData } = log;
      
      const convexEventId = event_id ? eventIdMap.get(event_id) : undefined;
      
      await ctx.db.insert("attendanceLogs", removeNulls({
        ...logData,
        ...(convexEventId ? { event_id: convexEventId } : {}),
      }));
    }

    return { success: true, message: `Imported ${args.events.length} events, ${args.branches.length} branches, and ${args.attendanceLogs.length} logs.` };
  },
});
