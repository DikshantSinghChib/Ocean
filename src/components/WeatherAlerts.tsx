import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function WeatherAlerts() {
  const [location, setLocation] = useState({ lat: 40.7128, lon: -74.0060, radius: 100 });
  
  const alerts = useQuery(api.weather.getActiveAlerts, {
    lat: location.lat,
    lon: location.lon,
    radius: location.radius,
  });

  const fetchWeatherData = useAction(api.weather.fetchWeatherData);

  const handleRefresh = () => {
    fetchWeatherData({
      lat: location.lat,
      lon: location.lon,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 border-red-300 text-red-800";
      case "high": return "bg-orange-100 border-orange-300 text-orange-800";
      case "medium": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "low": return "bg-blue-100 border-blue-300 text-blue-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "cyclone": return "🌀";
      case "storm": return "⛈️";
      case "swell": return "🌊";
      case "current": return "💨";
      case "fog": return "🌫️";
      default: return "⚠️";
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weather Alerts</h1>
          <p className="text-gray-600">Real-time weather warnings and advisories</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Location Filter */}
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Search Area</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={location.lat}
              onChange={(e) => setLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={location.lon}
              onChange={(e) => setLocation(prev => ({ ...prev, lon: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)</label>
            <input
              type="number"
              value={location.radius}
              onChange={(e) => setLocation(prev => ({ ...prev, radius: parseInt(e.target.value) || 100 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRefresh}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts?.length === 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">🌤️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Alerts</h3>
            <p className="text-gray-600">No weather alerts in the specified area.</p>
          </div>
        ) : (
          alerts?.map((alert) => (
            <div
              key={alert._id}
              className={`rounded-2xl ring-1 ring-gray-200 p-6 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{getSeverityIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{alert.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                        alert.severity === "critical" ? "bg-red-200 text-red-800" :
                        alert.severity === "high" ? "bg-orange-200 text-orange-800" :
                        alert.severity === "medium" ? "bg-yellow-200 text-yellow-800" :
                        "bg-blue-200 text-blue-800"
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{alert.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Location:</span>
                        <div>{alert.lat.toFixed(4)}, {alert.lon.toFixed(4)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Radius:</span>
                        <div>{alert.radius} km</div>
                      </div>
                      <div>
                        <span className="font-medium">Start:</span>
                        <div>{formatTime(alert.startTime)}</div>
                      </div>
                      <div>
                        <span className="font-medium">End:</span>
                        <div>{formatTime(alert.endTime)}</div>
                      </div>
                    </div>

                    {(alert.windSpeed || alert.waveHeight || alert.visibility) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {alert.windSpeed && (
                            <div>
                              <span className="font-medium">Wind Speed:</span>
                              <div>{alert.windSpeed} knots</div>
                            </div>
                          )}
                          {alert.waveHeight && (
                            <div>
                              <span className="font-medium">Wave Height:</span>
                              <div>{alert.waveHeight} m</div>
                            </div>
                          )}
                          {alert.visibility && (
                            <div>
                              <span className="font-medium">Visibility:</span>
                              <div>{alert.visibility} km</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
