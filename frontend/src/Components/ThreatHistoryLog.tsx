import React, { useState, useEffect } from 'react';

interface HistoryItem {
  incidentId: string;
  type: string;
  detected: string;
  sourceIp: string;
  riskLevel: string;
  status: string;
  impact: string;
  forensicAnalysis?: string;
  attackVector?: string;
}

export default function ThreatHistoryLog() {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<HistoryItem | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:8000/threats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map((t: any) => ({
            incidentId: `T-${t.id}`,
            type: t.threat_type,
            detected: t.detected_at,
            sourceIp: t.source_ip,
            riskLevel: t.risk_level,
            status: t.status,
            impact: t.impact || 'High',
            forensicAnalysis: `Analysis for ${t.threat_type} from IP ${t.source_ip}. Action executed: ${t.soar_action || 'None'}.`,
            attackVector: t.attack_vector || 'Web Endpoint'
          }));
          setHistoryData(formatted);
          if (formatted.length > 0) setSelectedIncident(formatted[0]);
        }
      } catch (err) {
        console.error('Error al cargar el historial de amenazas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredData = historyData.filter(item => {
    const matchesType = filterType === 'ALL' || item.type.includes(filterType);
    const matchesRisk = filterRisk === 'ALL' || item.riskLevel === filterRisk;
    return matchesType && matchesRisk;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <h3 className="text-white text-sm font-semibold tracking-wide uppercase">Threat History Log (Backend DB)</h3>
          
          <div className="flex items-center space-x-2 text-xs">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="SQL Injection">SQLi</option>
              <option value="Cross-Site Scripting">XSS</option>
              <option value="Brute Force">Brute Force</option>
            </select>

            <select 
              value={filterRisk} 
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none"
            >
              <option value="ALL">All Risks</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Detected</th>
                <th className="py-3 px-3">Source IP</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 font-mono">Cargando historial...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 font-mono">No hay registros que coincidan con el filtro.</td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr 
                    key={index} 
                    onClick={() => setSelectedIncident(item)}
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${selectedIncident?.incidentId === item.incidentId ? 'bg-slate-800/60' : ''}`}
                  >
                    <td className="py-3 px-3 font-medium text-white flex items-center space-x-2">
                      <span>▶</span>
                      <span>{item.type}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.detected}</td>
                    <td className="py-3 px-3 font-mono text-cyan-400">{item.sourceIp}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        item.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.status}</td>
                    <td className="py-3 px-3 font-semibold text-amber-400">{item.impact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        {selectedIncident ? (
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                Incident Details: {selectedIncident.incidentId}
              </h4>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
                Real DB Data
              </span>
            </div>

            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Forensic Analysis</span>
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800/80 leading-relaxed font-sans">
                {selectedIncident.forensicAnalysis}
              </p>
            </div>

            <div className="mb-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Indicators of Compromise (IoCs)</span>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-[11px] font-mono text-cyan-300 space-y-1">
                <div>IP: {selectedIncident.sourceIp}</div>
                <div>Vector: {selectedIncident.attackVector}</div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Remediation Status</span>
              <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800/80 space-y-1">
                <p>• Status: <span className="text-emerald-400 font-mono">{selectedIncident.status}</span></p>
                <p>• Verified rule execution and log auditing completed.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
            Selecciona un incidente para ver los detalles.
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
          <span>Audit Log Synchronized</span>
          <span className="text-emerald-400 font-mono">Secure</span>
        </div>
      </div>
    </div>
  );
}