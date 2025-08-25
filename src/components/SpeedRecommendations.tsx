import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function SpeedRecommendations() {
  const [selectedVessel, setSelectedVessel] = useState<Id<"vessels"> | null>(null);
  const [location, setLocation] = useState({ lat: 40.7128, lon: -74.0060 });

  const vessels = useQuery(api.vessels.getUserVessels);
  const recommendations = useQuery(
    api.weather.getSpeedRecommendations,
    selectedVessel ? { vesselId: selectedVessel } : "skip"
  );
  
  const calculateRecommendation = useAction(api.weather.calculateSpeedRecommendation);

  const handleCalculateRecommendation = async () => {
    if (!selectedVessel) return;
    
    try {
      await calculateRecommendation({
        vesselId: selectedVessel,
        lat: location.lat,
        lon: location.lon,
      });
    } catch (error) {
      console.error("Failed to calculate recommendation:", error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSavingsColor = (savings: number) => {
    if (savings > 10) return "text-green-600";
    if (savings > 0) return "text-blue-600";
    return "text-orange-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Speed Optimization</h1>
          <p className="text-gray-600">AI-powered speed recommendations for fuel efficiency and safety</p>
        </div>
      </div>

      {/* Vessel Selection */}
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Select Vessel & Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vessel</label>
            <select
              value={selectedVessel || ""}
              onChange={(e) => setSelectedVessel(e.target.value as Id<"vessels"> || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a vessel</option>
              {vessels?.map((vessel) => (
                <option key={vessel._id} value={vessel._id}>
                  {vessel.name} ({vessel.vesselType})
                </option>
              ))}
            </select>
          </div>
          
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
          
          <div className="flex items-end">
            <button
              onClick={handleCalculateRecommendation}
              disabled={!selectedVessel}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Calculate
            </button>
          </div>
        </div>
      </div>

      {/* No Vessel Selected */}
      {!selectedVessel && (
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Vessel</h3>
          <p className="text-gray-600">Choose a vessel from your fleet to get speed optimization recommendations.</p>
        </div>
      )}

      {/* Recommendations List */}
      {selectedVessel && (
        <div className="space-y-4">
          {recommendations?.length === 0 ? (
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Yet</h3>
              <p className="text-gray-600">Click "Calculate" to generate speed optimization recommendations.</p>
            </div>
          ) : (
            recommendations?.map((rec) => (
              <div key={rec._id} className="bg-white/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Speed Recommendation</h3>
                    <p className="text-sm text-gray-600">{formatTime(rec.timestamp)}</p>
                    <p className="text-sm text-gray-600">
                      Position: {rec.lat.toFixed(4)}, {rec.lon.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {rec.recommendedSpeed} kts
                    </div>
                    <div className="text-sm text-gray-600">Recommended</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold">{rec.currentSpeed} kts</div>
                    <div className="text-sm text-gray-600">Current Speed</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold">{rec.recommendedSpeed} kts</div>
                    <div className="text-sm text-gray-600">Recommended</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className={`text-lg font-semibold ${getSavingsColor(rec.fuelSavings)}`}>
                      {rec.fuelSavings > 0 ? '+' : ''}{rec.fuelSavings}%
                    </div>
                    <div className="text-sm text-gray-600">Fuel Savings</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className={`text-lg font-semibold ${rec.timeImpact > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {rec.timeImpact > 0 ? '+' : ''}{rec.timeImpact}h
                    </div>
                    <div className="text-sm text-gray-600">Time Impact</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Weather Conditions</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Wind Speed:</span>
                      <div className="font-medium">{rec.weatherConditions.windSpeed.toFixed(1)} m/s</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Wave Height:</span>
                      <div className="font-medium">{rec.weatherConditions.waveHeight.toFixed(1)} m</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Speed:</span>
                      <div className="font-medium">{rec.weatherConditions.currentSpeed.toFixed(1)} m/s</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Recommendation Reasoning</h4>
                  <p className="text-blue-800 text-sm">{rec.reasoning}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
