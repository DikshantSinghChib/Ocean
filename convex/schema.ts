import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  vessels: defineTable({
    name: v.string(),
    imo: v.string(), // International Maritime Organization number
    mmsi: v.string(), // Maritime Mobile Service Identity
    vesselType: v.string(),
    length: v.number(),
    beam: v.number(),
    draft: v.number(),
    currentLat: v.optional(v.number()),
    currentLon: v.optional(v.number()),
    destination: v.optional(v.string()),
    destinationLat: v.optional(v.number()),
    destinationLon: v.optional(v.number()),
    speed: v.optional(v.number()), // knots
    heading: v.optional(v.number()), // degrees
    ownerId: v.id("users"),
  })
    .index("by_owner", ["ownerId"])
    .index("by_imo", ["imo"]),

  weatherAlerts: defineTable({
    alertId: v.string(),
    type: v.string(), // "cyclone", "storm", "swell", "current", "fog"
    severity: v.string(), // "low", "medium", "high", "critical"
    title: v.string(),
    description: v.string(),
    lat: v.number(),
    lon: v.number(),
    radius: v.number(), // affected area radius in km
    startTime: v.number(),
    endTime: v.number(),
    windSpeed: v.optional(v.number()),
    waveHeight: v.optional(v.number()),
    visibility: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_active", ["isActive"])
    .index("by_severity", ["severity"])
    .index("by_type", ["type"]),

  weatherForecasts: defineTable({
    lat: v.number(),
    lon: v.number(),
    timestamp: v.number(),
    forecastDay: v.number(), // 0-10 days ahead
    temperature: v.number(), // Celsius
    windSpeed: v.number(), // m/s
    windDirection: v.number(), // degrees
    waveHeight: v.number(), // meters
    wavePeriod: v.number(), // seconds
    waveDirection: v.number(), // degrees
    currentSpeed: v.number(), // m/s
    currentDirection: v.number(), // degrees
    visibility: v.number(), // km
    pressure: v.number(), // hPa
    humidity: v.number(), // percentage
    precipitation: v.number(), // mm
    weatherCondition: v.string(),
  })
    .index("by_location_and_day", ["lat", "lon", "forecastDay"])
    .index("by_timestamp", ["timestamp"]),

  speedRecommendations: defineTable({
    vesselId: v.id("vessels"),
    lat: v.number(),
    lon: v.number(),
    timestamp: v.number(),
    currentSpeed: v.number(),
    recommendedSpeed: v.number(),
    fuelSavings: v.number(), // percentage
    timeImpact: v.number(), // hours added/saved
    weatherConditions: v.object({
      windSpeed: v.number(),
      waveHeight: v.number(),
      currentSpeed: v.number(),
    }),
    reasoning: v.string(),
  })
    .index("by_vessel", ["vesselId"])
    .index("by_timestamp", ["timestamp"]),

  routeOptimizations: defineTable({
    vesselId: v.id("vessels"),
    fromLat: v.number(),
    fromLon: v.number(),
    toLat: v.number(),
    toLon: v.number(),
    originalRoute: v.array(v.object({
      lat: v.number(),
      lon: v.number(),
      eta: v.number(),
    })),
    optimizedRoute: v.array(v.object({
      lat: v.number(),
      lon: v.number(),
      eta: v.number(),
      weatherRisk: v.string(),
    })),
    fuelSavings: v.number(),
    timeSavings: v.number(),
    weatherAvoidance: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_vessel", ["vesselId"])
    .index("by_created", ["createdAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
