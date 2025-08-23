import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// Get current weather alerts
export const getActiveAlerts = query({
  args: {
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
    radius: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let alerts = await ctx.db
      .query("weatherAlerts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter by location if provided
    if (args.lat && args.lon && args.radius) {
      alerts = alerts.filter(alert => {
        const distance = calculateDistance(
          args.lat!, args.lon!,
          alert.lat, alert.lon
        );
        return distance <= (args.radius! + alert.radius);
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity as keyof typeof severityOrder] - 
             severityOrder[a.severity as keyof typeof severityOrder];
    });
  },
});

// Get weather forecast for a location
export const getForecast = query({
  args: {
    lat: v.number(),
    lon: v.number(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const days = args.days || 10;
    
    const forecasts = await ctx.db
      .query("weatherForecasts")
      .withIndex("by_location_and_day", (q) => 
        q.eq("lat", Math.round(args.lat * 100) / 100)
         .eq("lon", Math.round(args.lon * 100) / 100)
      )
      .filter((q) => q.lte(q.field("forecastDay"), days))
      .collect();

    return forecasts.sort((a, b) => a.forecastDay - b.forecastDay);
  },
});

// Get speed recommendations for a vessel
export const getSpeedRecommendations = query({
  args: {
    vesselId: v.id("vessels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify vessel ownership
    const vessel = await ctx.db.get(args.vesselId);
    if (!vessel || vessel.ownerId !== userId) {
      throw new Error("Vessel not found or access denied");
    }

    const recommendations = await ctx.db
      .query("speedRecommendations")
      .withIndex("by_vessel", (q) => q.eq("vesselId", args.vesselId))
      .order("desc")
      .take(args.limit || 10);

    return recommendations;
  },
});

// Fetch weather data from external API
export const fetchWeatherData = action({
  args: {
    lat: v.number(),
    lon: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Using example data for now - user will need to set up OpenWeather API key
    const mockWeatherData = {
      current: {
        temperature: 22,
        windSpeed: 8.5,
        windDirection: 245,
        waveHeight: 2.1,
        wavePeriod: 6.5,
        waveDirection: 230,
        currentSpeed: 0.8,
        currentDirection: 180,
        visibility: 15,
        pressure: 1013,
        humidity: 75,
        precipitation: 0,
        weatherCondition: "Partly Cloudy",
      },
      forecast: Array.from({ length: 10 }, (_, day) => ({
        day: day + 1,
        temperature: 22 + Math.sin(day * 0.5) * 3,
        windSpeed: 8.5 + Math.random() * 5,
        windDirection: 245 + Math.random() * 60 - 30,
        waveHeight: 2.1 + Math.random() * 1.5,
        wavePeriod: 6.5 + Math.random() * 2,
        waveDirection: 230 + Math.random() * 40 - 20,
        currentSpeed: 0.8 + Math.random() * 0.5,
        currentDirection: 180 + Math.random() * 60 - 30,
        visibility: 15 - Math.random() * 5,
        pressure: 1013 + Math.random() * 20 - 10,
        humidity: 75 + Math.random() * 20 - 10,
        precipitation: Math.random() * 5,
        weatherCondition: ["Clear", "Partly Cloudy", "Cloudy", "Light Rain"][Math.floor(Math.random() * 4)],
      })),
      alerts: [
        {
          alertId: `alert_${Date.now()}`,
          type: "storm",
          severity: "medium",
          title: "Moderate Storm Warning",
          description: "Moderate storm conditions expected with winds up to 25 knots and wave heights of 3-4 meters.",
          lat: args.lat + 0.5,
          lon: args.lon + 0.3,
          radius: 50,
          startTime: Date.now() + 6 * 60 * 60 * 1000, // 6 hours from now
          endTime: Date.now() + 18 * 60 * 60 * 1000, // 18 hours from now
          windSpeed: 25,
          waveHeight: 3.5,
          visibility: 8,
        }
      ]
    };

    // Store forecast data
    for (const forecast of mockWeatherData.forecast) {
      await ctx.runMutation(api.weather.storeForecast, {
        lat: Math.round(args.lat * 100) / 100,
        lon: Math.round(args.lon * 100) / 100,
        timestamp: Date.now(),
        forecastDay: forecast.day,
        temperature: forecast.temperature,
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        waveHeight: forecast.waveHeight,
        wavePeriod: forecast.wavePeriod,
        waveDirection: forecast.waveDirection,
        currentSpeed: forecast.currentSpeed,
        currentDirection: forecast.currentDirection,
        visibility: forecast.visibility,
        pressure: forecast.pressure,
        humidity: forecast.humidity,
        precipitation: forecast.precipitation,
        weatherCondition: forecast.weatherCondition,
      });
    }

    // Store alerts
    for (const alert of mockWeatherData.alerts) {
      await ctx.runMutation(api.weather.storeAlert, alert);
    }

    return mockWeatherData;
  },
});

// Mutation to store forecast data
export const storeForecast = mutation({
  args: {
    lat: v.number(),
    lon: v.number(),
    timestamp: v.number(),
    forecastDay: v.number(),
    temperature: v.number(),
    windSpeed: v.number(),
    windDirection: v.number(),
    waveHeight: v.number(),
    wavePeriod: v.number(),
    waveDirection: v.number(),
    currentSpeed: v.number(),
    currentDirection: v.number(),
    visibility: v.number(),
    pressure: v.number(),
    humidity: v.number(),
    precipitation: v.number(),
    weatherCondition: v.string(),
  },
  handler: async (ctx, args) => {
    // Remove old forecast for same location and day
    const existing = await ctx.db
      .query("weatherForecasts")
      .withIndex("by_location_and_day", (q) => 
        q.eq("lat", args.lat)
         .eq("lon", args.lon)
         .eq("forecastDay", args.forecastDay)
      )
      .collect();

    for (const forecast of existing) {
      await ctx.db.delete(forecast._id);
    }

    // Insert new forecast
    return await ctx.db.insert("weatherForecasts", args);
  },
});

// Mutation to store weather alerts
export const storeAlert = mutation({
  args: {
    alertId: v.string(),
    type: v.string(),
    severity: v.string(),
    title: v.string(),
    description: v.string(),
    lat: v.number(),
    lon: v.number(),
    radius: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    windSpeed: v.optional(v.number()),
    waveHeight: v.optional(v.number()),
    visibility: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if alert already exists
    const existing = await ctx.db
      .query("weatherAlerts")
      .filter((q) => q.eq(q.field("alertId"), args.alertId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("weatherAlerts", {
      ...args,
      isActive: args.endTime > Date.now(),
    });
  },
});

// Calculate speed recommendation based on weather conditions
export const calculateSpeedRecommendation = action({
  args: {
    vesselId: v.id("vessels"),
    lat: v.number(),
    lon: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Use mock weather data for calculation
    const mockWeatherData = {
      windSpeed: 8.5 + Math.random() * 10,
      waveHeight: 2.1 + Math.random() * 2,
      currentSpeed: 0.8 + Math.random() * 0.5,
      currentDirection: 180 + Math.random() * 60 - 30,
    };

    // Calculate optimal speed based on weather conditions
    const baseSpeed = 12; // Default 12 knots
    let recommendedSpeed = baseSpeed;
    let reasoning = "Normal conditions";
    let fuelSavings = 0;
    let timeImpact = 0;

    // Adjust for wind conditions
    if (mockWeatherData.windSpeed > 15) {
      recommendedSpeed *= 0.85; // Reduce speed by 15% in high winds
      fuelSavings = 12;
      timeImpact = 2;
      reasoning = "Reduced speed due to high winds for fuel efficiency and safety";
    } else if (mockWeatherData.windSpeed < 5) {
      recommendedSpeed *= 1.1; // Increase speed by 10% in calm conditions
      fuelSavings = -5;
      timeImpact = -1;
      reasoning = "Increased speed in calm conditions";
    }

    // Adjust for wave conditions
    if (mockWeatherData.waveHeight > 3) {
      recommendedSpeed *= 0.8; // Reduce speed by 20% in high waves
      fuelSavings += 15;
      timeImpact += 3;
      reasoning += ". High waves require speed reduction";
    }

    // Adjust for current
    const currentEffect = mockWeatherData.currentSpeed * Math.cos(
      (mockWeatherData.currentDirection - 0) * Math.PI / 180
    );
    
    if (currentEffect > 0.5) {
      recommendedSpeed *= 1.05; // Slight increase with favorable current
      fuelSavings += 3;
      timeImpact -= 0.5;
    } else if (currentEffect < -0.5) {
      recommendedSpeed *= 0.95; // Slight decrease against current
      fuelSavings += 2;
      timeImpact += 0.5;
    }

    recommendedSpeed = Math.round(recommendedSpeed * 10) / 10;

    // Store recommendation
    await ctx.runMutation(api.weather.storeSpeedRecommendation, {
      vesselId: args.vesselId,
      lat: args.lat,
      lon: args.lon,
      timestamp: Date.now(),
      currentSpeed: baseSpeed,
      recommendedSpeed,
      fuelSavings: Math.round(fuelSavings),
      timeImpact: Math.round(timeImpact * 10) / 10,
      weatherConditions: {
        windSpeed: mockWeatherData.windSpeed,
        waveHeight: mockWeatherData.waveHeight,
        currentSpeed: mockWeatherData.currentSpeed,
      },
      reasoning,
    });

    return {
      currentSpeed: baseSpeed,
      recommendedSpeed,
      fuelSavings: Math.round(fuelSavings),
      timeImpact: Math.round(timeImpact * 10) / 10,
      reasoning,
      weatherConditions: {
        windSpeed: mockWeatherData.windSpeed,
        waveHeight: mockWeatherData.waveHeight,
        currentSpeed: mockWeatherData.currentSpeed,
      },
    };
  },
});

// Mutation to store speed recommendations
export const storeSpeedRecommendation = mutation({
  args: {
    vesselId: v.id("vessels"),
    lat: v.number(),
    lon: v.number(),
    timestamp: v.number(),
    currentSpeed: v.number(),
    recommendedSpeed: v.number(),
    fuelSavings: v.number(),
    timeImpact: v.number(),
    weatherConditions: v.object({
      windSpeed: v.number(),
      waveHeight: v.number(),
      currentSpeed: v.number(),
    }),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("speedRecommendations", args);
  },
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
