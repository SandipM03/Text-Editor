import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  user: defineTable({
    id: v.string(),
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }),
  docs: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
