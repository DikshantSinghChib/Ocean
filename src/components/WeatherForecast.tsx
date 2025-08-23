import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function WeatherForecast() {
  const [location, setLocation] = useState({ lat: 40.7128, lon: -74.0060 });
  
  const forecast = useQuery(api.weather.getForecast, {
    lat: location.lat,
    lon: location.lon,
    days: 10,
  });

  const fetchWeatherData = useAction(api.weather.fetchWeatherData);

  const handleRefresh = () => {
    fetchWeatherData({
      lat: location.lat,
      lon: location.lon,
    });
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear": return "☀️";
      case "partly cloudy": return "⛅";
      case "cloudy": return "☁️";
      case "light rain": return "🌦️";
      case "rain": return "🌧️";
      case "storm": return "⛈️";
      default: return "🌤️";
    }
  };

  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const formatDate = (dayOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString('en-US', { 
      weekday: dayOffset === 0 ? undefined : 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">10-Day Weather Forecast</h1>
          <p className="text-gray-600">Extended maritime weather predictions</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Location Input */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Forecast Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={handleRefresh}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Update Forecast
            </button>
          </div>
        </div>
      </div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {forecast?.map((day) => (
          <div key={day._id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-center mb-4">
              <div className="text-sm font-medium text-gray-600 mb-1">
                {day.forecastDay === 0 ? "Today" : formatDate(day.forecastDay)}
              </div>
              <div className="text-3xl mb-2">{getWeatherIcon(day.weatherCondition)}</div>
              <div className="text-lg font-semibold">{Math.round(day.temperature)}°C</div>
              <div className="text-sm text-gray-600">{day.weatherCondition}</div>
            </div>

            <div className="space-y-3 text-sm">
              {/* Wind */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Wind:</span>
                <span className="font-medium">
                  {Math.round(day.windSpeed)} m/s {getWindDirection(day.windDirection)}
                </span>
              </div>

              {/* Waves */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Waves:</span>
                <span className="font-medium">
                  {day.waveHeight.toFixed(1)}m / {day.wavePeriod.toFixed(1)}s
                </span>
              </div>

              {/* Current */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current:</span>
                <span className="font-medium">
                  {day.currentSpeed.toFixed(1)} m/s {getWindDirection(day.currentDirection)}
                </span>
              </div>

              {/* Visibility */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Visibility:</span>
                <span className="font-medium">{Math.round(day.visibility)} km</span>
              </div>

              {/* Pressure */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pressure:</span>
                <span className="font-medium">{Math.round(day.pressure)} hPa</span>
              </div>

              {/* Precipitation */}
              {day.precipitation > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rain:</span>
                  <span className="font-medium">{day.precipitation.toFixed(1)} mm</span>
                </div>
              )}
            </div>

            {/* Risk Assessment */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Conditions:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  day.windSpeed > 15 || day.waveHeight > 3 ? 
                    "bg-red-100 text-red-800" :
                  day.windSpeed > 10 || day.waveHeight > 2 ?
                    "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                }`}>
                  {day.windSpeed > 15 || day.waveHeight > 3 ? "Rough" :
                   day.windSpeed > 10 || day.waveHeight > 2 ? "Moderate" : "Calm"}
                </span>
              </div>
            </div>
          </div>
        )) || (
          <div className="col-span-full bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-4xl mb-4">🌤️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Forecast Data</h3>
            <p className="text-gray-600">Click "Refresh Data" to load weather forecast.</p>
          </div>
        )}
      </div>

      {/* Detailed Analysis */}
      {forecast && forecast.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">10-Day Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Wind Conditions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Average Speed:</span>
                  <span>{(forecast.reduce((sum, day) => sum + day.windSpeed, 0) / forecast.length).toFixed(1)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Speed:</span>
                  <span>{Math.max(...forecast.map(day => day.windSpeed)).toFixed(1)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Rough Days:</span>
                  <span>{forecast.filter(day => day.windSpeed > 15).length}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Wave Conditions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Average Height:</span>
                  <span>{(forecast.reduce((sum, day) => sum + day.waveHeight, 0) / forecast.length).toFixed(1)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Height:</span>
                  <span>{Math.max(...forecast.map(day => day.waveHeight)).toFixed(1)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>High Wave Days:</span>
                  <span>{forecast.filter(day => day.waveHeight > 3).length}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Weather Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Clear Days:</span>
                  <span>{forecast.filter(day => day.weatherCondition === "Clear").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rainy Days:</span>
                  <span>{forecast.filter(day => day.precipitation > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Low Visibility:</span>
                  <span>{forecast.filter(day => day.visibility < 10).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
