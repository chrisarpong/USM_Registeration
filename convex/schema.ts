import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  events: defineTable({
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
    created_at: v.optional(v.string()),
  }),

  branches: defineTable({
    name: v.string(),
    type: v.optional(v.string()),
    created_at: v.optional(v.string()),
  }),

  adminUsers: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.string(), // "superadmin", "scanner"
    created_at: v.optional(v.string()),
  }).index("by_email", ["email"]),

  attendanceLogs: defineTable({
    event_id: v.optional(v.id("events")),
    full_name: v.string(),
    phone_number: v.string(),
    email: v.optional(v.string()),
    branch: v.optional(v.string()),
    status: v.string(), // "Member", "Guest", "First Timer"
    invited_by: v.optional(v.string()),
    location: v.optional(v.string()),
    is_admin_registration: v.optional(v.boolean()),
    qr_code: v.optional(v.string()),
    checked_in: v.boolean(),
    checked_in_at: v.optional(v.string()),
    created_at: v.optional(v.string()),
  }).index("by_event", ["event_id"]),
});
