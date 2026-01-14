import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper to get user from token
async function getUserFromToken(ctx: any, token: string | undefined) {
  if (!token) return null;
  
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return await ctx.db.get(session.userId);
}

// Get all documents for the organization (shared among all org members)
export const getDocs = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];
    
    const docs = await ctx.db
      .query("docs")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId))
      .order("desc")
      .collect();
    
    // Get creator names for each doc
    const docsWithCreators = await Promise.all(
      docs.map(async (doc) => {
        const creator = await ctx.db.get(doc.createdBy);
        const lastEditor = doc.lastEditedBy ? await ctx.db.get(doc.lastEditedBy) : null;
        return {
          ...doc,
          creatorName: creator?.name || "Unknown",
          lastEditorName: lastEditor?.name || null,
        };
      })
    );
    
    return docsWithCreators;
  },
});

// Get a single document by ID (org members can access)
export const getDocById = query({
  args: { docId: v.id("docs"), token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;
    
    const doc = await ctx.db.get(args.docId);
    // Allow access if doc belongs to user's org
    if (!doc || doc.orgId !== user.orgId) return null;
    
    const creator = await ctx.db.get(doc.createdBy);
    const lastEditor = doc.lastEditedBy ? await ctx.db.get(doc.lastEditedBy) : null;
    
    return {
      ...doc,
      creatorName: creator?.name || "Unknown",
      lastEditorName: lastEditor?.name || null,
    };
  },
});

// Create a new document
export const createDoc = mutation({
  args: { title: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");
    
    const now = Date.now();
    const docId = await ctx.db.insert("docs", {
      title: args.title,
      content: "",
      orgId: user.orgId,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
      lastEditedBy: user._id,
    });
    
    // Note: The prosemirror document will be created by the client
    // via sync.create() when the editor first loads
    
    return docId;
  },
});

// Update document content (for collaborative editing - any org member can edit)
export const updateDocContent = mutation({
  args: {
    docId: v.id("docs"),
    content: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");
    
    const doc = await ctx.db.get(args.docId);
    // Allow edit if doc belongs to user's org
    if (!doc || doc.orgId !== user.orgId) throw new Error("Unauthorized");
    
    await ctx.db.patch(args.docId, {
      content: args.content,
      updatedAt: Date.now(),
      lastEditedBy: user._id,
    });
  },
});

// Update document title (any org member can edit)
export const updateDocTitle = mutation({
  args: {
    docId: v.id("docs"),
    title: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");
    
    const doc = await ctx.db.get(args.docId);
    if (!doc || doc.orgId !== user.orgId) throw new Error("Unauthorized");
    
    await ctx.db.patch(args.docId, {
      title: args.title,
      updatedAt: Date.now(),
      lastEditedBy: user._id,
    });
  },
});

// Delete a document (only creator or admin can delete)
export const deleteDoc = mutation({
  args: { docId: v.id("docs"), token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");
    
    const doc = await ctx.db.get(args.docId);
    if (!doc || doc.orgId !== user.orgId) throw new Error("Unauthorized");
    
    // Only creator or admin can delete
    if (doc.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Only the creator or admin can delete this document");
    }
    
    await ctx.db.delete(args.docId);
  },
});
