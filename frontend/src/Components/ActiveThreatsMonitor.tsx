import React from 'react';

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

const activeThreats: ThreatItem[] = [
  { type: 'SQL Injection (SQLi)', detected: '2026-07-22T09:30:15Z', sourceIp: '192.168.1.50', soarAction: 'Auto-Block IP', riskLevel: 'CRITICAL', status: 'Contained', incidentId: 'T-89310', attackVector: 'Web Endpoint', impact: 'High' },
  { type: 'Cross-Site Scripting (XSS)', detected: '2026-07-22T09:31:00Z', sourceIp: '172.16.0.5', soarAction: 'Isolate Endpoint', riskLevel: 'HIGH', status: 'In Analysis', incidentId: 'T-89311', attackVector: 'Web App', impact: 'Medium' },
  { type: 'Remote Code Execution (RCE)', detected: '2026-07-22T09:32:10Z', sourceIp: '104.24.1.1', soarAction: 'Notify SDC', riskLevel: 'CRITICAL', status: 'In Analysis', incidentId: 'T-89312', attackVector: 'API Gateway', impact: 'High' },
  { type: 'Brute Force Attack', detected: '2026-07-22T09:33:45Z', sourceIp: '192.168.1.100', soarAction: 'Auto-Block IP', riskLevel: 'HIGH', status: 'Resolved', incidentId: 'T-89313', attackVector: 'Auth Login', impact: 'Low' },
];

export default function ActiveThreatsMonitor() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-sm font-semibold tracking-wide uppercase">Active Threats Monitor (Real-Time)</h3>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">Live Feed</span>
      </div>

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
              <th className="py-3 px-3">Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {activeThreats.map((threat, index) => (
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
                <td className="py-3 px-3">
                  <span className={`font-semibold ${threat.impact === 'High' ? 'text-red-400' : 'text-amber-400'}`}>
                    {threat.impact}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}