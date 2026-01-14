import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Simple hash function (for demo - use bcrypt in production)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16) + str.length.toString(16);
}

// Generate a random token/code
function generateToken(): string {
  return Math.random().toString(36).substring(2) + 
         Math.random().toString(36).substring(2) + 
         Date.now().toString(36);
}

function generateOrgCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new organization and sign up the admin user
export const signUpWithOrg = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    orgName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("Email already registered");
    }

    // Create organization
    const orgId = await ctx.db.insert("orgs", {
      name: args.orgName,
      code: generateOrgCode(),
      createdAt: Date.now(),
    });

    // Create user as admin of the org
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: simpleHash(args.password),
      orgId,
      role: "admin",
      createdAt: Date.now(),
    });

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { userId, token, orgId };
  },
});

// Join an existing organization
export const signUpJoinOrg = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    orgCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("Email already registered");
    }

    // Find organization by code
    const org = await ctx.db
      .query("orgs")
      .withIndex("by_code", (q) => q.eq("code", args.orgCode.toUpperCase()))
      .first();

    if (!org) {
      throw new Error("Invalid organization code");
    }

    // Create user as member of the org
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: simpleHash(args.password),
      orgId: org._id,
      role: "member",
      createdAt: Date.now(),
    });

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { userId, token, orgId: org._id };
  },
});

// Sign in an existing user
export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.passwordHash !== simpleHash(args.password)) {
      throw new Error("Invalid email or password");
    }

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { userId: user._id, token, name: user.name, orgId: user.orgId };
  },
});

// Sign out
export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// Get current user from token
export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const org = await ctx.db.get(user.orgId);

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      orgName: org?.name,
      orgCode: org?.code,
      role: user.role,
    };
  },
});

// Get org members
export const getOrgMembers = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return [];

    const members = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId))
      .collect();

    return members.map((m) => ({
      _id: m._id,
      name: m.name,
      email: m.email,
      role: m.role,
    }));
  },
});
