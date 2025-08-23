import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function VesselManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<Id<"vessels"> | null>(null);

  const vessels = useQuery(api.vessels.getUserVessels);
  const createVessel = useMutation(api.vessels.createVessel);
  const updatePosition = useMutation(api.vessels.updateVesselPosition);

  const [newVessel, setNewVessel] = useState({
    name: "",
    imo: "",
    mmsi: "",
    vesselType: "Container Ship",
    length: 0,
    beam: 0,
    draft: 0,
    currentLat: 0,
    currentLon: 0,
    speed: 12,
    heading: 0,
  });

  const handleCreateVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVessel(newVessel);
      setNewVessel({
        name: "",
        imo: "",
        mmsi: "",
        vesselType: "Container Ship",
        length: 0,
        beam: 0,
        draft: 0,
        currentLat: 0,
        currentLon: 0,
        speed: 12,
        heading: 0,
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to create vessel:", error);
    }
  };

  const vesselTypes = [
    "Container Ship",
    "Bulk Carrier",
    "Tanker",
    "General Cargo",
    "Passenger Ship",
    "Fishing Vessel",
    "Offshore Vessel",
    "Tug",
    "Other"
  ];

  const getVesselIcon = (type: string) => {
    switch (type) {
      case "Container Ship": return "🚢";
      case "Bulk Carrier": return "🚛";
      case "Tanker": return "🛢️";
      case "Passenger Ship": return "🛳️";
      case "Fishing Vessel": return "🎣";
      case "Offshore Vessel": return "🏗️";
      case "Tug": return "🚤";
      default: return "⛵";
    }
  };

  const getStatusColor = (vessel: any) => {
    if (!vessel.currentLat || !vessel.currentLon) return "bg-gray-100 text-gray-800";
    if (vessel.speed && vessel.speed > 0) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (vessel: any) => {
    if (!vessel.currentLat || !vessel.currentLon) return "No Position";
    if (vessel.speed && vessel.speed > 0) return "Underway";
    return "At Anchor";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600">Manage your vessel fleet and track positions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Vessel
        </button>
      </div>

      {/* Add Vessel Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add New Vessel</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleCreateVessel} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Name</label>
                <input
                  type="text"
                  required
                  value={newVessel.name}
                  onChange={(e) => setNewVessel(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Type</label>
                <select
                  value={newVessel.vesselType}
                  onChange={(e) => setNewVessel(prev => ({ ...prev, vesselType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vesselTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IMO Number</label>
                <input
                  type="text"
                  required
                  value={newVessel.imo}
                  onChange={(e) => setNewVessel(prev => ({ ...prev, imo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MMSI</label>
                <input
                  type="text"
                  required
                  value={newVessel.mmsi}
                  onChange={(e) => setNewVessel(prev => ({ ...prev, mmsi: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                <input
                  type="number"
                  required
                  value={newVessel.length}
                  onChange={(e) => setNewVessel(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beam (m)</label>
                <input
                  type="number"
                  required
                  value={newVessel.beam}
                  onChange={(e) => setNewVessel(prev => ({ ...prev, beam: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newVessel.currentLat}
                  onChange={(e) => setNewVessel(prev => ({ ...prev, currentLat: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newVessel.currentLon}
                  onChange={(e) => setNewVessel(prev => ({ ...prev, currentLon: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Vessel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vessels List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {vessels?.map((vessel) => (
          <div key={vessel._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getVesselIcon(vessel.vesselType)}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{vessel.name}</h3>
                  <p className="text-sm text-gray-600">{vessel.vesselType}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vessel)}`}>
                {getStatusText(vessel)}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">IMO:</span>
                  <div className="font-medium">{vessel.imo}</div>
                </div>
                <div>
                  <span className="text-gray-600">MMSI:</span>
                  <div className="font-medium">{vessel.mmsi}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Length:</span>
                  <div className="font-medium">{vessel.length}m</div>
                </div>
                <div>
                  <span className="text-gray-600">Beam:</span>
                  <div className="font-medium">{vessel.beam}m</div>
                </div>
                <div>
                  <span className="text-gray-600">Draft:</span>
                  <div className="font-medium">{vessel.draft}m</div>
                </div>
              </div>

              {vessel.currentLat && vessel.currentLon && (
                <div>
                  <span className="text-gray-600">Position:</span>
                  <div className="font-medium">
                    {vessel.currentLat.toFixed(4)}, {vessel.currentLon.toFixed(4)}
                  </div>
                </div>
              )}

              {vessel.speed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Speed:</span>
                    <div className="font-medium">{vessel.speed} knots</div>
                  </div>
                  {vessel.heading && (
                    <div>
                      <span className="text-gray-600">Heading:</span>
                      <div className="font-medium">{vessel.heading}°</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedVessel(vessel._id)}
                className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        )) || (
          <div className="col-span-full bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-4xl mb-4">🚢</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vessels Added</h3>
            <p className="text-gray-600 mb-4">Add your first vessel to start tracking weather conditions.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Vessel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
