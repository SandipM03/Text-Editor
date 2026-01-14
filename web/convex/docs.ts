import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all documents
export const getDocs = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("docs").order("desc").collect();
    return docs;
  },
});

// Get a single document by ID
export const getDocById = query({
  args: { docId: v.id("docs") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    return doc;
  },
});

// Create a new document
export const createDoc = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const docId = await ctx.db.insert("docs", {
      title: args.title,
      content: "",
      createdAt: now,
      updatedAt: now,
    });
    return docId;
  },
});

// Update document content (for collaborative editing)
export const updateDocContent = mutation({
  args: {
    docId: v.id("docs"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.docId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

// Update document title
export const updateDocTitle = mutation({
  args: {
    docId: v.id("docs"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.docId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Delete a document
export const deleteDoc = mutation({
  args: { docId: v.id("docs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.docId);
  },
});
