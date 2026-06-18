import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getLogsByEvent = query({
  args: { event_id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendanceLogs")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .order("desc")
      .collect();
  },
});

export const getAllLogs = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("attendanceLogs")
      .order("desc")
      .collect();
  },
});

export const getPaginatedLogs = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    event_id: v.optional(v.id("events")),
    branch: v.optional(v.string()),
    searchTerm: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let results;
    if (args.event_id) {
      results = await ctx.db.query("attendanceLogs")
          .withIndex("by_event", (q) => q.eq("event_id", args.event_id as any))
          .paginate(args.paginationOpts);
    } else {
      results = await ctx.db.query("attendanceLogs")
          .order("desc")
          .paginate(args.paginationOpts);
    }

    if (args.branch || args.searchTerm) {
        // Fallback filter in memory for pagination chunk if filters applied
        // In a real app we'd use a search index
        results.page = results.page.filter(log => {
            let match = true;
            if (args.branch && log.branch !== args.branch) match = false;
            if (args.searchTerm) {
                const term = args.searchTerm.toLowerCase();
                const text = `${log.full_name} ${log.phone_number} ${log.location}`.toLowerCase();
                if (!text.includes(term)) match = false;
            }
            return match;
        });
    }

    return results;
  },
});

export const getLogStats = query({
  args: { event_id: v.optional(v.id("events")) },
  handler: async (ctx, args) => {
    let all;
    if (args.event_id) {
      all = await ctx.db.query("attendanceLogs")
          .withIndex("by_event", (q) => q.eq("event_id", args.event_id as any))
          .collect();
    } else {
      all = await ctx.db.query("attendanceLogs").collect();
    }
    let members = 0, guests = 0, firstTimers = 0, checkedIn = 0;
    all.forEach(l => {
      if (l.status === 'Member') members++;
      else if (l.status === 'Guest') guests++;
      else if (l.status === 'First Timer') firstTimers++;
      if (l.checked_in) checkedIn++;
    });
    return { total: all.length, members, guests, firstTimers, checkedIn };
  }
});

export const registerAttendee = mutation({
  args: {
    event_id: v.id("events"),
    full_name: v.string(),
    phone_number: v.string(),
    email: v.optional(v.string()),
    status: v.string(),
    branch: v.optional(v.string()),
    location: v.optional(v.string()),
    invited_by: v.optional(v.string()),
    heard_from: v.optional(v.string()),
    is_admin_registration: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if already registered
    const existing = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_event", (q) => q.eq("event_id", args.event_id))
      .filter((q) => q.eq(q.field("phone_number"), args.phone_number))
      .first();

    if (existing) {
      throw new Error("This phone number is already registered for this event.");
    }

    const logId = await ctx.db.insert("attendanceLogs", {
      ...args,
      checked_in: false,
      created_at: new Date().toISOString(),
    });

    return logId;
  },
});

export const updateLog = mutation({
  args: {
    id: v.id("attendanceLogs"),
    full_name: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    branch: v.optional(v.string()),
    status: v.optional(v.string()),
    email: v.optional(v.string()),
    invited_by: v.optional(v.string()),
    heard_from: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const toggleCheckIn = mutation({
  args: { 
    id: v.id("attendanceLogs"),
    status: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      checked_in: args.status,
      checked_in_at: args.status ? new Date().toISOString() : undefined,
    });
  },
});

export const deleteLog = mutation({
  args: { id: v.id("attendanceLogs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
