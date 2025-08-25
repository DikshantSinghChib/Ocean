import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

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

    // Fetch real data from Open-Meteo (free, no key)
    const lat = args.lat;
    const lon = args.lon;

    const dailyParams = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      daily: [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "windspeed_10m_max",
        "winddirection_10m_dominant",
        "visibility_mean",
        "pressure_msl_mean",
        "relative_humidity_2m_mean"
      ].join(","),
      timezone: "auto",
    });

    const marineParams = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      daily: [
        "wave_height_max",
        "wave_direction_dominant",
        "wave_period_max"
      ].join(","),
      timezone: "auto",
    });

    const [meteoRes, marineRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${dailyParams.toString()}`),
      fetch(`https://marine-api.open-meteo.com/v1/marine?${marineParams.toString()}`),
    ]);

    if (!meteoRes.ok) throw new Error("Failed to fetch weather forecast");
    if (!marineRes.ok) throw new Error("Failed to fetch marine forecast");

    const meteo = await meteoRes.json();
    const marine = await marineRes.json();

    const days = Math.min(
      meteo.daily.time.length,
      marine.daily.time.length,
      10
    );

    const nowTs = Date.now();

    for (let i = 0; i < days; i++) {
      const temperature = (meteo.daily.temperature_2m_max[i] + meteo.daily.temperature_2m_min[i]) / 2;
      const windSpeed = meteo.daily.windspeed_10m_max[i]; // m/s
      const windDirection = meteo.daily.winddirection_10m_dominant[i] ?? 0;
      const waveHeight = marine.daily.wave_height_max[i] ?? 0;
      const wavePeriod = marine.daily.wave_period_max[i] ?? 0;
      const waveDirection = marine.daily.wave_direction_dominant[i] ?? 0;
      const visibility = (meteo.daily.visibility_mean?.[i] ?? 15000) / 1000; // convert m to km
      const pressure = meteo.daily.pressure_msl_mean?.[i] ?? 1013;
      const humidity = meteo.daily.relative_humidity_2m_mean?.[i] ?? 70;
      const precipitation = meteo.daily.precipitation_sum?.[i] ?? 0;
      const weatherCondition = precipitation > 0.1 ? (precipitation > 10 ? "Storm" : "Rain") : (windSpeed > 12 ? "Windy" : "Clear");

      await ctx.runMutation(api.weather.storeForecast, {
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100,
        timestamp: nowTs,
        forecastDay: i,
        temperature,
        windSpeed,
        windDirection,
        waveHeight,
        wavePeriod,
        waveDirection,
        currentSpeed: 0, // not available; keep 0
        currentDirection: 0,
        visibility,
        pressure,
        humidity,
        precipitation,
        weatherCondition,
      });

      // Derive simple alerts from thresholds
      const alertCandidates: Array<{ type: string; severity: string; title: string; description: string; }> = [];
      if (windSpeed >= 20) {
        alertCandidates.push({
          type: "storm",
          severity: windSpeed >= 28 ? "critical" : "high",
          title: "High Wind Warning",
          description: `Max wind ${Math.round(windSpeed)} m/s expected. Navigation risk elevated.`,
        });
      }
      if (waveHeight >= 3) {
        alertCandidates.push({
          type: "swell",
          severity: waveHeight >= 5 ? "critical" : "high",
          title: "High Swell Advisory",
          description: `Waves up to ${waveHeight.toFixed(1)} m expected.`,
        });
      }
      if (visibility <= 5) {
        alertCandidates.push({
          type: "fog",
          severity: visibility <= 2 ? "high" : "medium",
          title: "Low Visibility",
          description: `Visibility down to ${visibility.toFixed(1)} km expected.`,
        });
      }

      for (const cand of alertCandidates) {
        await ctx.runMutation(api.weather.storeAlert, {
          alertId: `${cand.type}_${meteo.daily.time[i]}_${Math.round(lat*100)}_${Math.round(lon*100)}`,
          type: cand.type,
          severity: cand.severity,
          title: cand.title,
          description: cand.description,
          lat,
          lon,
          radius: 100,
          startTime: new Date(meteo.daily.time[i]).getTime(),
          endTime: new Date(meteo.daily.time[i]).getTime() + 24 * 60 * 60 * 1000,
          windSpeed,
          waveHeight,
          visibility,
        });
      }
    }

    return { ok: true };
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
  returns: v.object({
    currentSpeed: v.number(),
    recommendedSpeed: v.number(),
    fuelSavings: v.number(),
    timeImpact: v.number(),
    reasoning: v.string(),
    weatherConditions: v.object({
      windSpeed: v.number(),
      waveHeight: v.number(),
      currentSpeed: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Load real forecast (day 0) for provided location; fetch if missing
    const roundedLat = Math.round(args.lat * 100) / 100;
    const roundedLon = Math.round(args.lon * 100) / 100;

    let forecast: Array<Doc<"weatherForecasts">> = await ctx.runQuery(api.weather.getForecast, {
      lat: roundedLat,
      lon: roundedLon,
      days: 1,
    });

    if (!forecast || forecast.length === 0) {
      await ctx.runAction(api.weather.fetchWeatherData, { lat: roundedLat, lon: roundedLon });
      forecast = await ctx.runQuery(api.weather.getForecast, {
        lat: roundedLat,
        lon: roundedLon,
        days: 1,
      });
    }

    const today: Doc<"weatherForecasts"> | undefined = forecast && forecast[0];
    if (!today) {
      throw new Error("No forecast available for this location");
    }

    const weatherData: { windSpeed: number; waveHeight: number; currentSpeed: number; currentDirection: number } = {
      windSpeed: today.windSpeed,
      waveHeight: today.waveHeight,
      currentSpeed: today.currentSpeed,
      currentDirection: today.currentDirection,
    };

    // Calculate optimal speed based on weather conditions
    const baseSpeed = 12; // Default 12 knots
    let recommendedSpeed = baseSpeed;
    let reasoning = "Normal conditions";
    let fuelSavings = 0;
    let timeImpact = 0;

    // Adjust for wind conditions
    if (weatherData.windSpeed > 15) {
      recommendedSpeed *= 0.85; // Reduce speed by 15% in high winds
      fuelSavings = 12;
      timeImpact = 2;
      reasoning = "Reduced speed due to high winds for fuel efficiency and safety";
    } else if (weatherData.windSpeed < 5) {
      recommendedSpeed *= 1.1; // Increase speed by 10% in calm conditions
      fuelSavings = -5;
      timeImpact = -1;
      reasoning = "Increased speed in calm conditions";
    }

    // Adjust for wave conditions
    if (weatherData.waveHeight > 3) {
      recommendedSpeed *= 0.8; // Reduce speed by 20% in high waves
      fuelSavings += 15;
      timeImpact += 3;
      reasoning += ". High waves require speed reduction";
    }

    // Adjust for current
    const currentEffect = weatherData.currentSpeed * Math.cos(
      (weatherData.currentDirection - 0) * Math.PI / 180
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

    // Check if we already have a recent recommendation for this vessel and location
    const existingRecommendation = await ctx.runQuery(api.weather.getSpeedRecommendations, {
      vesselId: args.vesselId,
      limit: 1,
    });
    
    // If we have a recent recommendation (within last hour), update it instead of creating new
    if (existingRecommendation && existingRecommendation.length > 0) {
      const lastRec = existingRecommendation[0];
      const timeDiff = Date.now() - lastRec.timestamp;
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (timeDiff < oneHour && 
          Math.abs(lastRec.lat - roundedLat) < 0.01 && 
          Math.abs(lastRec.lon - roundedLon) < 0.01) {
        // Update existing recommendation instead of creating new one
        await ctx.runMutation(api.weather.updateSpeedRecommendation, {
          recommendationId: lastRec._id,
          recommendedSpeed,
          fuelSavings: Math.round(fuelSavings),
          timeImpact: Math.round(timeImpact * 10) / 10,
          weatherConditions: {
            windSpeed: weatherData.windSpeed,
            waveHeight: weatherData.waveHeight,
            currentSpeed: weatherData.currentSpeed,
          },
          reasoning,
          timestamp: Date.now(),
        });
        return {
          currentSpeed: baseSpeed,
          recommendedSpeed,
          fuelSavings: Math.round(fuelSavings),
          timeImpact: Math.round(timeImpact * 10) / 10,
          reasoning,
          weatherConditions: {
            windSpeed: weatherData.windSpeed,
            waveHeight: weatherData.waveHeight,
            currentSpeed: weatherData.currentSpeed,
          },
        };
      }
    }

    // Store recommendation
    await ctx.runMutation(api.weather.storeSpeedRecommendation, {
      vesselId: args.vesselId,
      lat: roundedLat,
      lon: roundedLon,
      timestamp: Date.now(),
      currentSpeed: baseSpeed,
      recommendedSpeed,
      fuelSavings: Math.round(fuelSavings),
      timeImpact: Math.round(timeImpact * 10) / 10,
      weatherConditions: {
        windSpeed: weatherData.windSpeed,
        waveHeight: weatherData.waveHeight,
        currentSpeed: weatherData.currentSpeed,
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
        windSpeed: weatherData.windSpeed,
        waveHeight: weatherData.waveHeight,
        currentSpeed: weatherData.currentSpeed,
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

// Mutation to update existing speed recommendations
export const updateSpeedRecommendation = mutation({
  args: {
    recommendationId: v.id("speedRecommendations"),
    recommendedSpeed: v.number(),
    fuelSavings: v.number(),
    timeImpact: v.number(),
    weatherConditions: v.object({
      windSpeed: v.number(),
      waveHeight: v.number(),
      currentSpeed: v.number(),
    }),
    reasoning: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.recommendationId, {
      recommendedSpeed: args.recommendedSpeed,
      fuelSavings: args.fuelSavings,
      timeImpact: args.timeImpact,
      weatherConditions: args.weatherConditions,
      reasoning: args.reasoning,
      timestamp: args.timestamp,
    });
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
