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

  useEffect(() => {
    // Fetch weather data on component mount
    fetchWeatherData({
      lat: weatherLocation.lat,
      lon: weatherLocation.lon,
    });
  }, [weatherLocation]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "alerts", label: "Weather Alerts", icon: "⚠️" },
    { id: "forecast", label: "10-Day Forecast", icon: "🌤️" },
    { id: "vessels", label: "Fleet Management", icon: "🚢" },
    { id: "optimization", label: "Speed Optimization", icon: "⚡" },
    { id: "map", label: "Weather Map", icon: "🗺️" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weather Summary */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold mb-4">Current Conditions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">22°C</div>
                      <div className="text-sm text-gray-600">Temperature</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">8.5 m/s</div>
                      <div className="text-sm text-gray-600">Wind Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">2.1m</div>
                      <div className="text-sm text-gray-600">Wave Height</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">15km</div>
                      <div className="text-sm text-gray-600">Visibility</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Alerts Summary */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
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
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Fleet Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{vessels?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Vessels</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {vessels?.filter(v => v.currentLat && v.currentLon).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active Tracking</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
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
