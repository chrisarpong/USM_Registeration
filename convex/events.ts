import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getEvents = query({
  handler: async (ctx) => {
    return await ctx.db.query("events").order("desc").collect();
  },
});

export const getActiveEvent = query({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
    return events[0] || null;
  },
});

export const getEventById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.string(),
    theme: v.string(),
    venue: v.string(),
    venue_address: v.optional(v.string()),
    map_query: v.optional(v.string()),
    description: v.optional(v.string()),
    flyer_url: v.optional(v.string()),
    is_active: v.boolean(),
    is_registration_open: v.boolean(),
  },
  handler: async (ctx, args) => {
    const newEventId = await ctx.db.insert("events", {
      ...args,
      created_at: new Date().toISOString(),
    });
    return newEventId;
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("events"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    theme: v.optional(v.string()),
    venue: v.optional(v.string()),
    venue_address: v.optional(v.string()),
    map_query: v.optional(v.string()),
    description: v.optional(v.string()),
    flyer_url: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    is_registration_open: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // If activating this event, deactivate all others
    if (updates.is_active) {
      const activeEvents = await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("is_active"), true))
        .collect();
        
      for (const event of activeEvents) {
        if (event._id !== id) {
          await ctx.db.patch(event._id, { is_active: false });
        }
      }
    }
    
    await ctx.db.patch(id, updates);
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
