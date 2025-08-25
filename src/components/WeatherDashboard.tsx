import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { WeatherAlerts } from "./WeatherAlerts";
import { WeatherForecast } from "./WeatherForecast";
import { VesselManager } from "./VesselManager";
import { SpeedRecommendations } from "./SpeedRecommendations";
import { WeatherMap } from "./WeatherMap";

export function WeatherDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [weatherLocation, setWeatherLocation] = useState({ lat: 40.7128, lon: -74.0060 }); // Default to NY Harbor
  const [address, setAddress] = useState<string>("");

  const vessels = useQuery(api.vessels.getUserVessels);
  const alerts = useQuery(api.weather.getActiveAlerts, {
    lat: weatherLocation.lat,
    lon: weatherLocation.lon,
    radius: 100,
  });
  const forecast = useQuery(api.weather.getForecast, {
    lat: weatherLocation.lat,
    lon: weatherLocation.lon,
    days: 10,
  });

  const fetchWeatherData = useAction(api.weather.fetchWeatherData);

  // Try to use user's current location on first load
  useEffect(() => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWeatherLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          // ignore errors; fallback to default location
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Reverse geocode current location to a human-readable address
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const url = new URL("https://nominatim.openstreetmap.org/reverse");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("lat", String(weatherLocation.lat));
        url.searchParams.set("lon", String(weatherLocation.lon));
        const res = await fetch(url.toString(), {
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setAddress(data.display_name || "");
      } catch (_) {
        if (!cancelled) setAddress("");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [weatherLocation.lat, weatherLocation.lon]);

  useEffect(() => {
    // Fetch weather data on component mount
    fetchWeatherData({
      lat: weatherLocation.lat,
      lon: weatherLocation.lon,
    });
  }, [weatherLocation]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "alerts", label: "Alerts", icon: "⚠️" },
    { id: "forecast", label: "Forecast", icon: "🌤️" },
    { id: "vessels", label: "Fleet", icon: "🚢" },
    { id: "optimization", label: "Speed", icon: "⚡" },
    { id: "map", label: "Map", icon: "🗺️" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header + Segmented Tabs */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Maritime Weather Console</h1>
              <p className="text-gray-600">Forecasts, alerts, fleet and optimization in one place</p>
            </div>
            <nav className="bg-white/80 backdrop-blur rounded-xl ring-1 ring-gray-200 p-1 flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weather Summary */}
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Current Conditions</h2>
                  {/* Current location details */}
                  <div className="mb-4 text-sm text-gray-700">
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <span className="font-medium">Latitude:</span> {weatherLocation.lat.toFixed(5)}
                      </div>
                      <div>
                        <span className="font-medium">Longitude:</span> {weatherLocation.lon.toFixed(5)}
                      </div>
                    </div>
                    {address && (
                      <div className="mt-1 text-gray-600 truncate" title={address}>
                        <span className="font-medium text-gray-700">Address:</span> {address}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-xl bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">{forecast && forecast[0] ? Math.round(forecast[0].temperature) : "-"}°C</div>
                      <div className="text-sm text-gray-600">Temperature</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-emerald-50">
                      <div className="text-2xl font-bold text-green-600">{forecast && forecast[0] ? Math.round(forecast[0].windSpeed) : "-"} m/s</div>
                      <div className="text-sm text-gray-600">Wind Speed</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-indigo-50">
                      <div className="text-2xl font-bold text-purple-600">{forecast && forecast[0] ? forecast[0].waveHeight.toFixed(1) : "-"}m</div>
                      <div className="text-sm text-gray-600">Wave Height</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-amber-50">
                      <div className="text-2xl font-bold text-orange-600">{forecast && forecast[0] ? Math.round(forecast[0].visibility) : "-"}km</div>
                      <div className="text-sm text-gray-600">Visibility</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Alerts Summary */}
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>
                <div className="space-y-3">
                  {alerts?.slice(0, 3).map((alert) => (
                    <div key={alert._id} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        alert.severity === "critical" ? "bg-red-500" :
                        alert.severity === "high" ? "bg-orange-500" :
                        alert.severity === "medium" ? "bg-yellow-500" : "bg-blue-500"
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{alert.title}</div>
                        <div className="text-xs text-gray-600">{alert.type}</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-gray-500 text-sm">No active alerts</div>
                  )}
                </div>
              </div>
            </div>

            {/* Fleet Status */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Fleet Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{vessels?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Vessels</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">
                    {vessels?.filter(v => v.currentLat && v.currentLon).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active Tracking</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">
                    {alerts?.filter(a => a.severity === "high" || a.severity === "critical").length || 0}
                  </div>
                  <div className="text-sm text-gray-600">High Risk Areas</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "alerts" && <WeatherAlerts />}
        {activeTab === "forecast" && <WeatherForecast />}
        {activeTab === "vessels" && <VesselManager />}
        {activeTab === "optimization" && <SpeedRecommendations />}
        {activeTab === "map" && <WeatherMap />}
      </div>
    </div>
  );
}
