import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

//user creation
export const createUser = mutation({
  args: { name: v.string(), email: v.string() },
    handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.db.insert("user", {
        name: args.name,
        email: args.email,
        createdAt: now,
    });
    return userId;
  }
});
//get user by email
export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
    const user = await ctx.db.query("user").withIndex("byEmail", (q) =>
        q.eq("email", args.email)
    ).first();
    return user;
  }
});
