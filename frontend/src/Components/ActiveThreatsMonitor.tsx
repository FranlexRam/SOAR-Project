import React, { useState, useEffect } from 'react';

interface ThreatItem {
  type: string;
  detected: string;
  sourceIp: string;
  soarAction: string;
  riskLevel: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  status: 'Contained' | 'In Analysis' | 'Resolved';
  incidentId: string;
  attackVector: string;
  impact: 'Low' | 'Medium' | 'High';
}

export default function ActiveThreatsMonitor() {
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveThreats = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/threats/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al conectar con el servidor backend.');
      }
      const data = await response.json();
      setThreats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las amenazas activas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveThreats();
    const interval = setInterval(fetchActiveThreats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveThreat = async (incidentId: string) => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`http://localhost:8000/api/threats/${incidentId}/contain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setThreats((prev) =>
          prev.map((t) => (t.incidentId === incidentId ? { ...t, status: 'Contained' as const, soarAction: 'Manual Resolve' } : t))
        );
      }
    } catch (err) {
      console.error('Error al ejecutar la acción SOAR:', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-white text-sm font-semibold tracking-wide uppercase">Active Threats Monitor (Backend Connected)</h3>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
            ● LIVE API SYNC
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Total Active: {threats.length}</span>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Detected</th>
              <th className="py-3 px-3">Source IP</th>
              <th className="py-3 px-3">SOAR Action</th>
              <th className="py-3 px-3">Risk Level</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Incident ID</th>
              <th className="py-3 px-3">Attack Vector</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-slate-500 font-mono">Cargando amenazas...</td>
              </tr>
            ) : threats.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-slate-500 font-mono">No hay amenazas activas registradas.</td>
              </tr>
            ) : (
              threats.map((threat, index) => (
                <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-medium text-white">{threat.type}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{threat.detected}</td>
                  <td className="py-3 px-3 font-mono text-cyan-400">{threat.sourceIp}</td>
                  <td className="py-3 px-3 text-slate-300">{threat.soarAction}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      threat.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {threat.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      threat.status === 'Contained' ? 'bg-emerald-500/20 text-emerald-400' :
                      threat.status === 'In Analysis' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {threat.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{threat.incidentId}</td>
                  <td className="py-3 px-3 text-slate-300">{threat.attackVector}</td>
                  <td className="py-3 px-3 text-center">
                    {threat.status !== 'Contained' ? (
                      <button 
                        onClick={() => handleResolveThreat(threat.incidentId)}
                        className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[10px] px-2 py-1 rounded border border-emerald-500/30 transition-colors"
                      >
                        Contain
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Secure</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}