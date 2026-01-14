import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations
  orgs: defineTable({
    name: v.string(),
    code: v.string(), // Invite code to join org
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // Users belong to an organization
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    orgId: v.id("orgs"),
    role: v.string(), // "admin" | "member"
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_org", ["orgId"]),

  // Sessions for authentication
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // Documents belong to an organization (shared among all org members)
  docs: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    orgId: v.id("orgs"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastEditedBy: v.optional(v.id("users")),
  }).index("by_org", ["orgId"]),
});
