import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  docs: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
