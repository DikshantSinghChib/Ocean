import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { WeatherDashboard } from "./components/WeatherDashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">⚓</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Oceanova Weather Engine</h2>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Authenticated>
        <WeatherDashboard />
      </Authenticated>
      
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[600px] p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Maritime Weather Intelligence
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Real-time weather alerts, forecasts, and speed optimization for maritime operations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">🌊</div>
                  <div className="font-semibold">Weather Alerts</div>
                  <div className="text-gray-600">Real-time storm warnings</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">10-Day Forecasts</div>
                  <div className="text-gray-600">Predictive conditions</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold">Speed Optimization</div>
                  <div className="text-gray-600">Fuel & time savings</div>
                </div>
              </div>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
