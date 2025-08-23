import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function WeatherMap() {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lon: -74.0060 });
  const [mapZoom, setMapZoom] = useState(6);

  const alerts = useQuery(api.weather.getActiveAlerts, {
    lat: mapCenter.lat,
    lon: mapCenter.lon,
    radius: 200,
  });

  const vessels = useQuery(api.vessels.getUserVessels);

  // Simple map visualization using CSS Grid
  const mapWidth = 800;
  const mapHeight = 600;
  const gridSize = 20;

  const latToY = (lat: number) => {
    const normalizedLat = (lat - (mapCenter.lat - 5)) / 10;
    return Math.max(0, Math.min(mapHeight - 20, (1 - normalizedLat) * mapHeight));
  };

  const lonToX = (lon: number) => {
    const normalizedLon = (lon - (mapCenter.lon - 7.5)) / 15;
    return Math.max(0, Math.min(mapWidth - 20, normalizedLon * mapWidth));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "#ef4444";
      case "high": return "#f97316";
      case "medium": return "#eab308";
      case "low": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weather Map</h1>
          <p className="text-gray-600">Visual representation of weather conditions and vessel positions</p>
        </div>
      </div>

      {/* Map Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Map Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Center Latitude</label>
            <input
              type="number"
              step="0.1"
              value={mapCenter.lat}
              onChange={(e) => setMapCenter(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Center Longitude</label>
            <input
              type="number"
              step="0.1"
              value={mapCenter.lon}
              onChange={(e) => setMapCenter(prev => ({ ...prev, lon: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zoom Level</label>
            <select
              value={mapZoom}
              onChange={(e) => setMapZoom(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>Ocean View</option>
              <option value={6}>Regional View</option>
              <option value={9}>Local View</option>
              <option value={12}>Detailed View</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setMapCenter({ lat: 40.7128, lon: -74.0060 })}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Weather & Vessel Map</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Vessels</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Critical Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Weather Alerts</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border" style={{ width: mapWidth, height: mapHeight }}>
          {/* Ocean Background */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                linear-gradient(45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%)
              `,
              backgroundSize: '100px 100px, 150px 150px, 20px 20px, 20px 20px'
            }}
          />

          {/* Grid Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            {Array.from({ length: Math.floor(mapWidth / gridSize) + 1 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={i * gridSize}
                y1={0}
                x2={i * gridSize}
                y2={mapHeight}
                stroke="#6b7280"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: Math.floor(mapHeight / gridSize) + 1 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * gridSize}
                x2={mapWidth}
                y2={i * gridSize}
                stroke="#6b7280"
                strokeWidth="0.5"
              />
            ))}
          </svg>

          {/* Weather Alerts */}
          {alerts?.map((alert) => {
            const x = lonToX(alert.lon);
            const y = latToY(alert.lat);
            const radius = Math.min(50, alert.radius / 2);
            
            return (
              <div
                key={alert._id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: x, top: y }}
              >
                {/* Alert Circle */}
                <div
                  className="rounded-full opacity-30"
                  style={{
                    width: radius * 2,
                    height: radius * 2,
                    backgroundColor: getSeverityColor(alert.severity),
                  }}
                />
                {/* Alert Icon */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs bg-black bg-opacity-50 rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ⚠️
                </div>
              </div>
            );
          })}

          {/* Vessels */}
          {vessels?.filter(v => v.currentLat && v.currentLon).map((vessel) => {
            const x = lonToX(vessel.currentLon!);
            const y = latToY(vessel.currentLat!);
            
            return (
              <div
                key={vessel._id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: x, top: y }}
              >
                {/* Vessel Icon */}
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs">
                  🚢
                </div>
                
                {/* Vessel Info Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <div className="font-medium">{vessel.name}</div>
                  <div>{vessel.vesselType}</div>
                  {vessel.speed && <div>{vessel.speed} knots</div>}
                </div>
              </div>
            );
          })}

          {/* Coordinate Labels */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {(mapCenter.lat + 5).toFixed(1)}°N, {(mapCenter.lon - 7.5).toFixed(1)}°W
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {(mapCenter.lat - 5).toFixed(1)}°N, {(mapCenter.lon + 7.5).toFixed(1)}°W
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Map Legend</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Weather Alerts</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Low</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Vessels</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Active Vessels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Inactive Vessels</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Alert Types</h3>
            <div className="space-y-1 text-sm">
              <div>🌀 Cyclone</div>
              <div>⛈️ Storm</div>
              <div>🌊 High Swells</div>
              <div>🌫️ Low Visibility</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Map Info</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Zoom: Level {mapZoom}</div>
              <div>Center: {mapCenter.lat.toFixed(2)}, {mapCenter.lon.toFixed(2)}</div>
              <div>Coverage: ±5° lat, ±7.5° lon</div>
              <div>Updates: Real-time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
