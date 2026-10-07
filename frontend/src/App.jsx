import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './services/api';
import { APP_NAME, APP_TAGLINE } from './utils/constants';

function HealthCheck() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        setError(err.message || 'Failed to reach the API');
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg">Checking API health...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">API Health Check</h2>
        {health ? (
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
              {health.data?.status || 'ok'}
            </span>
            <p className="text-gray-600 text-sm">{health.data?.message}</p>
            <p className="text-gray-400 text-xs font-mono">{health.data?.timestamp}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
              unreachable
            </span>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F9FF]">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#0B1C30]">
          {APP_NAME}
        </h1>
        <p className="text-lg text-[#45464D]">{APP_TAGLINE}</p>
        <p className="text-sm text-gray-400 mt-6">Phase 1 — Project Scaffold</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-300">404</h1>
        <p className="mt-2 text-gray-500">Page not found</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/health" element={<HealthCheck />} />

      {/* TODO: Add public, company, committee, admin, and shared routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
