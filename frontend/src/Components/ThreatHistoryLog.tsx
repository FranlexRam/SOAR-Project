import React, { useState } from 'react';

interface HistoryItem {
  type: string;
  detected: string;
  sourceIp: string;
  riskLevel: string;
  status: string;
  impact: string;
  incidentId: string;
  forensicAnalysis?: string;
  attackVector?: string;
}

const historyData: HistoryItem[] = [
  { type: 'SQL Injection (SQLi)', detected: '2026-07-22T09:30:15Z', sourceIp: '192.168.1.50', riskLevel: 'High Risk', status: '2026-07-22T09:35:15Z', impact: 'High', incidentId: 'T-89310', forensicAnalysis: 'SQLi payload detected targeting database parameter. Automated containment executed successfully.', attackVector: 'Web Endpoint' },
  { type: 'Cross-Site Scripting (XSS)', detected: '2026-07-21T14:20:10Z', sourceIp: '172.16.0.5', riskLevel: 'High Risk', status: '2026-07-21T14:25:00Z', impact: 'Medium', incidentId: 'T-89311', forensicAnalysis: 'Reflected XSS script injected in input form. Sanitization rules applied and session blocked.', attackVector: 'Web App' },
  { type: 'Remote Code Execution (RCE)', detected: '2026-07-20T18:10:00Z', sourceIp: '104.24.1.1', riskLevel: 'Critical Risk', status: '2026-07-20T18:12:30Z', impact: 'High', incidentId: 'T-89312', forensicAnalysis: 'Attempted command execution via vulnerable deserialization endpoint. IP permanently blacklisted.', attackVector: 'API Gateway' },
  { type: 'Brute Force Attack', detected: '2026-07-19T11:05:22Z', sourceIp: '192.168.1.100', riskLevel: 'High Risk', status: '2026-07-19T11:10:00Z', impact: 'Low', incidentId: 'T-89313', forensicAnalysis: 'Multiple failed login attempts from single source. Rate-limiting enforced.', attackVector: 'Auth Login' },
];

export default function ThreatHistoryLog() {
  const [selectedIncident, setSelectedIncident] = useState<HistoryItem>(historyData[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Tabla de Historial (Ocupa 2 columnas en pantallas grandes) */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <h3 className="text-white text-sm font-semibold tracking-wide uppercase">Threat History Log (Past 30d)</h3>
          
          {/* Filtros de la tabla */}
          <div className="flex items-center space-x-2 text-xs">
            <input type="text" placeholder="Date Range..." className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none" />
            <select className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none">
              <option>Threat Type</option>
            </select>
            <select className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none">
              <option>Risk Level</option>
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
              {historyData.map((item, index) => (
                <tr 
                  key={index} 
                  onClick={() => setSelectedIncident(item)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3 font-medium text-white flex items-center space-x-2">
                    <span>▶</span>
                    <span>{item.type}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{item.detected}</td>
                  <td className="py-3 px-3 font-mono text-cyan-400">{item.sourceIp}</td>
                  <td className="py-3 px-3 text-amber-400 font-medium">{item.riskLevel}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{item.status}</td>
                  <td className="py-3 px-3 font-semibold text-amber-400">{item.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Lateral de Detalles e IA (Incident Details) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Incident Details: {selectedIncident.incidentId}
            </h4>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-mono">
              AI Powered
            </span>
          </div>

          {/* Análisis Forense */}
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">AI Forensic Analysis</span>
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800/80 leading-relaxed font-sans">
              {selectedIncident.forensicAnalysis}
            </p>
          </div>

          {/* Attack Timeline / IoCs */}
          <div className="mb-4 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Indicators of Compromise (IoCs)</span>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-[11px] font-mono text-cyan-300 space-y-1">
              <div>IP: {selectedIncident.sourceIp}</div>
              <div>Vector: {selectedIncident.attackVector}</div>
            </div>
          </div>

          {/* Recomendaciones de Remediación */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">AI Remediation Recommendations</span>
            <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800/80 space-y-1">
              <p>• Apply strict input parameter validation rules.</p>
              <p>• Verify WAF signature updates for payload blocking.</p>
            </div>
          </div>
        </div>

        {/* Footer del panel */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
          <span>Analyst Action Logged</span>
          <span className="text-emerald-400 font-mono">Verified Secure</span>
        </div>
      </div>

    </div>
  );
}