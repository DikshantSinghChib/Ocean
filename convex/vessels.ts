import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all vessels for the current user
export const getUserVessels = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("vessels")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
  },
});

// Get a specific vessel
export const getVessel = query({
  args: { vesselId: v.id("vessels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const vessel = await ctx.db.get(args.vesselId);
    if (!vessel || vessel.ownerId !== userId) {
      throw new Error("Vessel not found or access denied");
    }

    return vessel;
  },
});

// Create a new vessel
export const createVessel = mutation({
  args: {
    name: v.string(),
    imo: v.string(),
    mmsi: v.string(),
    vesselType: v.string(),
    length: v.number(),
    beam: v.number(),
    draft: v.number(),
    currentLat: v.optional(v.number()),
    currentLon: v.optional(v.number()),
    destination: v.optional(v.string()),
    destinationLat: v.optional(v.number()),
    destinationLon: v.optional(v.number()),
    speed: v.optional(v.number()),
    heading: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("vessels", {
      ...args,
      ownerId: userId,
    });
  },
});

// Update vessel position and status
export const updateVesselPosition = mutation({
  args: {
    vesselId: v.id("vessels"),
    currentLat: v.number(),
    currentLon: v.number(),
    speed: v.optional(v.number()),
    heading: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const vessel = await ctx.db.get(args.vesselId);
    if (!vessel || vessel.ownerId !== userId) {
      throw new Error("Vessel not found or access denied");
    }

    await ctx.db.patch(args.vesselId, {
      currentLat: args.currentLat,
      currentLon: args.currentLon,
      speed: args.speed,
      heading: args.heading,
    });

    return await ctx.db.get(args.vesselId);
  },
});
