import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import L from "leaflet";

export function WeatherMap() {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lon: -74.0060 });
  const [latInput, setLatInput] = useState<string>("40.7128");
  const [lonInput, setLonInput] = useState<string>("-74.0060");
  const [mapZoom, setMapZoom] = useState(6);
  const [radiusKm, setRadiusKm] = useState(200);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const alertsLayerRef = useRef<L.LayerGroup | null>(null);
  const vesselsLayerRef = useRef<L.LayerGroup | null>(null);

  const alerts = useQuery(api.weather.getActiveAlerts, {
    lat: mapCenter.lat,
    lon: mapCenter.lon,
    radius: radiusKm,
  });

  const vessels = useQuery(api.vessels.getUserVessels);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "#ef4444";
      case "high": return "#f97316";
      case "medium": return "#eab308";
      case "low": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  // Helpers: parse latitude/longitude with optional N/S/E/W suffix
  const parseLatitude = (value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(?:\s*([NnSs]))?$/);
    if (!match) return null;
    let num = parseFloat(match[1]);
    const hemi = match[2]?.toUpperCase();
    if (hemi === "S") num = -Math.abs(num);
    if (hemi === "N") num = Math.abs(num);
    if (!Number.isFinite(num)) return null;
    return Math.max(-90, Math.min(90, num));
  };

  const parseLongitude = (value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(?:\s*([EeWw]))?$/);
    if (!match) return null;
    let num = parseFloat(match[1]);
    const hemi = match[2]?.toUpperCase();
    if (hemi === "W") num = -Math.abs(num);
    if (hemi === "E") num = Math.abs(num);
    if (!Number.isFinite(num)) return null;
    if (num > 180) num = 180;
    if (num < -180) num = -180;
    return num;
  };

  // Initialize map once
  useEffect(() => {
    if (mapElementRef.current && !mapInstanceRef.current) {
      const map = L.map(mapElementRef.current).setView([mapCenter.lat, mapCenter.lon], mapZoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      alertsLayerRef.current = L.layerGroup().addTo(map);
      vesselsLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Update map view on center/zoom change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lon], mapZoom);
    }
  }, [mapCenter, mapZoom]);

  // Draw center radius circle for context
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const tempLayer = L.layerGroup().addTo(map);
    const circle = L.circle([mapCenter.lat, mapCenter.lon], {
      radius: radiusKm * 1000,
      color: "#2563eb",
      dashArray: "4,4",
      fillOpacity: 0.05,
      weight: 1,
    });
    circle.addTo(tempLayer);
    return () => {
      map.removeLayer(tempLayer);
    };
  }, [mapCenter, radiusKm]);

  // Render alerts
  useEffect(() => {
    const layer = alertsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    alerts?.forEach((alert) => {
      const circle = L.circle([alert.lat, alert.lon], {
        radius: alert.radius * 1000,
        color: getSeverityColor(alert.severity),
        fillOpacity: 0.2,
        weight: 2,
      });
      circle.bindPopup(
        `<div style="font-weight:600">${alert.title}</div><div style="font-size:12px">${alert.description}</div>`
      );
      circle.addTo(layer);
    });
  }, [alerts]);

  // Render vessels
  useEffect(() => {
    const layer = vesselsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    vessels?.filter(v => v.currentLat && v.currentLon).forEach((vessel) => {
      const icon = L.divIcon({
        className: "",
        html: '<div style="width:12px;height:12px;background:#2563eb;border:2px solid white;border-radius:9999px;box-shadow:0 1px 2px rgba(0,0,0,0.3)"></div>',
      });
      const marker = L.marker([vessel.currentLat!, vessel.currentLon!], { icon });
      const popup = [
        `<div style="font-weight:600">${vessel.name}</div>`,
        `<div style="font-size:12px">${vessel.vesselType}</div>`,
        vessel.speed ? `<div style="font-size:12px">${vessel.speed} knots</div>` : "",
      ].join("");
      marker.bindPopup(popup);
      marker.addTo(layer);
    });
  }, [vessels]);

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
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Map Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Center Latitude</label>
            <input
              type="number"
              step="0.1"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              onBlur={() => {
                const parsed = parseLatitude(latInput);
                if (parsed !== null) setMapCenter(prev => ({ ...prev, lat: parsed }));
                else setLatInput(String(mapCenter.lat));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Center Longitude</label>
            <input
              type="number"
              step="0.1"
              value={lonInput}
              onChange={(e) => setLonInput(e.target.value)}
              onBlur={() => {
                const parsed = parseLongitude(lonInput);
                if (parsed !== null) setMapCenter(prev => ({ ...prev, lon: parsed }));
                else setLonInput(String(mapCenter.lon));
              }}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Radius (km)</label>
            <input
              type="number"
              step="1"
              min={1}
              value={radiusKm}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                const r = Number.isFinite(v) ? Math.max(1, Math.min(1000, v)) : 200;
                setRadiusKm(r);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setMapCenter({ lat: 40.7128, lon: -74.0060 }); setLatInput("40.7128"); setLonInput("-74.0060"); }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
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
        <div ref={mapElementRef} style={{ height: 600, width: "100%" }} />
      </div>

      {/* Legend */}
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
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
