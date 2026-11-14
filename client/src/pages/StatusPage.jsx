import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Shield, RefreshCw } from 'lucide-react';
import api from '../services/api';

export const StatusPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/health');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Cannot reach API server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal">Detailed System Status</h1>
          <p className="text-sm text-charcoal-secondary mt-1">Real-time diagnostics for TeamFlow backend services.</p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-lg text-sm font-medium hover:bg-forest-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm">
          <strong>API Connection Error:</strong> {error}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-base font-heading font-bold text-charcoal mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-forest" />
          API Response Payload (/api/health)
        </h2>
        <pre className="p-4 bg-ivory rounded-lg text-xs font-mono text-charcoal overflow-x-auto border border-border">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default StatusPage;
