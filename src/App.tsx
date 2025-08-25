import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { WeatherDashboard } from "./components/WeatherDashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md h-16 flex justify-between items-center border-b px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow">
            <span className="text-white font-bold text-base">⚓</span>
          </div>
          <div className="flex flex-col leading-tight">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Oceanova</h2>
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Weather Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
        <Authenticated>
          <SignOutButton />
        </Authenticated>
        </div>
      </header>
      <main className="flex-1 relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),rgba(255,255,255,0)_60%)]" />
        <Content />
      </main>
      <footer className="border-t bg-white/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-gray-800 font-semibold">Oceanova</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <a className="hover:text-gray-800" href="#">Docs</a>
            <a className="hover:text-gray-800" href="#">Support</a>
            <a className="hover:text-gray-800" href="#">Status</a>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200 border-t-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Authenticated>
        <div className="max-w-7xl mx-auto w-full px-4 py-6">
        <WeatherDashboard />
        </div>
      </Authenticated>
      
      <Unauthenticated>
        <section className="relative">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium ring-1 ring-blue-100 mb-4">
                  <span className="text-base">🌊</span>
                  <span>Purpose-built for maritime operations</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  Smarter maritime routes with real-time weather intelligence
              </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Forecasts, alerts, and speed optimization to reduce fuel costs and keep crews safe.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="bg-white/80 backdrop-blur rounded-xl shadow-sm ring-1 ring-gray-200 p-4 w-full sm:w-auto">
                    <SignInForm />
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><span>✅</span><span>10-day localized forecasts</span></div>
                  <div className="flex items-center gap-2"><span>✅</span><span>Storm and swell alerts</span></div>
                  <div className="flex items-center gap-2"><span>✅</span><span>Fuel-saving recommendations</span></div>
                  <div className="flex items-center gap-2"><span>✅</span><span>Modern, responsive UI</span></div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-200/40 to-indigo-200/40 blur-2xl rounded-3xl" aria-hidden />
                <div className="relative bg-white/80 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-200 p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                      <div className="text-2xl mb-2">📡</div>
                  <div className="font-semibold">Weather Alerts</div>
                  <div className="text-gray-600">Real-time storm warnings</div>
                </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">10-Day Forecasts</div>
                  <div className="text-gray-600">Predictive conditions</div>
                </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold">Speed Optimization</div>
                  <div className="text-gray-600">Fuel & time savings</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Unauthenticated>
    </div>
  );
}
